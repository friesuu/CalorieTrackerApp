// The four meals, in the order they're shown.
// value: the API's Meal enum name. key: its name in a meal split ({ breakfast: 25, ... }).
export const MEALS = [
    { value: 'BREAKFAST', key: 'breakfast', label: 'Breakfast' },
    { value: 'LUNCH', key: 'lunch', label: 'Lunch' },
    { value: 'DINNER', key: 'dinner', label: 'Dinner' },
    { value: 'SNACK', key: 'snack', label: 'Snacks' },
];

// The split a new profile starts with (the same as the server's column defaults)
export const DEFAULT_SPLIT = { breakfast: 25, lunch: 35, dinner: 30, snack: 10 };

// "Breakfast". null = an entry logged before meals existed.
export function mealLabel(meal)
{
    return MEALS.find((m) => m.value === meal)?.label ?? 'Not sorted yet';
}

// "breakfast", for the middle of a sentence ("Add to breakfast")
export function mealWord(meal)
{
    return mealLabel(meal).toLowerCase();
}

// The same sums as the server (mealTargets in meal-split.ts): each meal's share is rounded, and what the
// rounding leaves over goes to the biggest meal, so the four always add up to exactly the day's target.
export function mealTargets(targetKcal, split)
{
    const targets = Object.fromEntries(MEALS.map((m) => [m.key, Math.round((targetKcal * split[m.key]) / 100)]));
    const biggest = MEALS.map((m) => m.key).reduce((a, b) => (split[b] > split[a] ? b : a));
    targets[biggest] += targetKcal - Object.values(targets).reduce((sum, kcal) => sum + kcal, 0);
    return targets;
}

// How a meal is doing: kcal left (below 0 = over) and how much of its bar to fill (full once over).
// A meal can have a 0% share: then anything eaten in it fills the bar.
export function mealProgress({ targetKcal, eatenKcal })
{
    const remaining = targetKcal - eatenKcal;
    let filled = eatenKcal > 0 ? 100 : 0;
    if (targetKcal > 0) filled = Math.min(eatenKcal / targetKcal, 1) * 100;
    return { remaining, isOver: remaining < 0, filled };
}
