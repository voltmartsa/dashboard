"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AREAS } from "@/types";

export async function createNote(area: (typeof AREAS)[number]) {
  const user = await requireUser();
  const note = await prisma.note.create({
    data: {
      title: "Untitled note",
      content: "",
      area,
      ownerId: user.id,
    },
  });
  revalidatePath("/notes");
  return { id: note.id };
}

const UpdateNoteSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "Title is required"),
  content: z.string(),
  tags: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
});

export async function updateNote(input: z.infer<typeof UpdateNoteSchema>) {
  const user = await requireUser();
  const data = UpdateNoteSchema.parse(input);

  await prisma.note.update({
    where: { id: data.id, ownerId: user.id },
    data: {
      title: data.title,
      content: data.content,
      tags: data.tags?.trim() || null,
      projectId: data.projectId || null,
      taskId: data.taskId || null,
    },
  });

  revalidatePath("/notes");
  revalidatePath(`/notes/${data.id}`);
}

export async function togglePinned(id: string) {
  const user = await requireUser();
  const note = await prisma.note.findFirstOrThrow({ where: { id, ownerId: user.id } });
  await prisma.note.update({ where: { id }, data: { pinned: !note.pinned } });
  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
}

export async function deleteNote(id: string) {
  const user = await requireUser();
  await prisma.note.delete({ where: { id, ownerId: user.id } });
  revalidatePath("/notes");
}
