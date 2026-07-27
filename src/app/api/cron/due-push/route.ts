import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendDueTodayPushToAllUsers } from "@/lib/notifications/due-push";
import { isAuthorizedCronRequest } from "@/lib/notifications/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await sendDueTodayPushToAllUsers();
  return NextResponse.json({ ok: true, results });
}
