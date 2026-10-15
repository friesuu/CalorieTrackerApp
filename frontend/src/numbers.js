// 2161 → "2,161". Always whole numbers: calories are never shown with decimals.
export function formatKcal(kcal)
{
    return Math.round(kcal).toLocaleString('en-MY');
}
