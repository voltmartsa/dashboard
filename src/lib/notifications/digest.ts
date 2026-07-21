import "server-only";
import { prisma } from "@/lib/prisma";
import { taskAccessWhere } from "@/lib/access";
import { formatDueDate } from "@/lib/utils";

export type Digest = { subject: string; html: string; text: string };

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function areaLabel(area: string) {
  return area === "BUSINESS" ? "Business" : "Personal";
}

function renderTaskListHtml(tasks: { title: string; area: string; priority: string }[]) {
  if (tasks.length === 0) return "<p>Nothing due. Enjoy the calm.</p>";
  return `<ul style="padding-left:18px;margin:0">${tasks
    .map(
      (t) =>
        `<li style="margin:4px 0"><strong>${escapeHtml(t.title)}</strong> <span style="color:#6b7280">(${areaLabel(t.area)} · ${t.priority.toLowerCase()})</span></li>`,
    )
    .join("")}</ul>`;
}

function renderTaskListText(tasks: { title: string; area: string; priority: string }[]) {
  if (tasks.length === 0) return "Nothing due. Enjoy the calm.";
  return tasks.map((t) => `• ${t.title} (${areaLabel(t.area)}, ${t.priority.toLowerCase()})`).join("\n");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function buildDailyDigest(userId: string): Promise<Digest> {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      dueDate: { gte: today, lt: tomorrow },
      ...taskAccessWhere(userId),
    },
    select: { title: true, area: true, priority: true },
    orderBy: { priority: "desc" },
  });

  const subject = tasks.length > 0 ? `${tasks.length} task${tasks.length === 1 ? "" : "s"} due today` : "Nothing due today";

  return {
    subject: `Squash — ${subject}`,
    html: `<h2>Today's tasks</h2>${renderTaskListHtml(tasks)}`,
    text: `Today's tasks\n\n${renderTaskListText(tasks)}`,
  };
}

export async function buildWeeklyDigest(userId: string): Promise<Digest> {
  const today = startOfToday();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [overdue, upcoming] = await Promise.all([
    prisma.task.findMany({
      where: { status: { not: "DONE" }, dueDate: { lt: today }, ...taskAccessWhere(userId) },
      select: { title: true, area: true, priority: true, dueDate: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.task.findMany({
      where: {
        status: { not: "DONE" },
        dueDate: { gte: today, lt: weekEnd },
        ...taskAccessWhere(userId),
      },
      select: { title: true, area: true, priority: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const overdueWithLabel = overdue.map((t) => ({
    ...t,
    title: `${t.title} — was due ${formatDueDate(t.dueDate)}`,
  }));

  const html = `
    ${overdue.length > 0 ? `<h2>Overdue</h2>${renderTaskListHtml(overdueWithLabel)}` : ""}
    <h2>Due this week</h2>${renderTaskListHtml(upcoming)}
  `;
  const text = `${overdue.length > 0 ? `Overdue\n\n${renderTaskListText(overdueWithLabel)}\n\n` : ""}Due this week\n\n${renderTaskListText(upcoming)}`;

  return {
    subject: `Squash — Weekly summary (${upcoming.length} due, ${overdue.length} overdue)`,
    html,
    text,
  };
}
