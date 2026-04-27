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
    visited_via: visited_via_body,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    event_properties,
  } = body;

  const country = req.headers.get("x-vercel-ip-country") ?? null;
  const user_agent = req.headers.get("user-agent") ?? null;

  const host = req.headers.get("host") ?? "";
  const visited_via =
    host.endsWith(".sqrz.com") || host === "sqrz.com"
      ? "sqrz_domain"
      : "custom_domain";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let boost_campaign_id: string | null = null;
  if (utm_campaign?.startsWith("boost_") && profile_id) {
    const { data: campaign } = await supabase
      .from("boost_campaigns")
      .select("id")
      .eq("utm_campaign", utm_campaign)
      .eq("profile_id", profile_id)
      .maybeSingle();
    boost_campaign_id = campaign?.id ?? null;
  }

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
    visited_via: visited_via ?? visited_via_body ?? null,
    utm_source: utm_source ?? null,
    utm_medium: utm_medium ?? null,
    utm_campaign: utm_campaign ?? null,
    utm_content: utm_content ?? null,
    boost_campaign_id,
    event_properties: event_properties ?? {},
  });

  if (error) {
    console.error("[track] insert failed:", error.message);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
