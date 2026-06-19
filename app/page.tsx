import React from "react";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
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
import PaymentSuccessBanner from "@/components/PaymentSuccessBanner";
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
import { resolveProfileSlug } from "@/lib/profile-resolver";
import AnalyticsGate from "@/components/tracking/AnalyticsGate";
import TrackingGate from "@/components/tracking/TrackingGate";
import CookieBanner from "@/components/CookieBanner";
import MusoWidget from "@/components/MusoWidget";
import TicketLinkButton from "@/components/TicketLinkButton";
import BandsintownWidget from "@/components/BandsintownWidget";
import PhotoGallery from "@/components/PhotoGallery";
import LegalFooter from "@/components/LegalFooter";
import RefCapture from "@/components/RefCapture";
import CollapsibleBio from "@/components/CollapsibleBio";
import ProfileInquiryBubble from "@/components/ProfileInquiryBubble";
import PartnerJoinBanner from "@/components/PartnerJoinBanner";
import { normalizeImageUrl, toOgImageUrl } from "@/lib/image-url";







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

function SectionHeading({
  title,
  eyebrow,
  align = "left",
}: {
  title: string;
  eyebrow?: string;
  align?: "left" | "center";
}) {
  return (
    <div style={{ marginBottom: 18, textAlign: align }}>
      {eyebrow && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.38)",
            marginBottom: 8,
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2
        style={{
          fontSize: 24,
          lineHeight: 1.15,
          fontWeight: 700,
          margin: 0,
          color: "var(--accent-color, #F3B130)",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

/* =========================
   DATA FETCHING
========================= */


import { supabaseServer as supabase } from "@/lib/supabase-server";

async function getProfileByUsername(username: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*, profile_skills(skill_id, skills(name, category)), profile_videos(*), profile_services(*), profile_references(*), availability_blocks(id, start_date, end_date, label, show_label)")
    .eq("slug", username)
    .order("sort_order", { referencedTable: "profile_videos", ascending: true })
    .single();

  return data ?? null;
}

async function getActivePartnerRefCode(profileId: string) {
  const { data } = await supabase
    .from("referral_codes")
    .select("code")
    .eq("owner_id", profileId)
    .eq("is_active", true)
    .maybeSingle();

  return (data?.code as string | null) ?? null;
}
/* =========================
   SEO METADATA
========================= */

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const resolved = await resolveProfileSlug({
    host: headersList.get("host"),
    forwardedSlug: headersList.get("x-profile-slug"),
  });

  if (!resolved) return {};

  const profile = await getProfileByUsername(resolved.slug);
  if (!profile) return {};

  const baseUrl = `https://${resolved.host}`;
  const title = profile.display_name || profile.slug;
  const description =
    profile.description || `View ${title}'s profile on SQRZ`;

  const imageUrl =
    toOgImageUrl(profile.og_image?.url) ||
    toOgImageUrl(profile.avatar_url) ||
    `${baseUrl}/og/default.png`;
  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical: baseUrl,
    },
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
    payment?: string;
    booking_id?: string;
    guest_token?: string;
    service?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    ref?: string;
    sid?: string;
  }>;
}) {
  const params = await searchParams;

  // Instant booking post-payment redirect → take buyer directly to their booking page
  if (params.payment === "success" && params.booking_id) {
    const bookingUrl = params.guest_token
      ? `https://dashboard.sqrz.com/booking/${params.booking_id}?token=${encodeURIComponent(params.guest_token)}`
      : `https://dashboard.sqrz.com/booking/${params.booking_id}`;
      // fallback: no token in params — buyer will need to authenticate via magic link
    redirect(bookingUrl);
  }

  console.log("[HomePage] params:", params);
  console.log("[HomePage] NODE_ENV:", process.env.NODE_ENV);

  const isPreview = params.preview === "true";
  const headersList = await headers();
  const resolved = await resolveProfileSlug({
    host: headersList.get("host"),
    forwardedSlug: headersList.get("x-profile-slug"),
    devUsername: params.username,
  });
  if (!resolved || resolved.host === "dashboard.sqrz.com") notFound();

  const profile = await getProfileByUsername(resolved.slug);
  console.log("[HomePage] resolved profile slug:", resolved.slug);

  if (!profile) notFound();

  const partnerRefCode =
    profile.is_partner === true
      ? await getActivePartnerRefCode(profile.id as string)
      : null;

  // ── View logging — best-effort, not render-blocking ─────────────────────────
  {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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
    const { createHash } = await import('crypto');
    const visitor_fingerprint = createHash('sha256')
      .update(userAgent + ip)
      .digest('base64')
      .slice(0, 16);

    const country = headersList.get('x-vercel-ip-country') ?? null;
    const city = decodeURIComponent(headersList.get('x-vercel-ip-city') ?? '') || null;

    // Skip logging for bots, crawlers, and anonymized traffic
    const BOT_PATTERNS = [
      'bot', 'crawler', 'spider', 'crawling',
      'googlebot', 'bingbot', 'slurp', 'duckduckbot',
      'baiduspider', 'yandexbot', 'sogou', 'exabot',
      'facebot', 'ia_archiver', 'python-requests',
      'curl/', 'wget/', 'axios/', 'node-fetch',
      'go-http-client', 'java/', 'ruby',
      'headlesschrome', 'phantomjs', 'selenium',
      'lighthouse', 'pagespeed', 'chrome-lighthouse',
      'vercel-screenshot', 'unfurl', 'whatsapp',
      'telegrambot', 'twitterbot', 'linkedinbot',
      'slackbot', 'discordbot',
    ];
    const isBot = !userAgent || BOT_PATTERNS.some(p => userAgent.toLowerCase().includes(p));
    const isTor = country === 'T1';

    const DATACENTER_CITIES = new Set([
      // US datacenters (previous)
      'santa clara', 'ashburn', 'boardman', 'hillsboro', 'ogden',
      'los lunas', 'manassas', 'dekalb', 'north charleston', 'chicago',
      // US datacenters (new)
      'council bluffs', 'the dalles', 'gallatin', 'social circle',
      'huntsville', 'north bergen', 'burlington', 'monte vista',
      // Singapore, Seoul, etc. (previous)
      'singapore', 'seoul', 'pune', 'são paulo', 'sao paulo', 'falkenstein',
    ]);
    const cityLower = (city ?? '').toLowerCase();

    if (country === 'CN') return;
    if (!isBot && !isTor && !DATACENTER_CITIES.has(cityLower)) void (async () => {
      try {
        let boost_campaign_id: string | null = null;
        if (params.utm_campaign?.startsWith("boost_")) {
          const { data: campaign } = await adminSupabase
            .from("boost_campaigns")
            .select("id")
            .eq("utm_campaign", params.utm_campaign)
            .eq("profile_id", profile.id)
            .maybeSingle();
          boost_campaign_id = campaign?.id ?? null;
        }

        const { error: viewError } = await adminSupabase.from("profile_views").insert({
          profile_id: profile.id,
          session_id,
          visitor_fingerprint,
          utm_source: params.utm_source || params.ref || null,
          utm_medium: params.utm_medium || null,
          utm_campaign: params.utm_campaign || null,
          utm_content: params.utm_content || null,
          boost_campaign_id,
          referrer: referrer || null,
          country_code: country,
          city: city,
        });

        if (viewError) {
          console.error("[views] insert error:", viewError.message);
        }
      } catch (error) {
        console.error("[views] logging failed:", error);
      }
    })();
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
    .select("link_slug, title, page_type")
    .eq("profile_id", profile.id as string)
    .eq("is_active", true)
    .eq("show_on_profile", true)
    .order("created_at", { ascending: true });

  const privateLinks = (privateLinksData ?? []) as { link_slug: string; title: string; page_type: string }[];

  // Fetch gig history — only when profile.show_gig_history is true
  let bookingEvents: { title: string; start: string; end?: string }[] = [];
  if (profile.show_gig_history) {
    const { data: gigHistory } = await supabase
      .from("bookings")
      .select("id, title, date_start, date_end")
      .eq("owner_id", profile.id as string)
      .in("status", ["confirmed", "completed"])
      .not("date_start", "is", null);

    bookingEvents = (gigHistory ?? []).map((b: Record<string, unknown>) => ({
      title: (b.title as string) || "Booked",
      start: b.date_start as string,
      end: (b.date_end as string | null) ?? undefined,
    }));
  }

  // Resolve template key: handle new names, legacy hyphens, and legacy key names
  const rawTemplateKey = typeof profile.template_id === "string" ? profile.template_id : null;
  const templateKey: TemplateKey = (() => {
    if (!rawTemplateKey) return DEFAULT_TEMPLATE;
    // Direct match (new keys: midnight, neon, studio)
    if (rawTemplateKey in PROFILE_TEMPLATES) return rawTemplateKey as TemplateKey;
    // Legacy key match (dj-dark, tech-clean, and underscore variants)
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

  // Photo gallery — fetched from profile_photos table
  const { data: photosData } = await supabase
    .from("profile_photos")
    .select("url")
    .eq("profile_id", profile.id as string)
    .order("sort_order", { ascending: true });
  const photoGallery = (photosData ?? [])
    .map((p: { url: string }) => normalizeImageUrl(p.url))
    .filter((u): u is string => !!u);

  const activeServices = (profile.profile_services ?? []).filter(
    (s: { is_active: boolean }) => s.is_active === true
  );
  const hasActiveServices = activeServices.length > 0;

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

  const displayName = (profile.brand_name || profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.slug) as string;

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const showPaymentBanner = params.payment === "success";
  const hasMusicEmbeds = Boolean(spotifyEmbed || soundcloudEmbed || mixcloudEmbedUrl);
  const hasImageGallery = Boolean(profile.pics?.length > 0);
  const hasVideos = Boolean(profile.profile_videos?.length > 0);
  const hasPhotos = photoGallery.length > 0;
  const hasCalendarContent =
    bookingEvents.length > 0 || (profile.availability_blocks ?? []).length > 0;
  const hasSocials = Boolean(
    profile.social_instagram ||
    profile.social_facebook ||
    profile.social_tiktok ||
    profile.social_youtube ||
    profile.social_linkedin
  );

  const hasAnyContent = Boolean(
    profile.bio ||
    (profile.profile_skills?.length > 0) ||
    hasActiveServices ||
    hasSocials ||
    (profile.profile_references?.length > 0) ||
    hasMusicEmbeds ||
    profile.widget_bandsintown ||
    hasImageGallery ||
    hasVideos ||
    hasPhotos ||
    profile.muso?.profile_url ||
    hasCalendarContent
  );

  const heroStyle: React.CSSProperties = {
    ...(hasAnyContent ? { height: 480 } : { minHeight: "100dvh", display: "flex", flexDirection: "column" }),
    position: "relative",
    backgroundImage: heroBackground,
    backgroundSize: "cover",
    backgroundPosition: "center top",
    backgroundColor: "#1a1a1a",
  };

  return (
    <>
    <RefCapture refCode={params.ref} />
    {showPaymentBanner && <PaymentSuccessBanner />}
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
          Is this you? Claim this profile and take control of your page.
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
    <TrackingGate
      profileSlug={profile.slug as string | null}
      profileId={profile.id as string | null}
      userTier={profile.plan_id as number | null}
      hasCustomPixels={!!(profile.pixel_google || profile.pixel_facebook || profile.pixel_linkedin || profile.hubspot_portal_id)}
    />

{hasActiveServices && (
  <BookMeButton username={profile.slug} services={activeServices} profileId={profile.id} planId={profile.plan_id as number | null} profileName={displayName} />
)}



      {/* 🖼️ Profile Hero */}
      <div style={heroStyle}>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            ...(hasAnyContent ? { height: "100%" } : { flex: 1 }),
            display: "flex",
            flexDirection: "column",
            justifyContent: hasAnyContent ? "flex-end" : "center",
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
            {displayName}
          </h1>

          {/* Empty-state tagline + claim CTA */}
          {!hasAnyContent && (
            <>
              <p style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.45)",
                margin: "0 0 24px",
                fontWeight: 400,
              }}>
                Creative Professional on SQRZ
              </p>
              {showClaimBanner && (
                <a
                  href={claimUrl}
                  style={{
                    display: "inline-block",
                    padding: "11px 28px",
                    borderRadius: 999,
                    border: `1px solid ${template.accent}99`,
                    background: "transparent",
                    color: template.accent,
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Claim this profile →
                </a>
              )}
            </>
          )}

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
            {profile.social_tiktok && (
              <a href={profile.social_tiktok} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.54V6.78a4.85 4.85 0 0 1-1.06-.09z"/>
                </svg>
              </a>
            )}
          </div>
      

          {/* Featured link pill */}
          {privateLinks[0] && (() => {
            const pl = privateLinks[0];
            const icon = pl.page_type === "book" ? "📅" : pl.page_type === "event" ? "🎤" : "⬇";
            return (
              <a
                href={`https://${profile.slug}.sqrz.com/${pl.link_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: `1px solid ${template.accent}66`,
                  background: `${template.accent}14`,
                  color: template.accent,
                  textDecoration: "none",
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  marginTop: 20,
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
              >
                {icon} {pl.title}
              </a>
            );
          })()}
          
        </div>
      </div>

      {/* Analytics */}

      <div
        className="profile-content"
        style={{
          margin: "0 auto",
          borderRadius: 16,
          padding: "40px 24px 32px",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 84,
          maxWidth: 720,
        }}
      >

        {partnerRefCode && (
          <section style={sectionShellStyle}>
            <PartnerJoinBanner refCode={partnerRefCode} />
          </section>
        )}

        {hasActiveServices && <Services services={activeServices} username={profile.slug} profileId={profile.id} planId={profile.plan_id as number | null} profileName={displayName} />}

        {profile.bio && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="About" title="Get to know me" />
            <CollapsibleBio bio={profile.bio as string} />
          </section>
        )}

        {profile.profile_skills?.length > 0 && <Skills skills={profile.profile_skills} />}

        {profile.profile_references?.length > 0 && (
          <Experience jobs={profile.profile_references} />
        )}

        {hasImageGallery && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="Featured" title="Highlights" />
            <ImageGallery pics={profile.pics} />
          </section>
        )}

        {hasPhotos && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="See more" title="Gallery" />
            <PhotoGallery urls={photoGallery} />
          </section>
        )}

        {hasMusicEmbeds && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="Listen" title="Music" />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {spotifyEmbed && (
                <iframe src={spotifyEmbed} width="100%" height="152" />
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
            </div>
          </section>
        )}

        {profile.widget_bandsintown ? (
        <section style={sectionShellStyle}>
        <SectionHeading eyebrow="Live" title="Tour Dates" />
        <BandsintownWidget bandsintownUrl={profile.widget_bandsintown} />
        </section>
        ) : null}

        {hasVideos && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="Watch" title="Video" />
            <YouTubeGallery videos={profile.profile_videos} />
          </section>
        )}

        {profile.muso?.profile_url && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="Credits" title="Muso.ai" />
            <MusoWidget profile={profile.muso} />
          </section>
        )}

        {hasCalendarContent && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="Schedule" title="Calendar" />
            <ProfileCalendar
              bookingEvents={bookingEvents}
              availabilityBlocks={profile.availability_blocks ?? []}
              templateId={rawTemplateKey}
            />
          </section>
        )}
      {/* Powered by SQRZ — subtle footer */}
      <div style={{
        textAlign: "center",
        padding: "2rem 0 1.5rem",
        opacity: 0.35,
      }}>
        <a
          href="https://sqrz.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "12px",
            letterSpacing: "0.08em",
            textDecoration: "none",
            color: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <img
            src="/brand/sqrz_logo.png"
            alt="SQRZ"
            style={{ height: "14px", width: "auto", opacity: 0.8 }}
          />
          <span>powered by SQRZ</span>
        </a>
      </div>

      </div>
    </main>
    <LegalFooter
      privacyHref={`/${profile.slug}/privacy`}
      profileName={(profile.name as string) ?? null}
      companyName={(profile.company_name as string) ?? null}
      legalForm={(profile.legal_form as string) ?? null}
      companyAddress={(profile.company_address as string) ?? null}
      companyTaxId={(profile.company_tax_id as string) ?? null}
      vatId={(profile.vat_id as string) ?? null}
      tradeRegisterCourt={(profile.trade_register_court as string) ?? null}
      tradeRegisterNumber={(profile.trade_register_number as string) ?? null}
      regulatoryBody={(profile.regulatory_body as string) ?? null}
      dpoEmail={(profile.dpo_email as string) ?? null}
      externalPrivacyUrl={(profile.external_privacy_url as string) ?? null}
      responsiblePerson={(profile.responsible_person as string) ?? null}
    />
    <CookieBanner templateId={profile.template_id as string} />
    <ProfileInquiryBubble
      profileId={profile.id as string}
      profileSlug={profile.slug as string | null}
      ownerName={displayName}
      enabled={!!profile.plan_id && Number(profile.plan_id) > 0 && profile.inquiry_chat_enabled !== false}
    />
    </>
  );
}

const sectionShellStyle: React.CSSProperties = {
  paddingTop: 4,
};
