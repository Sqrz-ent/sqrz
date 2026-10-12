import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Same-origin relay for record_profile_engagement — lets the browser-side
// reporter (lib/outreach/engagement.ts) use navigator.sendBeacon for the
// hide/unload ping. sendBeacon can't set custom headers, so it can't carry
// Supabase's apikey/Authorization directly; posting to our own route
// sidesteps that — same reason lib/tracking/track.ts posts to /api/track
// instead of calling Supabase from the browser.
//
// record_profile_engagement is itself SECURITY DEFINER and validates the
// token/slug match in the DB, so the anon key is sufficient here — no need
// for the service-role key this route's sibling (/api/track) uses.
//
// Always responds 200 regardless of outcome: this is a fire-and-forget
// background ping, and the caller (OutreachEngagementGate /
// lib/outreach/engagement.ts) never branches on the response either way.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.token || !body?.session_id || !body?.slug) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  try {
    await supabase.rpc("record_profile_engagement", {
      p_token: body.token,
      p_session_id: body.session_id,
      p_slug: body.slug,
      p_scroll_pct: body.scroll_pct ?? 0,
      p_play: body.play ?? false,
      p_link_tap: body.link_tap ?? false,
    });
  } catch (error) {
    console.error("[outreach/engagement] rpc failed:", error);
  }

  return NextResponse.json({ ok: true });
}
