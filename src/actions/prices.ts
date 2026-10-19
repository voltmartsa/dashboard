"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertPublicUrl, fetchPrice } from "@/lib/prices/fetch";
import { refreshPriceLinks } from "@/lib/prices/refresh";
import { storeName } from "@/lib/prices/stores";

const PriceItemInputSchema = z.object({
  name: z.string().trim().default(""),
  mine: z.string().trim().min(1, "Your product link is required"),
  competitors: z.array(z.string().trim()).default([]),
});

async function normalise(input: z.input<typeof PriceItemInputSchema>) {
  const data = PriceItemInputSchema.parse(input);
  const mine = (await assertPublicUrl(data.mine)).toString();
  const competitors: string[] = [];
  for (const c of data.competitors.filter(Boolean)) {
    const url = (await assertPublicUrl(c)).toString();
    if (url !== mine && !competitors.includes(url)) competitors.push(url);
  }
  return { name: data.name, mine, competitors };
}

// Next.js redacts thrown Server Action errors in production, so validation
// problems (bad link etc.) come back as data for the dialog to show.
type ActionResult = { ok: true } | { ok: false; error: string };
const fail = (err: unknown): ActionResult => ({ ok: false, error: err instanceof Error ? err.message : String(err) });

export async function createPriceItem(input: z.input<typeof PriceItemInputSchema>): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const data = await normalise(input);
    const item = await prisma.priceItem.create({
      data: {
        name: data.name,
        ownerId: user.id,
        links: {
          create: [{ url: data.mine, isMine: true }, ...data.competitors.map((url) => ({ url }))],
        },
      },
    });
    await refreshPriceLinks({ itemId: item.id });
    revalidatePath("/prices");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function updatePriceItem(id: string, input: z.input<typeof PriceItemInputSchema>): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const data = await normalise(input);
    const item = await prisma.priceItem.findFirstOrThrow({ where: { id, ownerId: user.id }, include: { links: true } });
    const wanted = new Map<string, boolean>([[data.mine, true], ...data.competitors.map((u) => [u, false] as [string, boolean])]);

    // Keep links that are still listed (and their price history); drop the rest.
    const toDelete = item.links.filter((l) => !wanted.has(l.url)).map((l) => l.id);
    const existing = new Map(item.links.map((l) => [l.url, l]));
    await prisma.$transaction([
      prisma.priceItem.update({ where: { id }, data: { name: data.name } }),
      prisma.priceLink.deleteMany({ where: { id: { in: toDelete } } }),
      ...[...wanted].map(([url, isMine]) =>
        existing.has(url)
          ? prisma.priceLink.update({ where: { id: existing.get(url)!.id }, data: { isMine } })
          : prisma.priceLink.create({ data: { itemId: id, url, isMine } }),
      ),
    ]);
    await refreshPriceLinks({ itemId: id, checkedAt: null });
    revalidatePath("/prices");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deletePriceItem(id: string) {
  const user = await requireUser();
  await prisma.priceItem.delete({ where: { id, ownerId: user.id } });
  revalidatePath("/prices");
}

export async function refreshPriceItem(id: string) {
  const user = await requireUser();
  await refreshPriceLinks({ itemId: id, item: { ownerId: user.id } });
  revalidatePath("/prices");
}

export async function refreshAllPrices() {
  const user = await requireUser();
  try {
    const result = await refreshPriceLinks({ item: { ownerId: user.id } });
    revalidatePath("/prices");
    return { ok: true as const, ...result };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

// Used by the add/edit dialog to show what a pasted link resolves to.
export async function previewPriceLink(url: string) {
  await requireUser();
  try {
    const r = await fetchPrice(url);
    return { ok: true as const, store: storeName(url), ...r };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}
