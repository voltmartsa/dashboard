import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendPriceReports } from "@/lib/prices/report";
import { isAuthorizedCronRequest } from "@/lib/notifications/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await sendPriceReports();
  return NextResponse.json({ ok: true, results });
}
