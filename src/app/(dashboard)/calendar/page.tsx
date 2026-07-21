import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MonthGrid, type CalendarItem } from "@/components/calendar/month-grid";
import { getCurrentArea } from "@/lib/area";
import { requireUser } from "@/lib/auth";
import { taskAccessWhere, projectAccessWhere } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { parseMonthParam, monthParam, monthLabel, monthGridWeeks, dayKey } from "@/lib/calendar";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthQuery } = await searchParams;
  const { year, month } = parseMonthParam(monthQuery);
  const [area, user] = await Promise.all([getCurrentArea(), requireUser()]);

  const weeks = monthGridWeeks(year, month);
  const rangeStart = weeks[0][0];
  const rangeEnd = weeks[weeks.length - 1][6];

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        area,
        dueDate: { gte: rangeStart, lte: rangeEnd },
        ...taskAccessWhere(user.id),
      },
      select: { id: true, title: true, dueDate: true, priority: true },
    }),
    prisma.project.findMany({
      where: {
        area,
        dueDate: { gte: rangeStart, lte: rangeEnd },
        ...projectAccessWhere(user.id),
      },
      select: { id: true, name: true, dueDate: true },
    }),
  ]);

  const itemsByDay = new Map<string, CalendarItem[]>();
  function push(key: string, item: CalendarItem) {
    const list = itemsByDay.get(key) ?? [];
    list.push(item);
    itemsByDay.set(key, list);
  }

  for (const task of tasks) {
    if (!task.dueDate) continue;
    push(dayKey(task.dueDate), {
      id: task.id,
      title: task.title,
      href: `/tasks/${task.id}`,
      kind: "task",
      urgent: task.priority === "URGENT" || task.priority === "HIGH",
    });
  }
  for (const project of projects) {
    if (!project.dueDate) continue;
    push(dayKey(project.dueDate), {
      id: project.id,
      title: project.name,
      href: `/projects/${project.id}`,
      kind: "project",
    });
  }

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Deadlines for tasks and projects at a glance."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?month=${monthParam(prevMonth.year, prevMonth.month)}`}
              className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-black/[0.03]"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="min-w-[10ch] text-center text-sm font-medium">
              {monthLabel(year, month)}
            </span>
            <Link
              href={`/calendar?month=${monthParam(nextMonth.year, nextMonth.month)}`}
              className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-black/[0.03]"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Link>
          </div>
        }
      />

      <MonthGrid weeks={weeks} currentMonth={month} itemsByDay={itemsByDay} />
    </>
  );
}
