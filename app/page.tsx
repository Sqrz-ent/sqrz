import React from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";

import { getSpotifyEmbedUrl } from "@/lib/spotify";
import YouTubeGallery from "@/components/YouTubeGallery";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import BookMeButton from "@/components/BookMeButton";
import type { FeaturedLink } from "@/lib/primaryCta";
import PaymentSuccessBanner from "@/components/PaymentSuccessBanner";
import { getSoundCloudEmbedUrl } from "@/lib/soundcloud";
import Services from "@/components/Services";
import {
  PROFILE_TEMPLATES,
  DEFAULT_TEMPLATE,
  LEGACY_TEMPLATE_MAP,
  type TemplateKey,
} from "@/lib/profileTemplates";
import { resolveProfileSlug } from "@/lib/profile-resolver";
import AnalyticsGate from "@/components/tracking/AnalyticsGate";
import TrackingGate from "@/components/tracking/TrackingGate";
import OutreachEngagementGate from "@/components/outreach/OutreachEngagementGate";
import CookieBanner from "@/components/CookieBanner";
import TicketLinkButton from "@/components/TicketLinkButton";
import BandsintownWidget from "@/components/BandsintownWidget";
import LegalFooter from "@/components/LegalFooter";
import CollapsibleBio from "@/components/CollapsibleBio";
import HeroImage from "@/components/HeroImage";
import MusicEmbeds from "@/components/MusicEmbeds";
import ShopSection from "@/components/ShopSection";
import { getShopProducts } from "@/lib/shop";
import LinkClickTracker from "@/components/LinkClickTracker";
import ProfileInquiryBubble from "@/components/ProfileInquiryBubble";
import { newViewId } from "@/lib/tracking/visitor";
import ViewTracker from "@/components/ViewTracker";
import { toOgImageUrl, normalizeImageUrl } from "@/lib/image-url";







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
    .select("*, profile_videos(*), profile_services(*)")
    .eq("slug", username)
    .order("sort_order", { referencedTable: "profile_videos", ascending: true })
    .single();

  return data ?? null;
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
    payment?: string;
    booking_id?: string;
    guest_token?: string;
    service?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    ref?: string;
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

  const shopProducts =
    profile.shop_provider === "gumroad" || profile.shop_provider === "shopify"
      ? await getShopProducts(profile.id as string)
      : [];

  // Per-load id shared by this load's profile_views row (written by the
  // ViewTracker beacon below) and every jitsu_events ping (via TrackingGate) —
  // see lib/tracking/visitor.ts.
  const viewId = newViewId();

  // ── View logging ─────────────────────────────────────────────────────────────
  // No server-side insert: a view only counts once the ViewTracker beacon
  // lands, i.e. a real browser ran the page's JS and actually showed it. Plain
  // HTTP fetches (Meta's ad-review/preview crawlers, uptime monitors) never
  // run JS, so they never count — regardless of the UA they send. Bot/
  // datacenter filtering and boost_campaign_id resolution happen on the
  // beacon request (/api/track-view + the resolve_boost_campaign_id trigger).
  // Preview mode (?preview=true, e.g. the iOS Preview tab) renders no beacon —
  // the owner looking at their own profile never counts.
  const viewCountry = headersList.get('x-vercel-ip-country') ?? null;
  const viewCity = decodeURIComponent(headersList.get('x-vercel-ip-city') ?? '') || null;
  if (!isPreview && viewCountry === 'CN') return;

  // Resolve the featured link only when it's actually the artist's selected
  // Action Button source (profiles.action_button_source === "private_link") —
  // replaces the old show_on_profile=true query (that column is retired as a
  // selection mechanism, see lib/primaryCta.ts's header comment). A stale/
  // deleted action_button_link_id (FK is ON DELETE SET NULL, but a link could
  // in principle be inactive) just resolves to no row, which getPrimaryCTA
  // treats the same as no selection — never a broken button.
  let featuredLink: FeaturedLink | null = null;
  if (profile.action_button_source === "private_link" && profile.action_button_link_id) {
    const { data: linkData } = await supabase
      .from("private_booking_links")
      .select("id, link_slug, title, external_url, cta_label")
      .eq("id", profile.action_button_link_id as string)
      .eq("is_active", true)
      .maybeSingle();

    if (linkData) {
      featuredLink = {
        id: linkData.id,
        linkSlug: linkData.link_slug,
        title: linkData.title,
        externalUrl: linkData.external_url,
        ctaLabel: linkData.cta_label,
      };
    }
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

  const activeServices = (profile.profile_services ?? []).filter(
    (s: { is_active: boolean }) => s.is_active === true
  );
  const hasActiveServices = activeServices.length > 0;

const ticket = {
    label: "Tickets on Eventim",
    provider: "eventim",
    url: "https://www.eventim.de/event/...",
  };

  const hasRealAvatar =
    profile.avatar_url &&
    !profile.avatar_url.includes("placeholder") &&
    profile.avatar_url.startsWith("https") &&
    !profile.avatar_url.includes("placeholder.sqrz");

  // Gradient background is only used when there's no real avatar; a real avatar
  // is rendered via <HeroImage> (img + transform) with a separate overlay.
  const heroBackground = getProfileGradient(profile.slug || "");

  const displayName = (profile.brand_name || profile.name || profile.slug) as string;

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const showPaymentBanner = params.payment === "success";
  const hasMusicEmbeds = Boolean(spotifyEmbed || soundcloudEmbed || mixcloudEmbedUrl);
  // Any configured scheduling/reservation provider (Calendly, HubSpot, or the
  // generic link-out catch-all in lib/primaryCta.ts) — shown whenever a URL is
  // set. Same free-tier, data-driven visibility as the music/social embeds (no
  // plan gate). Gates whether BookMeButton renders at all for profiles with no
  // active services, so this must stay provider-agnostic, not Calendly-only.
  const hasScheduling = Boolean(profile.scheduling_provider) && Boolean(profile.scheduling_url);
  const hasVideos = Boolean(profile.profile_videos?.length > 0);
  const hasSocials = Boolean(
    profile.social_instagram ||
    profile.social_facebook ||
    profile.social_tiktok ||
    profile.social_youtube ||
    profile.social_linkedin
  );

  // Provider-aware — beatstars is driven by beatstars_url; gumroad/shopify
  // need at least one fetched product before the section counts as "there's
  // something here" (matches ShopSection's own empty-grid null-return).
  const hasShop =
    profile.shop_provider === "beatstars"
      ? Boolean(profile.beatstars_url)
      : profile.shop_provider === "gumroad" || profile.shop_provider === "shopify"
      ? shopProducts.length > 0
      : false;

  const hasAnyContent = Boolean(
    profile.bio ||
    hasActiveServices ||
    hasSocials ||
    hasMusicEmbeds ||
    profile.widget_bandsintown ||
    hasShop ||
    hasVideos ||
    hasScheduling
  );

  // Focal point (normalized 0..1) + zoom set by the artist in the dashboard.
  // Fallback for profiles that never set a focal point: 0.5 / 0 (center-top,
  // matching the previous "50% 0%"). Zoom defaults to 1 (exactly cover).
  const heroFocalX = profile.avatar_focal_x != null ? Number(profile.avatar_focal_x) : 0.5;
  const heroFocalY = profile.avatar_focal_y != null ? Number(profile.avatar_focal_y) : 0;
  const heroZoom = profile.avatar_zoom != null ? Number(profile.avatar_zoom) : 1;

  const heroStyle: React.CSSProperties = {
    ...(hasAnyContent ? { height: 480 } : { minHeight: "100dvh", display: "flex", flexDirection: "column" }),
    position: "relative",
    overflow: "hidden",
    ...(hasRealAvatar
      ? {}
      : { backgroundImage: heroBackground, backgroundSize: "cover", backgroundPosition: "center top" }),
    backgroundColor: "#1a1a1a",
  };

  return (
    <>
    {showPaymentBanner && <PaymentSuccessBanner />}
    <main className={`profile-page ${template.bodyClass}`}>


    {/* 🔐 Analytics + tracking (consent-gated) */}
    <AnalyticsGate
      googleAnalyticsId={profile.pixel_google}
      facebookPixelId={profile.pixel_facebook}
      hubspotPortalId={profile.hubspot_portal_id}
      hubspotEnabled={!!profile.hubspot_portal_id}
      linkedinPartnerId={profile.pixel_linkedin}
      tiktokPixelId={profile.pixel_tiktok}
      isPreview={isPreview}
    />
    <TrackingGate
      profileSlug={profile.slug as string | null}
      profileId={profile.id as string | null}
      userTier={profile.plan_id as number | null}
      hasCustomPixels={!!(profile.pixel_google || profile.pixel_facebook || profile.pixel_linkedin || profile.pixel_tiktok || profile.hubspot_portal_id)}

      viewId={viewId}
    />
    {!isPreview && (
      <ViewTracker
        profileId={profile.id as string}
        slug={profile.slug as string}
        country={viewCountry}
        city={viewCity}
        referrer={headersList.get("referer")}
        utmSource={params.utm_source || params.ref || null}
        utmMedium={params.utm_medium || null}
        utmCampaign={params.utm_campaign || null}
        utmContent={params.utm_content || null}
        linkId={null}
        viewId={viewId}
      />
    )}
    <LinkClickTracker profileId={profile.id as string | null} />
    <OutreachEngagementGate profileSlug={profile.slug as string | null} />

{/* Always on now — resolves directly from the artist's explicit
    action_button_source selection (scheduling/shop/external/private_link),
    defaulting to the lead-gen form when unset or when the selected source
    isn't actually configured. No priority chain, no auto-activation — see
    lib/primaryCta.ts. */}
<BookMeButton
  username={profile.slug}
  profileId={profile.id}
  profileName={displayName}
  actionButtonSource={profile.action_button_source as string | null}
  schedulingProvider={profile.scheduling_provider as string | null}
  schedulingUrl={profile.scheduling_url as string | null}
  shopStoreUrl={profile.shop_store_url as string | null}
  externalLinkUrl={profile.external_link_url as string | null}
  externalLinkLabel={profile.external_link_label as string | null}
  featuredLink={featuredLink}
/>



      {/* 🖼️ Profile Hero */}
      <div style={heroStyle}>

        {hasRealAvatar && (
          <>
            <HeroImage
              // Raw object URL — HeroImage now goes through next/image, which
              // does its own resizing/optimization (see next.config.ts's
              // remotePatterns), so no Supabase render-endpoint rewrite is
              // needed here anymore.
              src={normalizeImageUrl(profile.avatar_url as string) ?? (profile.avatar_url as string)}
              focalX={heroFocalX}
              focalY={heroFocalY}
              zoom={heroZoom}
            />
            {/* Legibility overlay (was baked into the old background gradient) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.85))",
                pointerEvents: "none",
              }}
            />
          </>
        )}

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

          {/* Empty-state tagline */}
          {!hasAnyContent && (
            <p style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.45)",
              margin: "0 0 24px",
              fontWeight: 400,
            }}>
              Creative Professional on SQRZ
            </p>
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

        {hasActiveServices && <Services services={activeServices} username={profile.slug} profileId={profile.id} planId={profile.plan_id as number | null} profileName={displayName} />}

        {profile.bio && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="About" title="Get to know me" />
            <CollapsibleBio bio={profile.bio as string} />
          </section>
        )}

        {hasVideos && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="Watch" title="Video" />
            <YouTubeGallery videos={profile.profile_videos} profileId={profile.id as string | null} />
          </section>
        )}

        {hasMusicEmbeds && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="Listen" title="Music" />
            <MusicEmbeds
              spotifyEmbed={spotifyEmbed}
              soundcloudEmbed={soundcloudEmbed}
              mixcloudEmbedUrl={mixcloudEmbedUrl}
              profileId={profile.id as string | null}
            />
          </section>
        )}

        {hasShop && (
          <section style={sectionShellStyle}>
            <SectionHeading eyebrow="Shopping" title="Buy" />
            <ShopSection
              provider={profile.shop_provider as string | null}
              beatstarsUrl={profile.beatstars_url as string | null}
              products={shopProducts}
            />
          </section>
        )}

        {profile.widget_bandsintown ? (
        <section style={sectionShellStyle}>
        <SectionHeading eyebrow="Live" title="Tour Dates" />
        <BandsintownWidget bandsintownUrl={profile.widget_bandsintown} />
        </section>
        ) : null}

        {/* Scheduling is now surfaced via the primary floating CTA (see
            BookMeButton / lib/primaryCta.ts) when configured, not as a
            separate in-flow block here — one "book me" affordance, not two. */}

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
    {/* Neither is needed for a preview (owner viewing their own profile,
        e.g. from the iOS Preview tab) — skip mounting both entirely rather
        than rendering them disabled. */}
    {!isPreview && <CookieBanner templateId={profile.template_id as string} />}
    {!isPreview && (
      <ProfileInquiryBubble
        profileId={profile.id as string}
        profileSlug={profile.slug as string | null}
        ownerName={displayName}
        enabled={profile.inquiry_chat_enabled !== false}
      />
    )}
    </>
  );
}

const sectionShellStyle: React.CSSProperties = {
  paddingTop: 4,
};
