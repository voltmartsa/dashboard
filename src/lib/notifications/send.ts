import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/email";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import { buildDailyDigest, buildWeeklyDigest } from "@/lib/notifications/digest";

export async function sendDigestToAllRecipients(kind: "daily" | "weekly") {
  const digest = kind === "daily" ? await buildDailyDigest() : await buildWeeklyDigest();

  const recipients = await prisma.notificationRecipient.findMany({
    where: {
      active: true,
      ...(kind === "daily" ? { dailyDigest: true } : { weeklyDigest: true }),
    },
  });

  const results: { recipientId: string; channel: string; ok: boolean; error?: string }[] = [];

  for (const recipient of recipients) {
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

  return results;
}
