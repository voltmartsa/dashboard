"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AREAS, HABIT_FREQUENCIES } from "@/types";
import { utcMidnightFromISODate } from "@/lib/dates";

const HabitInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  area: z.enum(AREAS),
  frequency: z.enum(HABIT_FREQUENCIES).default("DAILY"),
});

export async function createHabit(input: z.infer<typeof HabitInputSchema>) {
  const data = HabitInputSchema.parse(input);
  const count = await prisma.habit.count({ where: { area: data.area } });

  await prisma.habit.create({
    data: {
      name: data.name,
      area: data.area,
      frequency: data.frequency,
      order: count,
    },
  });

  revalidatePath("/habits");
}

export async function deleteHabit(id: string) {
  await prisma.habit.delete({ where: { id } });
  revalidatePath("/habits");
}

export async function toggleHabitLog(habitId: string, isoDate: string) {
  const date = utcMidnightFromISODate(isoDate);

  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date } },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({ data: { habitId, date, completed: true } });
  }

  revalidatePath("/habits");
  revalidatePath("/dashboard");
}
