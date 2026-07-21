import { isoDateFromUtcMidnight, todayUtcMidnight } from "@/lib/dates";

export function computeStreak(loggedIsoDates: Set<string>): number {
  let streak = 0;
  const cursor = todayUtcMidnight();
  while (loggedIsoDates.has(isoDateFromUtcMidnight(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
