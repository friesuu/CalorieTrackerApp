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
