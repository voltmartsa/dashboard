"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { canAccessProject, isProjectOwner } from "@/lib/access";
import { AREAS, PROJECT_STATUSES } from "@/types";

const ProjectInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  area: z.enum(AREAS),
  status: z.enum(PROJECT_STATUSES).default("ACTIVE"),
  dueDate: z.string().optional(),
});

function parseDueDate(value?: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`);
}

export async function createProject(input: z.infer<typeof ProjectInputSchema>) {
  const user = await requireUser();
  const data = ProjectInputSchema.parse(input);

  await prisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
      area: data.area,
      status: data.status,
      dueDate: parseDueDate(data.dueDate),
      ownerId: user.id,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

const UpdateProjectSchema = ProjectInputSchema.extend({ id: z.string() });

export async function updateProject(input: z.infer<typeof UpdateProjectSchema>) {
  const user = await requireUser();
  const data = UpdateProjectSchema.parse(input);

  if (!(await canAccessProject(data.id, user.id))) {
    throw new Error("You don't have access to this project.");
  }

  await prisma.project.update({
    where: { id: data.id },
    data: {
      name: data.name,
      description: data.description || null,
      area: data.area,
      status: data.status,
      dueDate: parseDueDate(data.dueDate),
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${data.id}`);
  revalidatePath("/dashboard");
}

export async function deleteProject(id: string) {
  const user = await requireUser();
  if (!(await isProjectOwner(id, user.id))) {
    throw new Error("Only the project owner can delete it.");
  }

  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
