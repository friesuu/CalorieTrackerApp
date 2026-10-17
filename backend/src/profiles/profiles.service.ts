import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';
import { SaveProfileDto } from './save-profile.dto';
import { CalorieTarget, calculateTarget } from './calorie-target';
import { DailyLog } from '../daily-logs/daily-log.entity';
import { User } from '../users/user.entity';
import { ageOn, todayIn } from '../common/dates';
import { SaveSettingsDto } from './save-settings.dto';
import { MealSplitColumns, splitColumns } from './meal-split';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    @InjectRepository(DailyLog)
    private readonly dailyLogsRepository: Repository<DailyLog>,
  ) {}

  // null = not set up yet (the app shows the first-run screen)
  findForUser(userId: number): Promise<Profile | null> {
    return this.profilesRepository.findOneBy({ userId });
  }

  // Makes the profile the first time, updates it after that (a user only ever has one)
  async save(dto: SaveProfileDto, user: User): Promise<Profile> {
    const today = todayIn(user.timezone);
    const age = ageOn(dto.birthDate, today);
    // The formula and the safe minimums are for adults
    if (age < 18 || age > 100) {
      throw new BadRequestException('Age must be between 18 and 100');
    }

    const profile = (await this.findForUser(user.id)) ?? this.profilesRepository.create({ userId: user.id });
    this.profilesRepository.merge(profile, dto);
    const saved = await this.profilesRepository.save(profile);

    // Today follows the new target straight away. Past days keep the target they had.
    // (Does nothing if nothing has been logged today yet: today's log is made with the new target anyway.)
    await this.dailyLogsRepository.update(
      { ownerId: user.id, logDate: today },
      { targetKcal: this.targetFor(saved, user).targetKcal },
    );

    return saved;
  }

  // Settings that aren't body details: the meal split and the exercise setting. Only what's sent changes.
  async saveSettings(dto: SaveSettingsDto, user: User): Promise<Profile> {
    const profile = await this.findForUser(user.id);
    if (!profile) {
      throw new BadRequestException('Set up your profile first');
    }

    // Profiles and days have the same columns for these, so one set of changes goes to both
    const changes: Partial<MealSplitColumns & { exerciseInBudget: boolean }> = {};
    if (dto.mealSplit) {
      const { breakfast, lunch, dinner, snack } = dto.mealSplit;
      // Checked here for a readable message; the database's CHECK rule would refuse it anyway
      if (breakfast + lunch + dinner + snack !== 100) {
        throw new BadRequestException('The meal split must add up to 100%');
      }
      Object.assign(changes, splitColumns(dto.mealSplit));
    }
    if (typeof dto.exerciseInBudget === 'boolean') changes.exerciseInBudget = dto.exerciseInBudget; // null = no change

    this.profilesRepository.merge(profile, changes);
    const saved = await this.profilesRepository.save(profile);

    // Today follows the new settings straight away; past days keep the ones they had (like the target)
    if (Object.keys(changes).length > 0) {
      await this.dailyLogsRepository.update({ ownerId: user.id, logDate: todayIn(user.timezone) }, changes);
    }
    return saved;
  }

  ageOf(profile: Profile, user: User): number {
    return ageOn(profile.birthDate, todayIn(user.timezone));
  }

  targetFor(profile: Profile, user: User): CalorieTarget {
    return calculateTarget({
      sex: profile.sex,
      age: this.ageOf(profile, user),
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      goal: profile.goal,
    });
  }
}
