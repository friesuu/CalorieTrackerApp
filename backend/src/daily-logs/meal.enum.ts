import { registerEnumType } from '@nestjs/graphql';

// The four sections of a day, in the order they're shown
export enum Meal {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export const MEALS_IN_ORDER = [Meal.BREAKFAST, Meal.LUNCH, Meal.DINNER, Meal.SNACK];

registerEnumType(Meal, { name: 'Meal' });
