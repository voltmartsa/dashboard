const MONTH_PARAM_RE = /^(\d{4})-(\d{2})$/;

export function parseMonthParam(value: string | undefined): { year: number; month: number } {
  const match = value ? MONTH_PARAM_RE.exec(value) : null;
  if (match) {
    return { year: Number(match[1]), month: Number(match[2]) - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function monthParam(year: number, month: number): string {
  const normalized = new Date(year, month, 1);
  return `${normalized.getFullYear()}-${String(normalized.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  );
}

export function monthGridWeeks(year: number, month: number): Date[][] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const DATE_PARAM_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateParam(value: string | undefined): Date {
  const match = value ? DATE_PARAM_RE.exec(value) : null;
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function dateParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  return days;
}

export function weekLabel(days: Date[]): string {
  const start = days[0];
  const end = days[days.length - 1];
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(start);
  const endFmt = sameMonth
    ? new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(end)
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(end);
  const year = new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(end);
  return `${startFmt} – ${endFmt}, ${year}`;
}
