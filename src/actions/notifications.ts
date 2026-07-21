"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/email";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

const RecipientInputSchema = z
  .object({
    label: z.string().trim().optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    whatsapp: z.string().trim().optional(),
    dailyDigest: z.boolean().default(true),
    weeklyDigest: z.boolean().default(true),
  })
  .refine((data) => data.email || data.whatsapp, {
    message: "Enter an email address or a WhatsApp number.",
  });

export async function createRecipient(input: z.infer<typeof RecipientInputSchema>) {
  const data = RecipientInputSchema.parse(input);

  await prisma.notificationRecipient.create({
    data: {
      label: data.label || null,
      email: data.email || null,
      whatsapp: data.whatsapp || null,
      dailyDigest: data.dailyDigest,
      weeklyDigest: data.weeklyDigest,
    },
  });

  revalidatePath("/notifications");
}

export async function deleteRecipient(id: string) {
  await prisma.notificationRecipient.delete({ where: { id } });
  revalidatePath("/notifications");
}

export async function toggleRecipientField(
  id: string,
  field: "dailyDigest" | "weeklyDigest" | "active",
) {
  const recipient = await prisma.notificationRecipient.findUniqueOrThrow({ where: { id } });
  await prisma.notificationRecipient.update({
    where: { id },
    data: { [field]: !recipient[field] },
  });
  revalidatePath("/notifications");
}

export async function sendTestNotification(id: string): Promise<{ ok: boolean; error?: string }> {
  const recipient = await prisma.notificationRecipient.findUniqueOrThrow({ where: { id } });

  try {
    if (recipient.email) {
      await sendEmail(
        recipient.email,
        "Foundry — test notification",
        "<p>This is a test notification from your Foundry dashboard. If you can read this, email notifications are working.</p>",
      );
    }
    if (recipient.whatsapp) {
      await sendWhatsApp(
        recipient.whatsapp,
        "This is a test notification from your Foundry dashboard. If you got this, WhatsApp notifications are working.",
      );
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
