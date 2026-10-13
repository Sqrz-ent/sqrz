import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Same-origin relay for record_outreach_event — sibling to
// /api/outreach/engagement (same reasoning: lets the browser-side reporter,
// lib/outreach/engagement.ts, use a plain keepalive fetch without needing to
// carry Supabase's apikey/Authorization itself). Kept as its own route
// rather than folded into /api/outreach/engagement's handler since the two
// RPCs have different payload shapes and different validation.
//
// record_outreach_event is itself SECURITY DEFINER and validates the
// token/slug/session match in the DB, so the anon key is sufficient here.
//
// Always responds 200 regardless of outcome: this is a fire-and-forget
// background ping, and the caller (recordOutreachEvent) never branches on
// the response either way.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.token || !body?.session_id || !body?.slug || !body?.event_type) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  try {
    await supabase.rpc("record_outreach_event", {
      p_token: body.token,
      p_session_id: body.session_id,
      p_slug: body.slug,
      p_event_type: body.event_type,
      p_label: body.label ?? null,
    });
  } catch (error) {
    console.error("[outreach/event] rpc failed:", error);
  }

  return NextResponse.json({ ok: true });
}
