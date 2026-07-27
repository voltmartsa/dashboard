import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";

function getMessagingClient() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be configured to send push notifications.");
  }

  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(raw);
    initializeApp({ credential: cert(serviceAccount) });
  }

  return getMessaging();
}

// Tokens FCM reports as dead — safe to drop from the DB so future sends
// don't keep retrying a device that's uninstalled/unregistered.
const STALE_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export async function sendPushToUser(
  userId: string,
  { title, body, data }: { title: string; body: string; data?: Record<string, string> },
) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  const tokens = subscriptions.map((s) => s.token);
  const messaging = getMessagingClient();

  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    ...(data ? { data } : {}),
  });

  const staleTokens = result.responses
    .map((r, i) => (r.success ? null : { token: tokens[i], code: r.error?.code }))
    .filter((r): r is { token: string; code: string | undefined } => r !== null)
    .filter((r) => r.code && STALE_TOKEN_CODES.has(r.code))
    .map((r) => r.token);

  if (staleTokens.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { token: { in: staleTokens } } });
  }
}
