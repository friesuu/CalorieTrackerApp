import { Args, Float, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DailyLog } from './daily-log.entity';
import { DailyLogsService } from './daily-logs.service';
import { AddLogEntryDto } from './add-log-entry.dto';
import { QuickAddDto } from './quick-add.dto';
import { UpdateLogEntryDto } from './update-log-entry.dto';
import { budgetKcal, burnedKcal, eatenKcal, macroTotal } from './totals';
import { Week } from './week.types';
import { MealSummary } from './meal-summary.types';
import { MEALS_IN_ORDER } from './meal.enum';
import { LogEntry } from './log-entry.entity';
import { mealTargets, splitOf } from '../profiles/meal-split';
import { Food } from '../foods/food.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

// Every change to a day returns the WHOLE day, so the page always shows the server's own totals
@UseGuards(GqlAuthGuard) // logged in only: every query and change here is for the logged-in user's own data
@Resolver(() => DailyLog)
export class DailyLogsResolver {
  constructor(private readonly dailyLogsService: DailyLogsService) {}

  // date: 'YYYY-MM-DD'. Left out = today (in the user's time zone).
  @Query(() => DailyLog)
  dailyLog(
    @Args('date', { type: () => String, nullable: true }) date: string | null,
    @CurrentUser() user: User,
  ): Promise<DailyLog> {
    return this.dailyLogsService.findDay(user, date);
  }

  // The weekly history: the 7 days ending on endDate (left out = today)
  @Query(() => Week)
  week(
    @Args('endDate', { type: () => String, nullable: true }) endDate: string | null,
    @CurrentUser() user: User,
  ): Promise<Week> {
    return this.dailyLogsService.findWeek(user, endDate);
  }

  @Query(() => [Food])
  recentFoods(@CurrentUser() user: User): Promise<Food[]> {
    return this.dailyLogsService.recentFoods(user);
  }

  @Mutation(() => DailyLog)
  addLogEntry(@Args('input') input: AddLogEntryDto, @CurrentUser() user: User): Promise<DailyLog> {
    return this.dailyLogsService.addEntry(input, user);
  }

  @Mutation(() => DailyLog)
  quickAdd(@Args('input') input: QuickAddDto, @CurrentUser() user: User): Promise<DailyLog> {
    return this.dailyLogsService.quickAdd(input, user);
  }

  @Mutation(() => DailyLog)
  updateLogEntry(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateLogEntryDto,
    @CurrentUser() user: User,
  ): Promise<DailyLog> {
    return this.dailyLogsService.updateEntry(id, input, user);
  }

  @Mutation(() => DailyLog)
  deleteLogEntry(@Args('id', { type: () => Int }) id: number, @CurrentUser() user: User): Promise<DailyLog> {
    return this.dailyLogsService.removeEntry(id, user);
  }

  // Totals, worked out from the entries each time they're asked for (see totals.ts)
  @ResolveField(() => Int)
  eatenKcal(@Parent() day: DailyLog): number {
    return eatenKcal(day.entries);
  }

  @ResolveField(() => Int)
  burnedKcal(@Parent() day: DailyLog): number {
    return burnedKcal(day.exercises);
  }

  // What you can eat that day: the target, + exercise when the day adds it (see totals.ts)
  @ResolveField(() => Int)
  budgetKcal(@Parent() day: DailyLog): number {
    return budgetKcal(day);
  }

  // budget − eaten. Negative = over.
  @ResolveField(() => Int)
  remainingKcal(@Parent() day: DailyLog): number {
    return budgetKcal(day) - eatenKcal(day.entries);
  }

  // Always all four meals, in order, each with its share of the target (the split that day)
  @ResolveField(() => [MealSummary])
  meals(@Parent() day: DailyLog): MealSummary[] {
    const targets = mealTargets(day.targetKcal, splitOf(day));
    return MEALS_IN_ORDER.map((meal) => {
      const entries = day.entries.filter((entry) => entry.meal === meal);
      return { meal, targetKcal: targets[meal], eatenKcal: eatenKcal(entries), entries };
    });
  }

  // Entries logged before meals existed, until they're moved into a meal ("Not sorted yet")
  @ResolveField(() => [LogEntry])
  unsortedEntries(@Parent() day: DailyLog): LogEntry[] {
    return day.entries.filter((entry) => entry.meal === null);
  }

  @ResolveField(() => Float, { nullable: true })
  proteinG(@Parent() day: DailyLog): number | null {
    return macroTotal(day.entries, 'proteinG');
  }

  @ResolveField(() => Float, { nullable: true })
  carbsG(@Parent() day: DailyLog): number | null {
    return macroTotal(day.entries, 'carbsG');
  }

  @ResolveField(() => Float, { nullable: true })
  fatG(@Parent() day: DailyLog): number | null {
    return macroTotal(day.entries, 'fatG');
  }
}
