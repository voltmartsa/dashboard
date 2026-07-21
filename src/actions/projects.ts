"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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
  const data = ProjectInputSchema.parse(input);

  await prisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
      area: data.area,
      status: data.status,
      dueDate: parseDueDate(data.dueDate),
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

const UpdateProjectSchema = ProjectInputSchema.extend({ id: z.string() });

export async function updateProject(input: z.infer<typeof UpdateProjectSchema>) {
  const data = UpdateProjectSchema.parse(input);

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
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
