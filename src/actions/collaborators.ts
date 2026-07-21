"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isTaskOwner, isProjectOwner } from "@/lib/access";

const EmailSchema = z.string().trim().toLowerCase().email("Enter a valid email");

async function findCollaboratorByEmail(email: string) {
  const parsed = EmailSchema.safeParse(email);
  if (!parsed.success) return { error: "Enter a valid email." } as const;

  const target = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (!target || !target.active) {
    return { error: "No account found with that email." } as const;
  }
  return { user: target } as const;
}

export async function addTaskCollaborator(
  taskId: string,
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!(await isTaskOwner(taskId, user.id))) {
    return { ok: false, error: "Only the task owner can add collaborators." };
  }

  const result = await findCollaboratorByEmail(email);
  if ("error" in result) return { ok: false, error: result.error };

  if (result.user.id === user.id) {
    return { ok: false, error: "You already own this task." };
  }

  await prisma.taskCollaborator.upsert({
    where: { taskId_userId: { taskId, userId: result.user.id } },
    create: { taskId, userId: result.user.id },
    update: {},
  });

  revalidatePath(`/tasks/${taskId}`);
  return { ok: true };
}

export async function removeTaskCollaborator(taskId: string, userId: string) {
  const user = await requireUser();
  if (!(await isTaskOwner(taskId, user.id))) {
    throw new Error("Only the task owner can remove collaborators.");
  }

  await prisma.taskCollaborator.deleteMany({ where: { taskId, userId } });

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { assigneeId: true } });
  if (task?.assigneeId === userId) {
    await prisma.task.update({ where: { id: taskId }, data: { assigneeId: null } });
  }

  revalidatePath(`/tasks/${taskId}`);
}

export async function addProjectCollaborator(
  projectId: string,
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!(await isProjectOwner(projectId, user.id))) {
    return { ok: false, error: "Only the project owner can add collaborators." };
  }

  const result = await findCollaboratorByEmail(email);
  if ("error" in result) return { ok: false, error: result.error };

  if (result.user.id === user.id) {
    return { ok: false, error: "You already own this project." };
  }

  await prisma.projectCollaborator.upsert({
    where: { projectId_userId: { projectId, userId: result.user.id } },
    create: { projectId, userId: result.user.id },
    update: {},
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function removeProjectCollaborator(projectId: string, userId: string) {
  const user = await requireUser();
  if (!(await isProjectOwner(projectId, user.id))) {
    throw new Error("Only the project owner can remove collaborators.");
  }

  await prisma.projectCollaborator.deleteMany({ where: { projectId, userId } });
  revalidatePath(`/projects/${projectId}`);
}

export async function assignTask(taskId: string, assigneeId: string | null) {
  const user = await requireUser();
  if (!(await isTaskOwner(taskId, user.id))) {
    throw new Error("Only the task owner can assign this task.");
  }

  if (assigneeId && assigneeId !== user.id) {
    const isCollaborator = await prisma.taskCollaborator.findUnique({
      where: { taskId_userId: { taskId, userId: assigneeId } },
    });
    if (!isCollaborator) {
      throw new Error("You can only assign this task to yourself or a collaborator on it.");
    }
  }

  await prisma.task.update({ where: { id: taskId }, data: { assigneeId } });
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/tasks");
}
