// Today in the browser's time zone, as 'YYYY-MM-DD' (same as the task board)
export function todayString()
{
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// The same day `years` earlier, e.g. ('2026-10-15', 18) → '2008-10-15'.
// Kept as text so it can be compared with other 'YYYY-MM-DD' dates using < and >.
export function yearsBefore(date, years)
{
    return `${Number(date.slice(0, 4)) - years}${date.slice(4)}`;
}
