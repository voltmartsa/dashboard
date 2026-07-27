import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/email";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import { sendPushToUser } from "@/lib/notifications/push";
import { buildDailyDigest, buildWeeklyDigest } from "@/lib/notifications/digest";

export async function sendDigestToAllRecipients(kind: "daily" | "weekly") {
  const [recipients, pushSubs] = await Promise.all([
    prisma.notificationRecipient.findMany({
      where: {
        active: true,
        ownerId: { not: null },
        ...(kind === "daily" ? { dailyDigest: true } : { weeklyDigest: true }),
      },
    }),
    prisma.pushSubscription.findMany({ select: { userId: true }, distinct: ["userId"] }),
  ]);

  const recipientsByOwner = new Map<string, typeof recipients>();
  for (const recipient of recipients) {
    if (!recipient.ownerId) continue;
    const list = recipientsByOwner.get(recipient.ownerId) ?? [];
    list.push(recipient);
    recipientsByOwner.set(recipient.ownerId, list);
  }

  // A registered device is its own opt-in — every owner with at least one
  // push subscription gets the digest push, whether or not they also have
  // email/WhatsApp recipients configured.
  const ownerIds = new Set<string>([
    ...recipientsByOwner.keys(),
    ...pushSubs.map((s) => s.userId),
  ]);

  const results: { recipientId: string; channel: string; ok: boolean; error?: string }[] = [];

  for (const ownerId of ownerIds) {
    const digest =
      kind === "daily" ? await buildDailyDigest(ownerId) : await buildWeeklyDigest(ownerId);

    for (const recipient of recipientsByOwner.get(ownerId) ?? []) {
      if (recipient.email) {
        try {
          await sendEmail(recipient.email, digest.subject, digest.html);
          results.push({ recipientId: recipient.id, channel: "email", ok: true });
        } catch (err) {
          results.push({
            recipientId: recipient.id,
            channel: "email",
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      if (recipient.whatsapp) {
        try {
          await sendWhatsApp(recipient.whatsapp, `${digest.subject}\n\n${digest.text}`);
          results.push({ recipientId: recipient.id, channel: "whatsapp", ok: true });
        } catch (err) {
          results.push({
            recipientId: recipient.id,
            channel: "whatsapp",
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    try {
      await sendPushToUser(ownerId, {
        title: "Squash",
        body: digest.subject.replace(/^Squash — /, ""),
      });
      results.push({ recipientId: ownerId, channel: "push", ok: true });
    } catch (err) {
      results.push({
        recipientId: ownerId,
        channel: "push",
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
