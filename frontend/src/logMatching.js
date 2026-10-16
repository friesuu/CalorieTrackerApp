// The entry a new serving of `food` will be added to, or null if it gets its own row.
// The same rule as the server (addEntry in daily-logs.service.ts): same library food, and the logged copy
// still has the food's current details. If the food was edited since, it gets a new row.
// The server decides; this only lets the add sheet say what will happen.
const MAX_QUANTITY = 100;

export function entryToAddTo(entries, food, quantity = 0)
{
    return entries.find((entry) =>
        entry.foodId === food.id &&
        entry.name === food.name &&
        entry.servingSize === food.servingSize &&
        entry.servingUnit === food.servingUnit &&
        entry.kcalPerServing === food.kcalPerServing &&
        entry.proteinG === food.proteinG &&
        entry.carbsG === food.carbsG &&
        entry.fatG === food.fatG &&
        entry.quantity + quantity <= MAX_QUANTITY
    ) ?? null;
}
