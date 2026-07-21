// HabitLog.date is always stored/queried as a UTC-midnight Date. Naive
// local-time construction (`new Date(y, m, d)`) can shift across a day
// boundary depending on the server's timezone, so every read/write of a
// habit-log date goes through these helpers.

export function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

export function todayUtcMidnight(): Date {
  return toUtcMidnight(new Date());
}

export function utcMidnightFromISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function isoDateFromUtcMidnight(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const DAY_MS = 86_400_000;

export function lastNDaysUtc(n: number): Date[] {
  const today = todayUtcMidnight();
  return Array.from(
    { length: n },
    (_, i) => new Date(today.getTime() - (n - 1 - i) * DAY_MS),
  );
}
