import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendDigestToAllRecipients } from "@/lib/notifications/send";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await sendDigestToAllRecipients("weekly");
  return NextResponse.json({ ok: true, results });
}
