import { budgetKcal, burnedKcal } from './totals';
import { Exercise } from './exercise.entity';

// Only the fields the sums use
const exercise = (kcal: number) => ({ kcal }) as Exercise;

describe('burnedKcal', () => {
  it('adds up the exercise of the day', () => {
    expect(burnedKcal([exercise(250), exercise(120)])).toBe(370);
  });

  it('is 0 with no exercise', () => {
    expect(burnedKcal([])).toBe(0);
  });
});

describe('budgetKcal', () => {
  const exercises = [exercise(300)];

  it('is the target plus the exercise when the day adds it', () => {
    expect(budgetKcal({ targetKcal: 2161, exerciseInBudget: true, exercises })).toBe(2461);
  });

  it('is just the target when the day leaves exercise out', () => {
    expect(budgetKcal({ targetKcal: 2161, exerciseInBudget: false, exercises })).toBe(2161);
  });
});
