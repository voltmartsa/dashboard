"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AREAS, DOCUMENT_CATEGORIES } from "@/types";

const DocumentInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.enum(DOCUMENT_CATEGORIES).default("OTHER"),
  area: z.enum(AREAS),
  documentNumber: z.string().trim().optional(),
  issueDate: z.string().optional(), // yyyy-mm-dd
  expiryDate: z.string().optional(),
  notes: z.string().trim().optional(),
});

function parseDate(value?: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`);
}

export async function createDocument(input: z.infer<typeof DocumentInputSchema>) {
  const data = DocumentInputSchema.parse(input);

  await prisma.document.create({
    data: {
      name: data.name,
      category: data.category,
      area: data.area,
      documentNumber: data.documentNumber || null,
      issueDate: parseDate(data.issueDate),
      expiryDate: parseDate(data.expiryDate),
      notes: data.notes || null,
    },
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
}

const UpdateDocumentSchema = DocumentInputSchema.extend({ id: z.string() });

export async function updateDocument(input: z.infer<typeof UpdateDocumentSchema>) {
  const data = UpdateDocumentSchema.parse(input);

  await prisma.document.update({
    where: { id: data.id },
    data: {
      name: data.name,
      category: data.category,
      area: data.area,
      documentNumber: data.documentNumber || null,
      issueDate: parseDate(data.issueDate),
      expiryDate: parseDate(data.expiryDate),
      notes: data.notes || null,
    },
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
}

export async function deleteDocument(id: string) {
  await prisma.document.delete({ where: { id } });
  revalidatePath("/documents");
  revalidatePath("/dashboard");
}
