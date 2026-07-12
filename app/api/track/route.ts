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
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    fbclid,
    gclid,
    event_properties,
  } = body;

  // Top-level fields take priority, fall back to event_properties
  const resolvedProfileSlug = profile_slug ?? event_properties?.profile_slug ?? null;
  const resolvedProfileId   = profile_id   ?? event_properties?.profile_id   ?? null;

  const country = req.headers.get("x-vercel-ip-country") ?? null;
  const user_agent = req.headers.get("user-agent") ?? null;

  const host = req.headers.get("host") ?? "";

  // visited_via — domain origin ONLY. Kept clean for domain billing/analytics:
  // sqrz_domain = [slug].sqrz.com, custom_domain = the creator's own domain,
  // null = unknown host.
  const visited_via = !host
    ? null
    : host.endsWith(".sqrz.com") || host === "sqrz.com"
    ? "sqrz_domain"
    : "custom_domain";

  // ad_source — ad attribution ONLY, independent of the domain axis. Meta's
  // in-app browser (Facebook/Instagram WebView) frequently drops UTM params, so
  // fbclid is the reliable signal — fall back to utm_source when absent. Stored
  // in event_properties (JSONB) so it's independently queryable, no migration.
  const utmSourceLc = (utm_source ?? "").toLowerCase();
  const ad_source =
    !!fbclid || ["facebook", "instagram", "meta", "fb", "ig"].includes(utmSourceLc)
      ? "meta_ad"
      : !!gclid || utmSourceLc === "google"
      ? "google_ad"
      : null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let boost_campaign_id: string | null = null;
  if (utm_campaign?.startsWith("boost_") && resolvedProfileId) {
    const { data: campaign } = await supabase
      .from("boost_campaigns")
      .select("id")
      .eq("utm_campaign", utm_campaign)
      .eq("profile_id", resolvedProfileId)
      .maybeSingle();
    boost_campaign_id = campaign?.id ?? null;
  }

  const { error } = await supabase.from("jitsu_events").insert({
    event_type,
    profile_slug: resolvedProfileSlug,
    profile_id: resolvedProfileId,
    user_tier: user_tier ?? null,
    has_custom_pixels: has_custom_pixels ?? false,
    referrer: referrer ?? null,
    user_agent,
    country,
    session_id: session_id ?? null,
    visited_via,
    utm_source: utm_source ?? null,
    utm_medium: utm_medium ?? null,
    utm_campaign: utm_campaign ?? null,
    utm_content: utm_content ?? null,
    boost_campaign_id,
    event_properties: {
      ...(event_properties ?? {}),
      ad_source,
      // Raw campaign values mirrored into JSONB for future campaign breakdowns.
      utm_source: utm_source ?? null,
      utm_medium: utm_medium ?? null,
      utm_campaign: utm_campaign ?? null,
      ...(fbclid ? { fbclid } : {}),
      ...(gclid ? { gclid } : {}),
    },
  });

  if (error) {
    console.error("[track] insert failed:", error.message);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
