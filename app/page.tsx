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
import AnalyticsGate from "@/components/tracking/AnalyticsGate";
import CookieBanner from "@/components/CookieBanner";
import MusoWidget from "@/components/MusoWidget";
import ViewTracker from "@/components/ViewTracker";
import ChatBubble from "@/components/ChatBubble";
import TicketLinkButton from "@/components/TicketLinkButton";
import BandsintownWidget from "@/components/BandsintownWidget";
import PhotoGallery from "@/components/PhotoGallery";
import LegalFooter from "@/components/LegalFooter";
import RefCapture from "@/components/RefCapture";







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
    .select("*, profile_skills(skill_id, skills(name, category)), profile_videos(*), profile_services(*), profile_references(*), availability_blocks(id, start_date, end_date, label, show_label)")
    .eq("slug", username)
    .order("sort_order", { referencedTable: "profile_videos", ascending: true })
    .single();

  return data ?? null;
}

async function getProfileByDomain(domain: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*, profile_skills(skill_id, skills(name, category)), profile_videos(*), profile_services(*), profile_references(*), availability_blocks(id, start_date, end_date, label, show_label)")
    .eq("custom_domain", domain)
    .order("sort_order", { referencedTable: "profile_videos", ascending: true })
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
    payment?: string;
    booking_id?: string;
    guest_token?: string;
    service?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
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

  // Photo gallery — fetched from profile_photos table
  const { data: photosData } = await supabase
    .from("profile_photos")
    .select("url")
    .eq("profile_id", profile.id as string)
    .order("sort_order", { ascending: true });
  const photoGallery = (photosData ?? [])
    .map((p: { url: string }) => transformGalleryUrl(p.url))
    .filter((u: string) => u.startsWith("http"));

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

  const heroStyle: React.CSSProperties = {
    height: 480,
    position: "relative",
    backgroundImage: heroBackground,
    backgroundSize: "cover",
    backgroundPosition: "center top",
    backgroundColor: "#1a1a1a",
  };

  const showPaymentBanner = params.payment === "success";

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

{hasActiveServices && (
  <BookMeButton username={profile.slug} services={activeServices} profileId={profile.id} planId={profile.plan_id as number | null} profileName={displayName} />
)}
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
            {displayName}
          </h1>

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
                  display: "block",
                  width: "100%",
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: `1px solid ${template.accent}66`,
                  background: `${template.accent}14`,
                  color: template.accent,
                  textDecoration: "none",
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
              >
                {icon} {pl.title}
              </a>
            );
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
            {profile.social_tiktok && (
              <a href={profile.social_tiktok} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.54V6.78a4.85 4.85 0 0 1-1.06-.09z"/>
                </svg>
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
        {profile.bio && (
          <div>
            {(profile.bio as string).split('\n\n').map((paragraph, i) => (
              <p key={i} style={{ margin: i > 0 ? "1em 0 0" : 0 }}>
                {paragraph.split('\n').map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                ))}
              </p>
            ))}
          </div>
        )}

        {profile.profile_skills?.length > 0 && <Skills skills={profile.profile_skills} />}
        {hasActiveServices && <Services services={activeServices} username={profile.slug} profileId={profile.id} planId={profile.plan_id as number | null} profileName={displayName} />}

        {profile.profile_references?.length > 0 && (
          <Experience jobs={profile.profile_references} />
        )}

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

        {photoGallery.length > 0 && <PhotoGallery urls={photoGallery} />}

        {profile.muso?.profile_url && (
          <MusoWidget profile={profile.muso} />
        )}

        {(bookingEvents.length > 0 || (profile.availability_blocks ?? []).length > 0) && (
          <ProfileCalendar
            bookingEvents={bookingEvents}
            availabilityBlocks={profile.availability_blocks ?? []}
            templateId={rawTemplateKey}
          />
        )}



       <ChatBubble
        profileId={profile.id as string}
        profileName={displayName}
        />

         




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
    </>
  );
}

