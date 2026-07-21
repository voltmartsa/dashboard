import { ListChecks, CheckCircle2, FolderKanban, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { WeeklyBarChart, type WeeklyBarDatum } from "@/components/dashboard/weekly-bar-chart";
import { UpcomingList, type UpcomingItem } from "@/components/dashboard/upcoming-list";
import { HabitsToday } from "@/components/dashboard/habits-today";
import { ExpiringDocuments } from "@/components/dashboard/expiring-documents";
import { getCurrentArea } from "@/lib/area";
import { prisma } from "@/lib/prisma";
import { lastNDaysUtc, isoDateFromUtcMidnight, todayUtcMidnight } from "@/lib/dates";
import { DOCUMENT_EXPIRY_WARNING_DAYS } from "@/types";

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

export default async function DashboardPage() {
  const area = await getCurrentArea();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    openTasksCount,
    completedThisWeekCount,
    activeProjectsCount,
    overdueCount,
    statusBreakdown,
    completedTasksThisWeek,
    upcomingTasks,
    upcomingProjects,
    habits,
    expiringDocuments,
  ] = await Promise.all([
    prisma.task.count({ where: { area, status: { not: "DONE" } } }),
    prisma.task.count({
      where: { area, status: "DONE", completedAt: { gte: sevenDaysAgo } },
    }),
    prisma.project.count({ where: { area, status: "ACTIVE" } }),
    prisma.task.count({
      where: { area, status: { not: "DONE" }, dueDate: { lt: startOfToday } },
    }),
    prisma.task.groupBy({
      by: ["status"],
      where: { area, parentTaskId: null },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: { area, status: "DONE", completedAt: { gte: sevenDaysAgo } },
      select: { completedAt: true },
    }),
    prisma.task.findMany({
      where: { area, status: { not: "DONE" }, dueDate: { gte: startOfToday } },
      select: { id: true, title: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.project.findMany({
      where: { area, status: { not: "COMPLETED" }, dueDate: { gte: startOfToday } },
      select: { id: true, name: true, dueDate: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.habit.findMany({
      where: { area, active: true },
      orderBy: { order: "asc" },
      include: {
        logs: { where: { date: todayUtcMidnight(), completed: true }, select: { id: true } },
      },
    }),
    prisma.document.findMany({
      where: {
        area,
        expiryDate: {
          not: null,
          lte: (() => {
            const cutoff = new Date(startOfToday);
            cutoff.setDate(cutoff.getDate() + DOCUMENT_EXPIRY_WARNING_DAYS);
            return cutoff;
          })(),
        },
      },
      select: { id: true, name: true, expiryDate: true },
      orderBy: { expiryDate: "asc" },
      take: 5,
    }),
  ]);

  const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 } as Record<string, number>;
  for (const row of statusBreakdown) statusCounts[row.status] = row._count._all;

  const days = lastNDaysUtc(7);
  const completedByDay = new Map<string, number>();
  for (const t of completedTasksThisWeek) {
    if (!t.completedAt) continue;
    const key = t.completedAt.toDateString();
    completedByDay.set(key, (completedByDay.get(key) ?? 0) + 1);
  }
  const barData: WeeklyBarDatum[] = days.map((d, i) => {
    const localDay = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return {
      label: WEEKDAY[i],
      value: completedByDay.get(localDay.toDateString()) ?? 0,
      isToday: i === days.length - 1,
    };
  });

  const upcoming: UpcomingItem[] = [
    ...upcomingTasks.map((t) => ({
      id: t.id,
      title: t.title,
      href: `/tasks/${t.id}`,
      dueDate: t.dueDate!,
      kind: "task" as const,
    })),
    ...upcomingProjects.map((p) => ({
      id: p.id,
      title: p.name,
      href: `/projects/${p.id}`,
      dueDate: p.dueDate!,
      kind: "project" as const,
    })),
  ]
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  const todayIso = isoDateFromUtcMidnight(todayUtcMidnight());
  const habitsToday = habits.map((h) => ({
    id: h.id,
    name: h.name,
    done: h.logs.length > 0,
  }));

  const areaLabel = area === "BUSINESS" ? "business" : "personal";

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Plan, prioritize, and accomplish your ${areaLabel} goals.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Open tasks" value={openTasksCount} icon={ListChecks} tone="primary" hint="Not yet done" />
        <StatCard
          label="Completed this week"
          value={completedThisWeekCount}
          icon={CheckCircle2}
          hint="Last 7 days"
        />
        <StatCard label="Active projects" value={activeProjectsCount} icon={FolderKanban} />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={AlertCircle}
          tone={overdueCount > 0 ? "danger" : "default"}
          hint={overdueCount > 0 ? "Needs attention" : "All caught up"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>This week</CardTitle>
          </CardHeader>
          <WeeklyBarChart data={barData} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task breakdown</CardTitle>
          </CardHeader>
          <DonutChart
            done={statusCounts.DONE}
            inProgress={statusCounts.IN_PROGRESS}
            todo={statusCounts.TODO}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Coming up</CardTitle>
          </CardHeader>
          <UpcomingList items={upcoming} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s habits</CardTitle>
          </CardHeader>
          <HabitsToday habits={habitsToday} todayIso={todayIso} />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <ExpiringDocuments documents={expiringDocuments} />
      </Card>
    </>
  );
}
