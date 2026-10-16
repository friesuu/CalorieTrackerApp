// Which logged entry a new serving (or a moved entry) joins, so the sheet can say so before you save.
// The same rules as the server (addEntry and updateEntry in daily-logs.service.ts). The server decides;
// these only let the sheet say what will happen.
const MAX_QUANTITY = 100;

// Logged with exactly the same details (a food edited since then is a different row)
function sameDetails(a, b)
{
    return a.name === b.name &&
        a.servingSize === b.servingSize &&
        a.servingUnit === b.servingUnit &&
        a.kcalPerServing === b.kcalPerServing &&
        a.proteinG === b.proteinG &&
        a.carbsG === b.carbsG &&
        a.fatG === b.fatG;
}

// Adding `quantity` of `food` to `meal`: the entry it's added to, or null if it gets its own row.
// Same library food in the same meal, still with the food's current details, and 100 servings at most.
export function entryToAddTo(entries, food, meal, quantity = 0)
{
    return entries.find((entry) =>
        entry.meal === meal &&
        entry.foodId === food.id &&
        sameDetails(entry, food) &&
        entry.quantity + quantity <= MAX_QUANTITY
    ) ?? null;
}

// Moving `entry` (now `quantity` servings) to `meal`: the entry there it joins, or null if it moves as it is.
// Quick adds (no library food) always move as they are.
export function entryToMoveTo(entries, entry, meal, quantity = entry.quantity)
{
    if (entry.foodId === null || meal === entry.meal) return null;

    return entries.find((other) =>
        other.id !== entry.id &&
        other.meal === meal &&
        other.foodId === entry.foodId &&
        sameDetails(other, entry) &&
        other.quantity + quantity <= MAX_QUANTITY
    ) ?? null;
}
