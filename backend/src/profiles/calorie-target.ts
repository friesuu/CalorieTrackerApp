import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Sex } from './sex.enum';
import { ActivityLevel } from './activity-level.enum';
import { Goal } from './goal.enum';

// How much more than resting the body burns at each activity level (standard multipliers)
const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2,
  [ActivityLevel.LIGHT]: 1.375,
  [ActivityLevel.MODERATE]: 1.55,
  [ActivityLevel.ACTIVE]: 1.725,
  [ActivityLevel.VERY_ACTIVE]: 1.9,
};

// 1 kg of body fat is about 7,700 kcal, so losing x kg a week = eating 7,700 × x / 7 less a day
const DAILY_DEFICITS: Record<Goal, number> = {
  [Goal.MAINTAIN]: 0,
  [Goal.LOSE_0_25]: 275,
  [Goal.LOSE_0_5]: 550,
  [Goal.LOSE_0_75]: 825,
};

// The lowest daily target we'll ever suggest without a doctor
const SAFE_MINIMUMS: Record<Sex, number> = {
  [Sex.FEMALE]: 1200,
  [Sex.MALE]: 1500,
};

// Every number that goes into the target, so the app can show how it was worked out
@ObjectType()
export class CalorieTarget {
  // What you burn in a day: Mifflin-St Jeor resting rate × activity factor
  @Field(() => Int)
  maintenanceKcal: number;

  // How much less than maintenance your goal asks for
  @Field(() => Int)
  goalDeficitKcal: number;

  @Field(() => Int)
  minimumKcal: number;

  // maintenance − goal deficit, but never below the minimum
  @Field(() => Int)
  targetKcal: number;

  // True when the minimum was used instead of maintenance − goal deficit
  @Field()
  capped: boolean;
}

export interface TargetInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

// A plain function (no database, no Nest), so it's easy to test with any numbers
export function calculateTarget(input: TargetInput): CalorieTarget {
  // Mifflin-St Jeor: the same base for everyone, then +5 for men or −161 for women
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  const restingKcal = base + (input.sex === Sex.MALE ? 5 : -161);

  const maintenanceKcal = Math.round(restingKcal * ACTIVITY_FACTORS[input.activityLevel]);
  const goalDeficitKcal = DAILY_DEFICITS[input.goal];
  const minimumKcal = SAFE_MINIMUMS[input.sex];
  const wanted = maintenanceKcal - goalDeficitKcal;

  return {
    maintenanceKcal,
    goalDeficitKcal,
    minimumKcal,
    targetKcal: Math.max(wanted, minimumKcal),
    capped: wanted < minimumKcal,
  };
}
