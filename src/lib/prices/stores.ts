// Friendly shop names for known domains; anything else shows its hostname.
const STORE_NAMES: Record<string, string> = {
  "voltmart.co.za": "Voltmart",
  "ledtronix.co.za": "Ledtronix",
  "keyelectric.co.za": "Key Electric",
  "outlight.co.za": "Outlight Electrical",
  "britelighting.co.za": "Brite Lighting",
  "ultrasmartlights.com": "Ultra Smart Lights",
};

// Column order on the Prices table; unknown shops follow alphabetically.
export const STORE_ORDER = ["Brite Lighting", "Ledtronix", "Key Electric", "Outlight Electrical", "Ultra Smart Lights"];

export function storeName(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return STORE_NAMES[host] ?? host;
  } catch {
    return url;
  }
}

// Calendar day in South Africa, used to keep one history point per link per day.
export function priceDay(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}
