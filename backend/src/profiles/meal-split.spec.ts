import { mealTargets } from './meal-split';
import { Meal } from '../daily-logs/meal.enum';

describe('mealTargets', () => {
  it('shares the target out by percentage', () => {
    expect(mealTargets(2000, { breakfast: 25, lunch: 35, dinner: 30, snack: 10 })).toEqual({
      [Meal.BREAKFAST]: 500,
      [Meal.LUNCH]: 700,
      [Meal.DINNER]: 600,
      [Meal.SNACK]: 200,
    });
  });

  it('always adds up to exactly the target (the rounding left-over goes to the biggest meal)', () => {
    // 540.25, 756.35, 648.3, 216.1 → rounded they make 2,160, so lunch gets the 1 left over
    const targets = mealTargets(2161, { breakfast: 25, lunch: 35, dinner: 30, snack: 10 });

    expect(targets[Meal.LUNCH]).toBe(757);
    expect(Object.values(targets).reduce((a, b) => a + b, 0)).toBe(2161);
  });

  it('a meal at 0% gets 0', () => {
    const targets = mealTargets(1800, { breakfast: 0, lunch: 50, dinner: 50, snack: 0 });

    expect(targets[Meal.BREAKFAST]).toBe(0);
    expect(targets[Meal.LUNCH] + targets[Meal.DINNER]).toBe(1800);
  });
});
