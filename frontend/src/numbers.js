// 2161 → "2,161". Always whole numbers: calories are never shown with decimals.
export function formatKcal(kcal)
{
    return Math.round(kcal).toLocaleString('en-MY');
}

// Serving sizes and grams: 1 → "1", 0.5 → "0.5", 1000 → "1,000" (no trailing ".00")
export function formatAmount(amount)
{
    return Number(amount).toLocaleString('en-MY', { maximumFractionDigits: 2 });
}

// How one serving reads: "250 ml", "1 plate" (unit only), or "1 serving" (no size or unit)
export function formatServing(size, unit)
{
    if (size === null) return unit ? `1 ${unit}` : '1 serving';
    return unit ? `${formatAmount(size)} ${unit}` : formatAmount(size);
}
