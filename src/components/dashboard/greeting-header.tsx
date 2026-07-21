import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { taskAccessWhere } from "@/lib/access";
import { fetchCurrentWeather } from "@/lib/weather";
import { todayUtcMidnight } from "@/lib/dates";
import { GreetingClient } from "@/components/dashboard/greeting-client";
import type { Area } from "@/types";

export async function GreetingHeader({ area }: { area: Area }) {
  const user = await requireUser();
  const today = todayUtcMidnight();
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const [dueTodayCount, primaryLocation] = await Promise.all([
    prisma.task.count({
      where: {
        area,
        status: { not: "DONE" },
        dueDate: { gte: today, lt: tomorrow },
        ...taskAccessWhere(user.id),
      },
    }),
    prisma.weatherLocation.findFirst({ where: { ownerId: user.id }, orderBy: { order: "asc" } }),
  ]);

  const weather = primaryLocation
    ? await fetchCurrentWeather(primaryLocation.latitude, primaryLocation.longitude)
    : null;

  return (
    <GreetingClient
      dueTodayCount={dueTodayCount}
      weather={
        weather && primaryLocation
          ? {
              label: primaryLocation.label,
              temperatureC: weather.temperatureC,
              conditionLabel: weather.condition.label,
              icon: weather.condition.icon,
            }
          : null
      }
    />
  );
}
