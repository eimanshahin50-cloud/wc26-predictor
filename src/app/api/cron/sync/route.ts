import { NextRequest, NextResponse } from "next/server";
import { runFullSync } from "@/lib/football/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Triggered by Vercel Cron (see vercel.json). Protected by CRON_SECRET.
// Vercel automatically sends "Authorization: Bearer $CRON_SECRET" to cron routes.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runFullSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
