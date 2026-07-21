"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canAccessTask, isTaskOwner } from "@/lib/access";
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
  const user = await requireUser();
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
      ownerId: user.id,
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
  const user = await requireUser();
  const data = UpdateTaskSchema.parse(input);

  if (!(await canAccessTask(data.id, user.id))) {
    throw new Error("You don't have access to this task.");
  }

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
  const user = await requireUser();
  if (!(await isTaskOwner(id, user.id))) {
    throw new Error("Only the task owner can delete it.");
  }

  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function addSubtask(parentTaskId: string, title: string, dueDate?: string) {
  const user = await requireUser();
  const trimmed = title.trim();
  if (!trimmed) return;

  if (!(await canAccessTask(parentTaskId, user.id))) {
    throw new Error("You don't have access to this task.");
  }

  const parent = await prisma.task.findUniqueOrThrow({ where: { id: parentTaskId } });
  const siblingCount = await prisma.task.count({ where: { parentTaskId } });

  await prisma.task.create({
    data: {
      title: trimmed,
      area: parent.area,
      parentTaskId,
      order: siblingCount,
      dueDate: parseDueDate(dueDate),
      ownerId: parent.ownerId,
    },
  });

  revalidatePath(`/tasks/${parentTaskId}`);
  revalidatePath("/calendar");
}

export async function updateSubtaskDueDate(id: string, dueDate: string) {
  const user = await requireUser();
  if (!(await canAccessTask(id, user.id))) {
    throw new Error("You don't have access to this task.");
  }

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
  const user = await requireUser();
  if (!(await canAccessTask(taskId, user.id))) {
    throw new Error("You don't have access to this task.");
  }

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
  const user = await requireUser();
  const { parentTaskId, subtasks } = ConfirmSubtasksSchema.parse(input);

  if (!(await canAccessTask(parentTaskId, user.id))) {
    throw new Error("You don't have access to this task.");
  }

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
      ownerId: parent.ownerId,
    })),
  });

  revalidatePath(`/tasks/${parentTaskId}`);
  revalidatePath("/calendar");
}

export async function toggleTaskStatus(id: string) {
  const user = await requireUser();
  if (!(await canAccessTask(id, user.id))) {
    throw new Error("You don't have access to this task.");
  }

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
