import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { refreshPriceLinks } from "@/lib/prices/refresh";
import { isAuthorizedCronRequest } from "@/lib/notifications/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshPriceLinks({}, 50_000);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/prices] refresh failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
