import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export function taskAccessWhere(userId: string): Prisma.TaskWhereInput {
  return {
    OR: [
      { ownerId: userId },
      { collaborators: { some: { userId } } },
      { project: { OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }] } },
    ],
  };
}

export function projectAccessWhere(userId: string): Prisma.ProjectWhereInput {
  return { OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }] };
}

export async function canAccessTask(taskId: string, userId: string): Promise<boolean> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...taskAccessWhere(userId) },
    select: { id: true },
  });
  return !!task;
}

export async function isTaskOwner(taskId: string, userId: string): Promise<boolean> {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ownerId: userId },
    select: { id: true },
  });
  return !!task;
}

export async function canAccessProject(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...projectAccessWhere(userId) },
    select: { id: true },
  });
  return !!project;
}

export async function isProjectOwner(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true },
  });
  return !!project;
}
