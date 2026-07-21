import "server-only";
import type { NextRequest } from "next/server";

// Accepts either Vercel Cron's automatic `Authorization: Bearer <secret>`
// header, or a `?secret=` query param (for cPanel's curl-based cron jobs).
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const queryParam = request.nextUrl.searchParams.get("secret");
  return queryParam === secret;
}
