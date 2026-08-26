"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { SA_PROVINCES, ETENDERS_CATEGORIES } from "@/types";
import { scrapeAndMatchTenders } from "@/lib/tenders/run";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const TenderRuleInputSchema = z
  .object({
    label: z.string().trim().min(1, "Label is required"),
    keywords: z.string().optional(),
    categories: z.array(z.enum(ETENDERS_CATEGORIES)).default([]),
    provinces: z.array(z.enum(SA_PROVINCES)).default([]),
    active: z.boolean().default(true),
  })
  .transform((v) => ({
    label: v.label,
    keywords: splitList(v.keywords ?? ""),
    categories: v.categories,
    provinces: v.provinces,
    active: v.active,
  }))
  .refine(
    (v) => v.keywords.length > 0 || v.categories.length > 0 || v.provinces.length > 0,
    { message: "Add at least one keyword, category, or province" },
  );

export async function createTenderRule(input: z.input<typeof TenderRuleInputSchema>) {
  const user = await requireUser();
  const data = TenderRuleInputSchema.parse(input);

  await prisma.tenderRule.create({
    data: { ...data, ownerId: user.id },
  });

  revalidatePath("/tenders");
}

const UpdateTenderRuleSchema = TenderRuleInputSchema;

export async function updateTenderRule(
  id: string,
  input: z.input<typeof UpdateTenderRuleSchema>,
) {
  const user = await requireUser();
  const data = UpdateTenderRuleSchema.parse(input);

  await prisma.tenderRule.update({
    where: { id, ownerId: user.id },
    data,
  });

  revalidatePath("/tenders");
}

export async function toggleTenderRuleActive(id: string, active: boolean) {
  const user = await requireUser();
  await prisma.tenderRule.update({
    where: { id, ownerId: user.id },
    data: { active },
  });
  revalidatePath("/tenders");
}

export async function deleteTenderRule(id: string) {
  const user = await requireUser();
  await prisma.tenderRule.delete({ where: { id, ownerId: user.id } });
  revalidatePath("/tenders");
}

export async function runTenderScrapeNow() {
  await requireUser();

  // Next.js redacts thrown Server Action errors in production, which would
  // hide the real failure (e.g. eTenders blocking the request, a timeout) —
  // return it as data instead so the UI can show what actually went wrong.
  try {
    const result = await scrapeAndMatchTenders();
    revalidatePath("/tenders");
    return { ok: true as const, ...result };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}
