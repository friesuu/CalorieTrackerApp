import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, Max, Min } from 'class-validator';
import { Meal } from '../daily-logs/meal.enum';

// How the day's target is shared out between the meals, in % (always adds up to 100)
@ObjectType()
export class MealSplit {
  @Field(() => Int)
  breakfast: number;

  @Field(() => Int)
  lunch: number;

  @Field(() => Int)
  dinner: number;

  @Field(() => Int)
  snack: number;
}

// The same, sent by the app. "Adds up to 100" is checked in ProfilesService (it's about all four together).
@InputType('MealSplitInput')
export class MealSplitDto {
  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(100)
  breakfast: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(100)
  lunch: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(100)
  dinner: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(100)
  snack: number;
}

// Profiles and days both store the split as four columns with these names
export interface MealSplitColumns {
  breakfastPct: number;
  lunchPct: number;
  dinnerPct: number;
  snackPct: number;
}

export function splitOf(row: MealSplitColumns): MealSplit {
  return { breakfast: row.breakfastPct, lunch: row.lunchPct, dinner: row.dinnerPct, snack: row.snackPct };
}

export function splitColumns(split: MealSplit): MealSplitColumns {
  return { breakfastPct: split.breakfast, lunchPct: split.lunch, dinnerPct: split.dinner, snackPct: split.snack };
}

// The database refuses any split that doesn't add up to 100 (a CHECK rule on both tables)
export const SPLIT_ADDS_UP = `"breakfast_pct" + "lunch_pct" + "dinner_pct" + "snack_pct" = 100`;

// Each meal's share in kcal, as whole numbers that add up to EXACTLY the day's target.
// Rounding each one on its own can be 1 or 2 off in total (2,161 → 540 + 756 + 648 + 216 = 2,160),
// so whatever is left over goes to the biggest meal.
export function mealTargets(targetKcal: number, split: MealSplit): Record<Meal, number> {
  const pct: Record<Meal, number> = {
    [Meal.BREAKFAST]: split.breakfast,
    [Meal.LUNCH]: split.lunch,
    [Meal.DINNER]: split.dinner,
    [Meal.SNACK]: split.snack,
  };
  const targets = Object.fromEntries(
    Object.entries(pct).map(([meal, p]) => [meal, Math.round((targetKcal * p) / 100)]),
  ) as Record<Meal, number>;

  const biggest = (Object.keys(pct) as Meal[]).reduce((a, b) => (pct[b] > pct[a] ? b : a));
  const leftOver = targetKcal - Object.values(targets).reduce((sum, kcal) => sum + kcal, 0);
  targets[biggest] += leftOver;
  return targets;
}
