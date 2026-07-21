import { DOCUMENT_EXPIRY_WARNING_DAYS } from "@/types";

export type ExpiryStatus = "expired" | "expiring" | "valid" | "none";

export function getExpiryStatus(expiryDate: Date | null): ExpiryStatus {
  if (!expiryDate) return "none";
  const today = new Date(new Date().toDateString());
  const warningCutoff = new Date(today);
  warningCutoff.setDate(warningCutoff.getDate() + DOCUMENT_EXPIRY_WARNING_DAYS);

  if (expiryDate < today) return "expired";
  if (expiryDate <= warningCutoff) return "expiring";
  return "valid";
}
