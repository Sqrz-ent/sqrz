import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.event_type) {
    return NextResponse.json({ error: "Missing event_type" }, { status: 400 });
  }

  const {
    event_type,
    profile_slug,
    profile_id,
    user_tier,
    has_custom_pixels,
    referrer,
    session_id,
  } = body;

  const country = req.headers.get("x-vercel-ip-country") ?? null;
  const user_agent = req.headers.get("user-agent") ?? null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("jitsu_events").insert({
    event_type,
    profile_slug: profile_slug ?? null,
    profile_id: profile_id ?? null,
    user_tier: user_tier ?? null,
    has_custom_pixels: has_custom_pixels ?? false,
    referrer: referrer ?? null,
    user_agent,
    country,
    session_id: session_id ?? null,
  });

  if (error) {
    console.error("[track] insert failed:", error.message);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
