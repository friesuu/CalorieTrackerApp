// Today in the browser's time zone, as 'YYYY-MM-DD' (same as the task board)
export function todayString()
{
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// How old someone born on `birthDate` is on `today` (both 'YYYY-MM-DD'): the same sum as the server's ageOn
export function ageOn(birthDate, today)
{
    const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number);
    const [year, month, day] = today.split('-').map(Number);
    const hadBirthday = month > birthMonth || (month === birthMonth && day >= birthDay);
    return year - birthYear - (hadBirthday ? 0 : 1);
}

// The same day `years` earlier, e.g. ('2026-10-15', 18) → '2008-10-15'.
// Kept as text so it can be compared with other 'YYYY-MM-DD' dates using < and >.
export function yearsBefore(date, years)
{
    return `${Number(date.slice(0, 4)) - years}${date.slice(4)}`;
}

// The day `days` after `date` (negative = before). Worked out in UTC, so a time zone can't shift the day.
export function addDays(date, days)
{
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

// 'YYYY-MM-DD' shown in words. timeZone UTC matches the way the date was made above.
function formatDate(date, options)
{
    return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
}

// "Tue 13 Oct"
export function shortDate(date)
{
    return formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' });
}

// Short name for a day: "Today", "Yesterday", or "Tue 13 Oct"
export function dayLabel(date, today)
{
    if (date === today) return 'Today';
    if (date === addDays(today, -1)) return 'Yesterday';
    return shortDate(date);
}

// "Thursday 15 October"
export function longDate(date)
{
    return formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' });
}

// A week's dates as a short range: "9 – 15 Oct", or "28 Sep – 4 Oct" across two months
export function weekRange(start, end)
{
    const sameMonth = start.slice(0, 7) === end.slice(0, 7);
    const from = formatDate(start, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
    return `${from} – ${formatDate(end, { day: 'numeric', month: 'short' })}`;
}
