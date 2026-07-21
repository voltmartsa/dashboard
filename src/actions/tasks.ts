"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateSubtaskSuggestions } from "@/lib/anthropic";
import { AREAS, PRIORITIES, TASK_STATUSES } from "@/types";
import type { SubtaskSuggestion } from "@/types";

const TaskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  area: z.enum(AREAS),
  status: z.enum(TASK_STATUSES).default("TODO"),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  dueDate: z.string().optional(), // yyyy-mm-dd from <input type="date">
  projectId: z.string().optional(),
});

function parseDueDate(value?: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`);
}

export async function createTask(input: z.infer<typeof TaskInputSchema>) {
  const data = TaskInputSchema.parse(input);

  await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      area: data.area,
      status: data.status,
      priority: data.priority,
      dueDate: parseDueDate(data.dueDate),
      projectId: data.projectId || null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

const UpdateTaskSchema = TaskInputSchema.extend({
  id: z.string(),
});

export async function updateTask(input: z.infer<typeof UpdateTaskSchema>) {
  const data = UpdateTaskSchema.parse(input);

  await prisma.task.update({
    where: { id: data.id },
    data: {
      title: data.title,
      description: data.description || null,
      area: data.area,
      status: data.status,
      priority: data.priority,
      dueDate: parseDueDate(data.dueDate),
      projectId: data.projectId || null,
      completedAt: data.status === "DONE" ? new Date() : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${data.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function addSubtask(parentTaskId: string, title: string, dueDate?: string) {
  const trimmed = title.trim();
  if (!trimmed) return;

  const parent = await prisma.task.findUniqueOrThrow({ where: { id: parentTaskId } });
  const siblingCount = await prisma.task.count({ where: { parentTaskId } });

  await prisma.task.create({
    data: {
      title: trimmed,
      area: parent.area,
      parentTaskId,
      order: siblingCount,
      dueDate: parseDueDate(dueDate),
    },
  });

  revalidatePath(`/tasks/${parentTaskId}`);
  revalidatePath("/calendar");
}

export async function updateSubtaskDueDate(id: string, dueDate: string) {
  const subtask = await prisma.task.update({
    where: { id },
    data: { dueDate: parseDueDate(dueDate) },
    select: { parentTaskId: true },
  });

  if (subtask.parentTaskId) revalidatePath(`/tasks/${subtask.parentTaskId}`);
  revalidatePath("/calendar");
}

export async function getSubtaskSuggestions(
  taskId: string,
): Promise<SubtaskSuggestion[]> {
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  return generateSubtaskSuggestions({
    title: task.title,
    description: task.description,
  });
}

const ConfirmSubtasksSchema = z.object({
  parentTaskId: z.string(),
  subtasks: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        priority: z.enum(PRIORITIES).default("MEDIUM"),
        dueDate: z.string().optional(),
      }),
    )
    .min(1),
});

export async function createSubtasksFromSuggestions(
  input: z.infer<typeof ConfirmSubtasksSchema>,
) {
  const { parentTaskId, subtasks } = ConfirmSubtasksSchema.parse(input);
  const parent = await prisma.task.findUniqueOrThrow({ where: { id: parentTaskId } });
  const siblingCount = await prisma.task.count({ where: { parentTaskId } });

  await prisma.task.createMany({
    data: subtasks.map((s, i) => ({
      title: s.title,
      description: s.description || null,
      priority: s.priority,
      area: parent.area,
      parentTaskId: parent.id,
      aiGenerated: true,
      order: siblingCount + i,
      dueDate: parseDueDate(s.dueDate),
    })),
  });

  revalidatePath(`/tasks/${parentTaskId}`);
  revalidatePath("/calendar");
}

export async function toggleTaskStatus(id: string) {
  const task = await prisma.task.findUniqueOrThrow({ where: { id } });
  const nextStatus = task.status === "DONE" ? "TODO" : "DONE";

  await prisma.task.update({
    where: { id },
    data: {
      status: nextStatus,
      completedAt: nextStatus === "DONE" ? new Date() : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}
