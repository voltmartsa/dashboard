import "server-only";

// Calls Twilio's REST API directly instead of pulling in the twilio SDK —
// we only ever send one kind of message, and the SDK drags in a large
// dependency tree (including the deprecated `scmp` package).
function toWhatsAppAddress(value: string) {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

export async function sendWhatsApp(to: string, body: string) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error(
      "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured to send WhatsApp messages.",
    );
  }

  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: toWhatsAppAddress(from),
        To: toWhatsAppAddress(to),
        Body: body,
      }),
    },
  );

  if (!res.ok) {
    let message = `Twilio API responded with ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) message = `Twilio: ${data.message}`;
    } catch {
      // keep the status-based message
    }
    throw new Error(message);
  }
}
