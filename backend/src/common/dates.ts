// Today's date in a time zone, as 'YYYY-MM-DD'. The server's own clock and zone don't matter:
// a day in Kuala Lumpur starts at midnight in Kuala Lumpur, wherever the server runs.
export function todayIn(timezone: string): string {
  // en-CA writes dates as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Age in whole years on `today`. Both dates are 'YYYY-MM-DD', so comparing the 'MM-DD' parts
// as text tells whether this year's birthday has happened yet.
export function ageOn(birthDate: string, today: string): number {
  const years = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
  const hadBirthday = today.slice(5) >= birthDate.slice(5);
  return hadBirthday ? years : years - 1;
}

// Is this a real calendar day in 'YYYY-MM-DD' form? ('2026-02-30' is not)
export function isRealDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

// The day `days` after `date` (negative = before), e.g. ('2026-03-01', -1) → '2026-02-28'
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`); // UTC, so the server's own time zone can't shift the day
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
