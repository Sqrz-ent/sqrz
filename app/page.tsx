import React from "react";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";

import ImageGallery from "@/components/ImageGallery";
import { getSpotifyEmbedUrl } from "@/lib/spotify";
import YouTubeGallery from "@/components/YouTubeGallery";
import ProfileCalendar from "@/components/ProfileCalendar";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import BookMeButton from "@/components/BookMeButton";
import { getSoundCloudEmbedUrl } from "@/lib/soundcloud";
import Skills from "@/components/Skills";
import Services from "@/components/Services";
import Experience from "@/components/Experience";
import {
  PROFILE_TEMPLATES,
  DEFAULT_TEMPLATE,
  LEGACY_TEMPLATE_MAP,
  type TemplateKey,
} from "@/lib/profileTemplates";
import FloatingSQRZButton from "@/components/FloatingSQRZButton";
import AnalyticsGate from "@/components/tracking/AnalyticsGate";
import MusoWidget from "@/components/MusoWidget";
import ViewTracker from "@/components/ViewTracker";
import ChatBubble from "@/components/ChatBubble";
import TicketLinkButton from "@/components/TicketLinkButton";
import BandsintownWidget from "@/components/BandsintownWidget";







export const revalidate = 0;

function getProfileGradient(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    "linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)",
    "linear-gradient(135deg, #1a0000 0%, #2d0000 50%, #0d0d0d 100%)",
    "linear-gradient(135deg, #0a1a0a 0%, #0d2b0d 50%, #0d0d0d 100%)",
    "linear-gradient(135deg, #1a1200 0%, #2d1f00 50%, #0d0d0d 100%)",
    "linear-gradient(135deg, #0a0a1a 0%, #1a0d2e 50%, #0d0d0d 100%)",
    "linear-gradient(135deg, #001a1a 0%, #002d2d 50%, #0d0d0d 100%)",
    "linear-gradient(135deg, #1a000d 0%, #2d0016 50%, #0d0d0d 100%)",
    "linear-gradient(135deg, #0d1a00 0%, #1a2d00 50%, #0d0d0d 100%)",
  ];
  return gradients[Math.abs(hash) % gradients.length];
}

/* =========================
   DATA FETCHING
========================= */


import { supabaseServer as supabase } from "@/lib/supabase-server";

async function getProfileByUsername(username: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*, profile_skills(skill_id, skills(name, category)), profile_videos(*), profile_services(*), profile_references(*), availability_blocks(id, start_date, end_date, label)")
    .eq("slug", username)
    .single();

  return data ?? null;
}

async function getProfileByDomain(domain: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*, profile_skills(skill_id, skills(name, category)), profile_videos(*), profile_services(*), profile_references(*), availability_blocks(id, start_date, end_date, label)")
    .eq("custom_domain", domain)
    .single();

  return data ?? null;
}

async function getProfileFromHost(host: string) {
  const cleanHost = host
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .trim();

  if (cleanHost.endsWith(".sqrz.com")) {
    const username = cleanHost.replace(".sqrz.com", "");
    if (!username || username === "www" || username === "sqrz") return null;
    return getProfileByUsername(username);
  }

  return getProfileByDomain(cleanHost);
}

/* =========================
   SEO METADATA
========================= */

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const rawHost = headersList.get("host");

  if (!rawHost) return {};

  const host = rawHost
    .toLowerCase()
    .replace(/:\d+$/, "") // strip :443 etc.
    .trim();

  if (!host) return {};

  const profile = await getProfileFromHost(host);
  if (!profile) return {};

  const baseUrl = `https://${host}`;
  const title = profile.display_name || profile.slug;
  const description =
    profile.description || `View ${title}'s profile on SQRZ`;

  const imageUrl =
    profile.og_image?.url ||
    (profile.avatar_url && !String(profile.avatar_url).includes("placeholder.") ? profile.avatar_url : null) ||
    `${baseUrl}/og/default.png`;

   
  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    openGraph: {
      type: "profile",
      title,
      description,
      url: baseUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

/* =========================
   PAGE
========================= */

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    preview?: string;
    username?: string;
    claim?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    ref?: string;
    sid?: string;
  }>;
}) {
  const params = await searchParams;

  console.log("[HomePage] params:", params);
  console.log("[HomePage] NODE_ENV:", process.env.NODE_ENV);

  const isPreview = params.preview === "true";
  let profile: Record<string, any> | null = null;

  // Dev shortcut: ?username=willvilla bypasses host-based routing (dev only)
  if (process.env.NODE_ENV === "development" && params.username) {
    profile = await getProfileByUsername(params.username);
    console.log("[HomePage] getProfileByUsername result:", profile);
  } else {
    const headersList = await headers();
    const rawHost = headersList.get("host");
    if (!rawHost) notFound();

    const host = rawHost.toLowerCase().replace(/:\d+$/, "").trim();

    // 🔥 IMPORTANT: ignore dashboard host
    if (host === "dashboard.sqrz.com") notFound();

    profile = await getProfileFromHost(host);
  }

  if (!profile) notFound();

  // ── View logging (debug mode — awaited so errors surface in Vercel logs) ────
  {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const headersList = await headers();
    const referrer = headersList.get("referer");

    // Session ID from cookie for consistency across page loads
    const cookieHeader = headersList.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/sqrz_session=([^;]+)/);
    const session_id = sessionMatch?.[1] || params.sid || Math.random().toString(36).slice(2);

    // Visitor fingerprint — non-reversible hash of UA + IP for deduplication
    const userAgent = headersList.get("user-agent") || "";
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "";
    const visitor_fingerprint = Buffer.from(userAgent.slice(0, 50) + ip)
      .toString("base64")
      .slice(0, 16);

    const { error: viewError } = await adminSupabase.from("profile_views").insert({
      profile_id: profile.id,
      session_id,
      visitor_fingerprint,
      utm_source: params.utm_source || params.ref || null,
      utm_medium: params.utm_medium || null,
      utm_campaign: params.utm_campaign || null,
      referrer: referrer || null,
    });

    console.log("[views] profile.id:", profile.id);
    console.log("[views] insert error:", viewError?.message || "none");
    console.log("[views] service key defined:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    adminSupabase.rpc("increment_profile_view_count", {
      p_slug: profile.slug,
    }).then(() => {});
  }

  // Claim banner — verify token matches this profile and hasn't been claimed yet
  let showClaimBanner = false;
  const claimParam = params.claim;
  if (claimParam && profile.slug) {
    const { data: claimValid } = await supabase
      .from("profiles")
      .select("id, slug, claim_token, is_claimed")
      .eq("slug", profile.slug as string)
      .eq("claim_token", claimParam)
      .eq("is_claimed", false)
      .maybeSingle();
    if (claimValid) showClaimBanner = true;
  }


  // Fetch active private links for this profile
  const { data: privateLinksData } = await supabase
    .from("private_booking_links")
    .select("link_slug, title")
    .eq("profile_id", profile.id as string)
    .eq("is_active", true)
    .eq("show_on_profile", true)
    .order("created_at", { ascending: true });

  const privateLinks = (privateLinksData ?? []) as { link_slug: string; title: string }[];

  // Fetch confirmed bookings server-side (bypass RLS via supabaseServer)
  const { data: confirmedBookings } = await supabase
    .from("bookings")
    .select("id, title, date_start, date_end, show_label")
    .eq("owner_id", profile.id as string)
    .eq("status", "confirmed")
    .not("date_start", "is", null);

  const bookingEvents = (confirmedBookings ?? []).map((b: Record<string, unknown>) => ({
    title: (b.title as string) || "Confirmed booking",
    start: b.date_start as string,
    end: (b.date_end as string | null) ?? undefined,
    show_label: (b.show_label as boolean | null) ?? false,
  }));

  // Resolve template key: handle new names, legacy hyphens, and legacy key names
  const rawTemplateKey = typeof profile.template_id === "string" ? profile.template_id : null;
  const templateKey: TemplateKey = (() => {
    if (!rawTemplateKey) return DEFAULT_TEMPLATE;
    // Direct match (new keys: midnight, neon, studio)
    if (rawTemplateKey in PROFILE_TEMPLATES) return rawTemplateKey as TemplateKey;
    // Legacy key match (dj-dark, dancer-light, tech-clean, underscore variants)
    if (rawTemplateKey in LEGACY_TEMPLATE_MAP) return LEGACY_TEMPLATE_MAP[rawTemplateKey];
    // Underscore-normalized legacy (dj_dark, dancer_light, tech_clean)
    const normalized = rawTemplateKey.replace(/-/g, "_");
    if (normalized in LEGACY_TEMPLATE_MAP) return LEGACY_TEMPLATE_MAP[normalized];
    return DEFAULT_TEMPLATE;
  })();

  const template = PROFILE_TEMPLATES[templateKey];

  const soundcloudEmbed = profile.widget_soundcloud
    ? getSoundCloudEmbedUrl(profile.widget_soundcloud)
    : null;

  const spotifyEmbed = profile.widget_spotify
    ? getSpotifyEmbedUrl(profile.widget_spotify)
    : null;

  // Mixcloud embed URL — no external fetch, just build the iframe src
  let mixcloudEmbedUrl: string | null = null;
  if (profile.widget_mixcloud) {
    try {
      const u = new URL(profile.widget_mixcloud as string);
      mixcloudEmbedUrl = `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(u.pathname)}`;
    } catch {
      mixcloudEmbedUrl = null;
    }
  }

  // Transform Dropbox share URLs to direct-access URLs
  function transformGalleryUrl(url: string): string {
    if (url.includes("dropbox.com")) {
      return url
        .replace("?dl=0", "?raw=1")
        .replace("?dl=1", "?raw=1")
        .replace("www.dropbox.com", "dl.dropboxusercontent.com");
    }
    return url;
  }

  // Photo gallery — bulletproof parse, never crash the page
  let photoGallery: string[] = [];
  try {
    const raw = profile.widget_photo_gallery;
    const arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? JSON.parse(raw) : []);
    photoGallery = (arr as unknown[])
      .filter((url): url is string => typeof url === "string" && url.length > 0)
      .map(transformGalleryUrl);
  } catch {
    photoGallery = [];
  }

  const servicesActive =
    profile.services_active === true && (profile.profile_services?.length ?? 0) > 0;

const ticket = {
    label: "Tickets on Eventim",
    provider: "eventim",
    url: "https://www.eventim.de/event/...",
  };

  const claimUrl = `https://dashboard.sqrz.com/claim?token=${encodeURIComponent(claimParam ?? "")}&slug=${encodeURIComponent(profile.slug as string ?? "")}`;

  const hasRealAvatar =
    profile.avatar_url &&
    !profile.avatar_url.includes("placeholder") &&
    profile.avatar_url.startsWith("https") &&
    !profile.avatar_url.includes("placeholder.sqrz");

  const heroBackground = hasRealAvatar
    ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85)), url(${profile.avatar_url})`
    : getProfileGradient(profile.slug || "");

  const initials = (profile.name || profile.slug)
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const heroStyle: React.CSSProperties = {
    height: 480,
    position: "relative",
    backgroundImage: heroBackground,
    backgroundSize: "cover",
    backgroundPosition: "center top",
    backgroundColor: "#1a1a1a",
  };

  return (
    <>
    {showClaimBanner && (
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#F5A623",
        color: "#fff",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        boxShadow: "0 2px 12px rgba(245,166,35,0.4)",
        flexWrap: "wrap",
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
      }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>
          Is this you? Claim this profile and take full control.
        </span>
        <a
          href={claimUrl}
          style={{
            background: "#fff",
            color: "#F5A623",
            fontWeight: 800,
            fontSize: 14,
            padding: "8px 18px",
            borderRadius: 20,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Claim Profile →
        </a>
      </div>
    )}
    <main className={`profile-page ${template.bodyClass}`}>


    {/* 🔐 Analytics + tracking (consent-gated) */}
    <AnalyticsGate
      googleAnalyticsId={profile.pixel_google}
      facebookPixelId={profile.pixel_facebook}
      hubspotPortalId={profile.hubspot_portal_id}
      hubspotEnabled={!!profile.hubspot_portal_id}
      linkedinPartnerId={profile.pixel_linkedin}
      isPreview={isPreview}
    />

{servicesActive && (
  <BookMeButton username={profile.slug} services={profile.profile_services} />
)}
<FloatingSQRZButton />
<ViewTracker username={profile.slug} />



      {/* 🖼️ Profile Hero */}
      <div style={heroStyle}>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            textAlign: "center",
            padding: "24px 20px",
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          {!hasRealAvatar && (
            <div style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "2px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 36,
                fontWeight: 800,
                fontFamily: "Barlow Condensed, sans-serif",
                color: "var(--accent-color, #F3B130)",
                letterSpacing: "-0.01em",
                userSelect: "none",
              }}>
                {initials}
              </span>
            </div>
          )}
          <h1
            className="text-accent"
            style={{ fontSize: 42, fontWeight: 700, marginBottom: 6 }}
          >
            {profile.display_name || profile.name || profile.slug}
          </h1>

          {/* Availability badge */}
          {(() => {
            const status = profile.availability_status as string | null;
            if (!status || status === "available") return (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 20,
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 8, lineHeight: 1 }}>🟢</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>Available for bookings</span>
              </div>
            );
            if (status === "limited") return (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 20,
                background: "rgba(234,179,8,0.15)",
                border: "1px solid rgba(234,179,8,0.3)",
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 8, lineHeight: 1 }}>🟡</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#facc15" }}>Limited availability</span>
              </div>
            );
            if (status === "unavailable") return (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 20,
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                marginBottom: 8,
              }}>
                <span style={{ fontSize: 8, lineHeight: 1 }}>🔴</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>Not taking bookings</span>
              </div>
            );
            return null;
          })()}

          <div
            className="social-bar"
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "center",
              gap: 16,
              color: "var(--accent-color, #F3B130)",
            }}
          >
            {profile.social_facebook && (
              <a href={profile.social_facebook} target="_blank" rel="noopener noreferrer">
                <Facebook size={20} />
              </a>
            )}
            {profile.social_instagram && (
              <a href={profile.social_instagram} target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
            )}
            {profile.social_linkedin && (
              <a href={profile.social_linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin size={20} />
              </a>
            )}
            {profile.social_youtube && (
              <a href={profile.social_youtube} target="_blank" rel="noopener noreferrer">
                <Youtube size={20} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Analytics */}

      <div
        className="profile-content"
        style={{
          margin: "0 auto",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 64,
        }}
      >
        {profile.bio && <p>{profile.bio}</p>}

        {privateLinks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Links</h2>
            {privateLinks.map((pl) => (
              <a
                key={pl.link_slug}
                href={`https://${profile.slug}.sqrz.com/${pl.link_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  textDecoration: "none",
                  color: "inherit",
                  fontWeight: 500,
                  fontSize: 15,
                  transition: "background 0.15s",
                }}
              >
                <span>{pl.title}</span>
                <span style={{ opacity: 0.5, marginLeft: 12 }}>→</span>
              </a>
            ))}
          </div>
        )}


        {profile.profile_skills?.length > 0 && <Skills skills={profile.profile_skills} />}
        {servicesActive && <Services services={profile.profile_services} />}


         {spotifyEmbed && (
          <iframe src={spotifyEmbed} width="100%" height="152" />
        )}

        {profile.widget_bandsintown ? (
        <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Tour Dates</h2>
        <BandsintownWidget bandsintownUrl={profile.widget_bandsintown} />
        </div>
        ) : null}


        {profile.pics?.length > 0 && <ImageGallery pics={profile.pics} />}


        {profile.profile_videos?.length > 0 && (
          <YouTubeGallery videos={profile.profile_videos} />
        )}

        {soundcloudEmbed && (
          <iframe src={soundcloudEmbed} width="100%" height="300" />
        )}

        {mixcloudEmbedUrl && (
          <iframe
            src={mixcloudEmbedUrl}
            width="100%"
            height="120"
            frameBorder="0"
            allow="autoplay"
            style={{ borderRadius: 8 }}
          />
        )}

        {photoGallery.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
          }}>
            {photoGallery.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt=""
                loading="lazy"
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, display: "block" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ))}
          </div>
        )}

       {profile.muso?.profile_url && (
        <MusoWidget profile={profile.muso} />
        )}

        {profile.profile_references?.length > 0 && (
          <Experience jobs={profile.profile_references} />
        )}

        {(bookingEvents.length > 0 || (profile.availability_blocks ?? []).length > 0) && (
          <ProfileCalendar
            bookingEvents={bookingEvents}
            availabilityBlocks={profile.availability_blocks ?? []}
          />
        )}



       <ChatBubble
        profileId={profile.id as string}
        profileName={(profile.display_name || profile.name || profile.slug) as string}
        />

         




      </div>
    </main>
    </>
  );
}

