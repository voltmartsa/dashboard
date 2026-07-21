import { Repeat } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { HabitRow } from "@/components/habits/habit-row";
import { getCurrentArea } from "@/lib/area";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lastNDaysUtc, isoDateFromUtcMidnight } from "@/lib/dates";
import { computeStreak } from "@/lib/streak";

export default async function HabitsPage() {
  const [area, user] = await Promise.all([getCurrentArea(), requireUser()]);
  const days = lastNDaysUtc(7);
  const lookback = lastNDaysUtc(60)[0];

  const habits = await prisma.habit.findMany({
    where: { area, active: true, ownerId: user.id },
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
