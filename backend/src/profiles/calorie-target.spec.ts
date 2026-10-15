import { calculateTarget } from './calorie-target';
import { Sex } from './sex.enum';
import { ActivityLevel } from './activity-level.enum';
import { Goal } from './goal.enum';
import { ageOn } from '../common/dates';

// Unit tests: only the maths, no database or server, so they run in milliseconds (npm test)
describe('calculateTarget', () => {
  it('works out maintenance with Mifflin-St Jeor, then takes off the goal', () => {
    // resting = 10×80 + 6.25×175 − 5×30 + 5 = 1,748.75 → × 1.55 = 2,710.6
    const result = calculateTarget({
      sex: Sex.MALE, age: 30, heightCm: 175, weightKg: 80,
      activityLevel: ActivityLevel.MODERATE, goal: Goal.LOSE_0_5,
    });

    expect(result).toEqual({
      maintenanceKcal: 2711,
      goalDeficitKcal: 550,
      minimumKcal: 1500,
      targetKcal: 2161,
      capped: false,
    });
  });

  it('uses −161 instead of +5 for women', () => {
    // resting = 10×60 + 6.25×165 − 5×40 − 161 = 1,270.25 → × 1.2 = 1,524.3
    const result = calculateTarget({
      sex: Sex.FEMALE, age: 40, heightCm: 165, weightKg: 60,
      activityLevel: ActivityLevel.SEDENTARY, goal: Goal.MAINTAIN,
    });

    expect(result.maintenanceKcal).toBe(1524);
    expect(result.targetKcal).toBe(1524); // maintain = no deficit
    expect(result.capped).toBe(false);
  });

  it('never goes below the safe minimum, and says it was capped', () => {
    // maintenance 1,524 − 825 = 699, far below 1,200
    const result = calculateTarget({
      sex: Sex.FEMALE, age: 40, heightCm: 165, weightKg: 60,
      activityLevel: ActivityLevel.SEDENTARY, goal: Goal.LOSE_0_75,
    });

    expect(result.targetKcal).toBe(1200);
    expect(result.capped).toBe(true);
  });

  it('uses 1,500 as the minimum for men', () => {
    // resting = 10×55 + 6.25×160 − 5×70 + 5 = 1,205 → × 1.2 = 1,446, already under 1,500
    const result = calculateTarget({
      sex: Sex.MALE, age: 70, heightCm: 160, weightKg: 55,
      activityLevel: ActivityLevel.SEDENTARY, goal: Goal.LOSE_0_25,
    });

    expect(result.minimumKcal).toBe(1500);
    expect(result.targetKcal).toBe(1500);
    expect(result.capped).toBe(true);
  });
});

describe('ageOn', () => {
  it('counts a birthday only once it has happened', () => {
    expect(ageOn('1996-10-15', '2026-10-14')).toBe(29); // the day before
    expect(ageOn('1996-10-15', '2026-10-15')).toBe(30); // on the day
    expect(ageOn('1996-02-29', '2026-03-01')).toBe(30); // leap-day birthday
  });
});
