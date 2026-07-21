import "server-only";
import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured to send WhatsApp messages.");
  }
  client ??= twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return client;
}

function toWhatsAppAddress(value: string) {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

export async function sendWhatsApp(to: string, body: string) {
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  await getClient().messages.create({
    from: toWhatsAppAddress(from),
    to: toWhatsAppAddress(to),
    body,
  });
}
