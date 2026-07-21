import { Repeat } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { HabitRow } from "@/components/habits/habit-row";
import { getCurrentArea } from "@/lib/area";
import { prisma } from "@/lib/prisma";
import { lastNDaysUtc, isoDateFromUtcMidnight, todayUtcMidnight } from "@/lib/dates";

function computeStreak(loggedIsoDates: Set<string>): number {
  let streak = 0;
  const cursor = todayUtcMidnight();
  while (loggedIsoDates.has(isoDateFromUtcMidnight(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export default async function HabitsPage() {
  const area = await getCurrentArea();
  const days = lastNDaysUtc(7);
  const lookback = lastNDaysUtc(60)[0];

  const habits = await prisma.habit.findMany({
    where: { area, active: true },
    orderBy: { order: "asc" },
    include: {
      logs: {
        where: { date: { gte: lookback }, completed: true },
        select: { date: true },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Habits"
        subtitle="Small things, done consistently."
        actions={<HabitFormDialog area={area} />}
      />

      {habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No habits yet"
          description="Add a habit to start building a streak."
          action={<HabitFormDialog area={area} />}
        />
      ) : (
        <Card className="p-2">
          <div className="flex flex-col divide-y divide-border">
            {habits.map((habit) => {
              const loggedIsoDates = new Set(
                habit.logs.map((log) => isoDateFromUtcMidnight(log.date)),
              );
              return (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  days={days}
                  loggedIsoDates={loggedIsoDates}
                  streak={computeStreak(loggedIsoDates)}
                />
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
