"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/notifications/push";

const RegisterTokenSchema = z.object({
  token: z.string().trim().min(1),
  platform: z.string().trim().default("android"),
});

export async function registerPushToken(input: z.infer<typeof RegisterTokenSchema>) {
  const user = await requireUser();
  const data = RegisterTokenSchema.parse(input);

  await prisma.pushSubscription.upsert({
    where: { token: data.token },
    create: { token: data.token, platform: data.platform, userId: user.id },
    update: { userId: user.id, platform: data.platform },
  });
}

export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();

  try {
    await sendPushToUser(user.id, {
      title: "Squash — test push",
      body: "If you got this, push notifications are working.",
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
