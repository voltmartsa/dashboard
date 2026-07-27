import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MonthGrid } from "@/components/calendar/month-grid";
import { WeekGrid } from "@/components/calendar/week-grid";
import type { CalendarItem } from "@/components/calendar/calendar-item";
import { getCurrentArea } from "@/lib/area";
import { requireUser } from "@/lib/auth";
import { taskAccessWhere, projectAccessWhere } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  parseMonthParam,
  monthParam,
  monthLabel,
  monthGridWeeks,
  dayKey,
  parseDateParam,
  dateParam,
  weekDays,
  weekLabel,
} from "@/lib/calendar";
import type { Area } from "@/types";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string; date?: string }>;
}) {
  const { month: monthQuery, view: viewQuery, date: dateQuery } = await searchParams;
  const view = viewQuery === "month" ? "month" : "week";
  const [area, user] = await Promise.all([getCurrentArea(), requireUser()]);

  const { year, month } = parseMonthParam(monthQuery);
  const weeks = monthGridWeeks(year, month);
  const anchor = parseDateParam(dateQuery);
  const days = weekDays(anchor);

  const rangeStart = view === "month" ? weeks[0][0] : days[0];
  const rangeEnd = view === "month" ? weeks[weeks.length - 1][6] : days[6];

  const [tasks, projects] = await Promise.all([
    prisma.task.findMany({
      where: {
        dueDate: { gte: rangeStart, lte: rangeEnd },
        ...taskAccessWhere(user.id),
      },
      select: { id: true, title: true, dueDate: true, priority: true, area: true, status: true },
    }),
    prisma.project.findMany({
      where: {
        dueDate: { gte: rangeStart, lte: rangeEnd },
        ...projectAccessWhere(user.id),
      },
      select: { id: true, name: true, dueDate: true, area: true },
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
      area: task.area as Area,
      urgent: task.priority === "URGENT" || task.priority === "HIGH",
      done: task.status === "DONE",
    });
  }
  for (const project of projects) {
    if (!project.dueDate) continue;
    push(dayKey(project.dueDate), {
      id: project.id,
      title: project.name,
      href: `/projects/${project.id}`,
      kind: "project",
      area: project.area as Area,
    });
  }

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  const prevWeekAnchor = new Date(anchor);
  prevWeekAnchor.setDate(prevWeekAnchor.getDate() - 7);
  const nextWeekAnchor = new Date(anchor);
  nextWeekAnchor.setDate(nextWeekAnchor.getDate() + 7);

  const viewToggle = (
    <div className="inline-flex items-center rounded-full bg-black/[0.04] p-1 text-sm">
      <Link
        href={`/calendar?view=week&date=${dateParam(anchor)}`}
        className={
          "rounded-full px-3 py-1.5 font-medium transition-colors " +
          (view === "week" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
        }
      >
        Week
      </Link>
      <Link
        href={`/calendar?view=month&month=${monthParam(year, month)}`}
        className={
          "rounded-full px-3 py-1.5 font-medium transition-colors " +
          (view === "month" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")
        }
      >
        Month
      </Link>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Deadlines for tasks and projects at a glance."
        actions={
          <div className="flex items-center gap-3">
            {viewToggle}
            {view === "month" ? (
              <div className="flex items-center gap-2">
                <Link
                  href={`/calendar?view=month&month=${monthParam(prevMonth.year, prevMonth.month)}`}
                  className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-black/[0.03]"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </Link>
                <span className="min-w-[10ch] text-center text-sm font-medium">
                  {monthLabel(year, month)}
                </span>
                <Link
                  href={`/calendar?view=month&month=${monthParam(nextMonth.year, nextMonth.month)}`}
                  className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-black/[0.03]"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/calendar?view=week&date=${dateParam(prevWeekAnchor)}`}
                  className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-black/[0.03]"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="size-4" />
                </Link>
                <span className="min-w-[16ch] text-center text-sm font-medium">
                  {weekLabel(days)}
                </span>
                <Link
                  href={`/calendar?view=week&date=${dateParam(nextWeekAnchor)}`}
                  className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-black/[0.03]"
                  aria-label="Next week"
                >
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            )}
          </div>
        }
      />

      {view === "month" ? (
        <MonthGrid weeks={weeks} currentMonth={month} itemsByDay={itemsByDay} defaultArea={area} />
      ) : (
        <WeekGrid days={days} itemsByDay={itemsByDay} defaultArea={area} />
      )}
    </>
  );
}
