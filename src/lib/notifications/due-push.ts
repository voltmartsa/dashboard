import "server-only";
import { prisma } from "@/lib/prisma";
import { taskAccessWhere } from "@/lib/access";
import { sendPushToUser } from "@/lib/notifications/push";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function sendDueTodayPushToAllUsers() {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const userIds = await prisma.pushSubscription
    .findMany({ select: { userId: true }, distinct: ["userId"] })
    .then((rows) => rows.map((r) => r.userId));

  const results: { userId: string; ok: boolean; error?: string }[] = [];

  for (const userId of userIds) {
    const [dueToday, overdue] = await Promise.all([
      prisma.task.count({
        where: {
          status: { not: "DONE" },
          dueDate: { gte: today, lt: tomorrow },
          ...taskAccessWhere(userId),
        },
      }),
      prisma.task.count({
        where: { status: { not: "DONE" }, dueDate: { lt: today }, ...taskAccessWhere(userId) },
      }),
    ]);

    if (dueToday === 0 && overdue === 0) continue;

    const parts = [
      dueToday > 0 ? `${dueToday} due today` : null,
      overdue > 0 ? `${overdue} overdue` : null,
    ].filter(Boolean);

    try {
      await sendPushToUser(userId, { title: "Squash", body: parts.join(", ") });
      results.push({ userId, ok: true });
    } catch (err) {
      results.push({ userId, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return results;
}
