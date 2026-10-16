import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, Not, Repository } from 'typeorm';
import { DailyLog } from './daily-log.entity';
import { LogEntry } from './log-entry.entity';
import { AddLogEntryDto } from './add-log-entry.dto';
import { QuickAddDto } from './quick-add.dto';
import { UpdateLogEntryDto } from './update-log-entry.dto';
import { Food } from '../foods/food.entity';
import { User } from '../users/user.entity';
import { ProfilesService } from '../profiles/profiles.service';
import { FoodsService } from '../foods/foods.service';
import { Week } from './week.types';
import { MealSplitColumns, splitColumns, splitOf } from '../profiles/meal-split';
import { eatenKcal } from './totals';
import { addDays, isRealDate, todayIn } from '../common/dates';

const RECENT_FOODS = 8;
const MAX_QUANTITY = 100; // the same limit as @Max(100) on quantity in the DTOs

// The details an entry copies from its food
type FoodDetails = Pick<Food, 'name' | 'servingSize' | 'servingUnit' | 'kcalPerServing' | 'proteinG' | 'carbsG' | 'fatG'>;

// Do two copies of a food match? Not if the food was edited between them.
// (Used for: an entry vs the food now, and two entries of the same food.)
function sameDetails(a: FoodDetails, b: FoodDetails): boolean {
  return (
    a.name === b.name &&
    a.servingSize === b.servingSize &&
    a.servingUnit === b.servingUnit &&
    a.kcalPerServing === b.kcalPerServing &&
    a.proteinG === b.proteinG &&
    a.carbsG === b.carbsG &&
    a.fatG === b.fatG
  );
}

// 0.1 + 0.2 = 0.3, not 0.30000000000000004 (quantities have 2 decimal places)
const addQuantities = (a: number, b: number) => Math.round((a + b) * 100) / 100;

@Injectable()
export class DailyLogsService {
  constructor(
    @InjectRepository(DailyLog)
    private readonly dailyLogsRepository: Repository<DailyLog>,
    @InjectRepository(LogEntry)
    private readonly logEntriesRepository: Repository<LogEntry>,
    @InjectRepository(Food)
    private readonly foodsRepository: Repository<Food>,
    private readonly profilesService: ProfilesService,
    private readonly foodsService: FoodsService,
  ) {}

  // One day's log, entries in the order they were added.
  // A day with nothing logged has no row yet: it comes back empty, with the current target.
  async findDay(user: User, date?: string | null): Promise<DailyLog> {
    const logDate = this.checkDate(user, date);
    const day = await this.dailyLogsRepository.findOne({
      where: { ownerId: user.id, logDate },
      relations: { entries: true },
      order: { entries: { createdAt: 'ASC', id: 'ASC' } },
    });
    if (day) return day;

    return this.dailyLogsRepository.create({
      ownerId: user.id,
      logDate,
      ...(await this.currentPlan(user)), // today's target and meal split, from the profile
      entries: [],
    });
  }

  // Log a library food. Its name, serving and calories are COPIED into the entry,
  // so editing or deleting the food later doesn't change this day.
  async addEntry(dto: AddLogEntryDto, user: User): Promise<DailyLog> {
    const food = await this.foodsService.findUsable(dto.foodId, user.id); // your own or a starter food

    const day = await this.findOrCreateDay(user, this.checkDate(user, dto.date));

    // Already in this MEAL? Add to its servings: one "Egg, 3 large" row, not three "Egg" rows.
    // (The same food at breakfast and at lunch stays two rows.) Only when the logged copy still matches
    // the food: if its calories were edited in between, a new row keeps both numbers right.
    // (Checked in code, not in the query: a where with a null value, like a missing serving unit,
    // would need IsNull() for every optional field.)
    const sameFood = (await this.logEntriesRepository.findBy({ dailyLogId: day.id, foodId: food.id, meal: dto.meal })).find(
      (entry) => sameDetails(entry, food) && entry.quantity + dto.quantity <= MAX_QUANTITY,
    );
    if (sameFood) {
      sameFood.quantity = addQuantities(sameFood.quantity, dto.quantity);
      await this.logEntriesRepository.save(sameFood);
      return this.findDay(user, day.logDate);
    }

    await this.logEntriesRepository.save(
      this.logEntriesRepository.create({
        dailyLogId: day.id,
        foodId: food.id,
        name: food.name,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        kcalPerServing: food.kcalPerServing,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        meal: dto.meal,
        quantity: dto.quantity,
      }),
    );

    return this.findDay(user, day.logDate);
  }

  // Calories without a library food: one "serving" of that many kcal
  async quickAdd(dto: QuickAddDto, user: User): Promise<DailyLog> {
    const day = await this.findOrCreateDay(user, this.checkDate(user, dto.date));
    await this.logEntriesRepository.save(
      this.logEntriesRepository.create({
        dailyLogId: day.id,
        foodId: null,
        name: dto.name ?? 'Quick add',
        servingSize: null,
        servingUnit: null,
        kcalPerServing: dto.kcal,
        meal: dto.meal,
        quantity: 1,
      }),
    );

    return this.findDay(user, day.logDate);
  }

  // Change the quantity, move it to another meal, or both
  async updateEntry(id: number, dto: UpdateLogEntryDto, user: User): Promise<DailyLog> {
    const entry = await this.findEntry(id, user);
    if (dto.quantity === null || dto.meal === null) {
      // an entry can't be emptied, or put back into "not sorted yet"
      throw new BadRequestException('Quantity and meal cannot be empty');
    }
    if (dto.quantity === undefined && dto.meal === undefined) {
      throw new BadRequestException('Send a new quantity or meal');
    }

    if (dto.quantity !== undefined) entry.quantity = dto.quantity;

    if (dto.meal !== undefined && dto.meal !== entry.meal) {
      // Moving it into a meal that already has the same food (same details): one row there, not two
      const others = entry.foodId === null
        ? []
        : await this.logEntriesRepository.findBy({ dailyLogId: entry.dailyLogId, foodId: entry.foodId, meal: dto.meal });
      const target = others.find((other) => sameDetails(other, entry) && other.quantity + entry.quantity <= MAX_QUANTITY);
      if (target) {
        target.quantity = addQuantities(target.quantity, entry.quantity);
        await this.logEntriesRepository.save(target);
        await this.logEntriesRepository.remove(entry);
        return this.findDay(user, entry.dailyLog.logDate);
      }
      entry.meal = dto.meal;
    }

    await this.logEntriesRepository.save(entry);
    return this.findDay(user, entry.dailyLog.logDate);
  }

  async removeEntry(id: number, user: User): Promise<DailyLog> {
    const entry = await this.findEntry(id, user);
    await this.logEntriesRepository.remove(entry);
    return this.findDay(user, entry.dailyLog.logDate);
  }

  // The last few DIFFERENT library foods you logged, newest first (for one-tap adding).
  // By updatedAt, not createdAt: adding more of a food that's already logged today updates that row,
  // and it should still jump to the front. Foods deleted since then are left out.
  async recentFoods(user: User): Promise<Food[]> {
    const entries = await this.logEntriesRepository.find({
      where: { dailyLog: { ownerId: user.id }, foodId: Not(IsNull()) },
      order: { updatedAt: 'DESC', id: 'DESC' },
      take: 100, // plenty to find 8 different foods among
    });

    const ids = [...new Set(entries.map((entry) => entry.foodId as number))].slice(0, RECENT_FOODS);
    if (ids.length === 0) return [];

    const foods = await this.foodsRepository.findBy([
      { id: In(ids), ownerId: user.id },
      { id: In(ids), ownerId: IsNull() }, // starter foods you've logged count too
    ]);
    return ids
      .map((id) => foods.find((food) => food.id === id))
      .filter((food): food is Food => food !== undefined); // back in "newest first" order
  }

  // The 7 days ending on endDate (default: today), oldest first, for the weekly history.
  // One query for the whole week, then each of the 7 dates is filled in (days with no row = not logged).
  async findWeek(user: User, endDate?: string | null): Promise<Week> {
    const end = this.checkDate(user, endDate);
    const start = addDays(end, -6);

    const logs = await this.dailyLogsRepository.find({
      where: { ownerId: user.id, logDate: Between(start, end) },
      relations: { entries: true },
    });

    const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
      const date = addDays(start, offset);
      const log = logs.find((l) => l.logDate === date);
      return {
        date,
        eatenKcal: log ? eatenKcal(log.entries) : 0,
        targetKcal: log ? log.targetKcal : null,
        logged: Boolean(log && log.entries.length > 0),
      };
    });

    const logged = days.filter((d) => d.logged);
    const average = (values: number[]) =>
      values.length === 0 ? null : Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);

    return {
      startDate: start,
      endDate: end,
      days,
      loggedDays: logged.length,
      averageKcal: average(logged.map((d) => d.eatenKcal)),
      averageTargetKcal: average(logged.map((d) => d.targetKcal as number)),
    };
  }

  // The day to use: today in the user's time zone when no date is given. Never a future day.
  private checkDate(user: User, date?: string | null): string {
    const today = todayIn(user.timezone);
    if (!date) return today;

    if (!isRealDate(date)) {
      throw new BadRequestException('date must be a real date in YYYY-MM-DD format');
    }
    if (date > today) {
      throw new BadRequestException("You can't log a day in the future");
    }
    return date;
  }

  // The day's row, made the first time something is logged that day (with the target as it is now).
  // "Insert, or do nothing if it's already there" in ONE statement, so two adds arriving together
  // can't both try to make the same day (the second would break the one-row-per-day rule).
  private async findOrCreateDay(user: User, logDate: string): Promise<DailyLog> {
    await this.dailyLogsRepository
      .createQueryBuilder()
      .insert()
      .into(DailyLog)
      .values({ ownerId: user.id, logDate, ...(await this.currentPlan(user)) })
      .orIgnore() // ON CONFLICT DO NOTHING
      .execute();

    return this.dailyLogsRepository.findOneByOrFail({ ownerId: user.id, logDate });
  }

  // What a new day starts with: the target and the meal split as they are now (both copied into the day)
  private async currentPlan(user: User): Promise<{ targetKcal: number } & MealSplitColumns> {
    const profile = await this.profilesService.findForUser(user.id);
    if (!profile) {
      throw new BadRequestException('Set up your profile first');
    }
    return {
      targetKcal: this.profilesService.targetFor(profile, user).targetKcal,
      ...splitColumns(splitOf(profile)),
    };
  }

  // Only your own entries: an id from someone else's log is "not found", the same as a wrong id
  private async findEntry(id: number, user: User): Promise<LogEntry> {
    const entry = await this.logEntriesRepository.findOne({
      where: { id, dailyLog: { ownerId: user.id } },
      relations: { dailyLog: true },
    });
    if (!entry) {
      throw new NotFoundException(`Entry ${id} not found`);
    }
    return entry;
  }
}
