import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendDigestToAllRecipients } from "@/lib/notifications/send";
import { isAuthorizedCronRequest } from "@/lib/notifications/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await sendDigestToAllRecipients("weekly");
  return NextResponse.json({ ok: true, results });
}
