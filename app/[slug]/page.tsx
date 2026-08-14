import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ViewTracker from "@/components/ViewTracker";
import { resolveProfileSlug } from "@/lib/profile-resolver";
import RefCapture from "@/components/RefCapture";
import LegalFooter from "@/components/LegalFooter";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsGate from "@/components/tracking/AnalyticsGate";
import TrackingGate from "@/components/tracking/TrackingGate";
import DownloadCtaButton from "@/components/DownloadCtaButton";
import PaymentGateCta from "@/components/PaymentGateCta";
import ProfileInquiryBubble from "@/components/ProfileInquiryBubble";
import SchedulingWidget from "@/components/SchedulingWidget";
import ShopSection from "@/components/ShopSection";
import LinkOutButton from "@/components/LinkOutButton";
import { floatingButtonStyle } from "@/lib/floatingCta";
import { getShopProducts } from "@/lib/shop";
import { normalizeImageUrl, toDisplayImageUrl } from "@/lib/image-url";

// Provider label for the "Visit [Provider] Store" floating CTA below.
const SHOP_PROVIDER_LABELS: Record<string, string> = {
  beatstars: "BeatStars",
  shopify: "Shopify",
  gumroad: "Gumroad",
};

export const revalidate = 0;

const TEMPLATE_ACCENTS: Record<string, string> = {
  midnight: "#F3B130",
  neon: "#A855F7",
  studio: "#38BDF8",
};
const DEFAULT_ACCENT = "#F5A623";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `https://${url}`;
}

// ─── Layout primitives ────────────────────────────────────────────────────────

const shell: React.CSSProperties = {
  background: "#0a0a0a",
  minHeight: "100vh",
  fontFamily: "'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif",
};

const container: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  padding: 24,
  boxSizing: "border-box",
};

function PoweredBy() {
  return (
    <div style={{ textAlign: "center", padding: "24px 0 32px", fontSize: 12, color: "#aaa", letterSpacing: "0.04em" }}>
      Powered by <span style={{ fontWeight: 700, color: "#888" }}>SQRZ</span>
    </div>
  );
}

function getYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/embed/")[1]?.split("/")[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

function VideoEmbed({ videoId }: { videoId: string }) {
  return (
    <div style={{ position: "relative", width: "100%", margin: "0 auto", aspectRatio: "16 / 9", borderRadius: 8, overflow: "hidden", background: "#000" }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Promo video"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

function CoverImage({ coverImageSrc, alt }: { coverImageSrc: string | null; alt: string }) {
  if (!coverImageSrc) return null;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "2 / 1", maxHeight: "60vh", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverImageSrc}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      {/* Soft fade from the bottom edge of the hero into the page background */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: "20%",
          background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0a0a0a 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function RichDescription({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.8)",
        whiteSpace: "pre-wrap", margin: 0, width: "100%",
      }}
    >
      {text}
    </p>
  );
}

function ContentSection({
  title,
  cta,
  shopWidget,
  videoId,
  description,
  username,
  profileAvatarSrc,
  displayName,
  accent,
}: {
  title: string | null;
  cta: React.ReactNode;
  shopWidget?: React.ReactNode;
  videoId: string | null;
  description: string | null;
  username: string;
  profileAvatarSrc: string | null;
  displayName: string | null;
  accent: string;
}) {
  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "0 24px", boxSizing: "border-box" }}>

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
        {profileAvatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profileAvatarSrc}
            alt={displayName ?? username}
            // Fixed crop, NOT the hero focal point: avatar_url is hero-tuned, and
            // a wide-photo focal point amplifies the mis-crop in this tiny circle.
            // "50% 25%" (center, weighted up toward where faces sit) is simple and
            // predictable for every photo. See avatar_focal_x/y handling on the hero.
            style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 25%", flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 32, height: 32, borderRadius: "50%", background: accent,
              color: "white", fontSize: 12, fontWeight: 800,
              fontFamily: "Barlow Condensed, sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            {getInitials(displayName ?? username)}
          </div>
        )}
        <span style={{ fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
          {displayName ?? username}
        </span>
      </div>

      {/* Title */}
      {title && (
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", margin: 0, marginTop: 16, lineHeight: 1.2 }}>
          {title}
        </h1>
      )}

      {/* Download/payment-gate CTA — a separate, still-live mechanism. The
          floating scheduling CTA (show_scheduling_cta) renders elsewhere,
          outside this content flow — see the page-level return below. */}
      {cta && <div style={{ marginTop: 24 }}>{cta}</div>}

      {/* YouTube embed */}
      {videoId && <div style={{ marginTop: 32 }}><VideoEmbed videoId={videoId} /></div>}

      {/* Description */}
      {description && (
        <div style={{ marginTop: 32 }}>
          <RichDescription text={description} />
        </div>
      )}

      {/* Inline shop widget (show_shop_widget) — same ShopSection the profile
          page uses. Ordered after Description, before "Back to Profile"
          (2026-08-08 reorder). */}
      {shopWidget && <div style={{ marginTop: 32 }}>{shopWidget}</div>}

      {/* View full profile — outlined, full width */}
      <a
        href={`https://${username}.sqrz.com`}
        style={{
          display: "block", width: "100%", marginTop: 16, marginBottom: 48,
          padding: "14px", boxSizing: "border-box",
          border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
          color: "#fff", fontSize: 15, fontWeight: 600,
          textAlign: "center", textDecoration: "none",
        }}
      >
        ← View full profile
      </a>
    </div>
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

// Converts a raw image URL to an OG-safe URL.
// Supabase-hosted images → render endpoint (600×314, quality=75, no redirects, correct Content-Type).
// All other URLs → returned as-is after normalisation.
// Returns null if the input is null/empty/invalid.
function toOgImageUrl(raw: string | null): string | null {
  const clean = normalizeImageUrl(raw);
  if (!clean) return null;
  if (clean.includes("supabase.co/storage/v1/object/public/")) {
    return (
      clean.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
      "?width=600&height=314&resize=cover&quality=75"
    );
  }
  return clean;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ username?: string }>;
}): Promise<Metadata> {
  const { slug: linkSlug } = await params;
  const sp = await searchParams;
  const headersList = await headers();
  const resolved = await resolveProfileSlug({
    host: headersList.get("host"),
    forwardedSlug: headersList.get("x-profile-slug"),
    devUsername: sp.username,
  });
  if (!resolved) return {};

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, slug, name, first_name, last_name, brand_name, avatar_url")
    .eq("slug", resolved.slug)
    .single();

  if (!profile) return {};

  const { data: link } = await supabase
    .from("private_booking_links")
    .select("title, description, cover_image_url")
    .eq("profile_id", profile.id)
    .eq("link_slug", linkSlug)
    .eq("is_active", true)
    .single();

  if (!link) return {};

  const displayName = (
    profile.brand_name ||
    profile.name ||
    profile.slug
  ) as string;

  const title = link.title ? `${link.title as string} — ${displayName}` : displayName;
  const description = (link.description as string | null) ?? `A private link from ${displayName}`;

  const coverRaw = link.cover_image_url as string | null;
  const avatarRaw = profile.avatar_url as string | null;

  // Debug OG image selection — remove before launch
  const coverOgUrl = toOgImageUrl(coverRaw);
  console.log("[generateMetadata] cover_image_url raw:", coverRaw);
  console.log("[generateMetadata] toOgImageUrl(cover):", coverOgUrl);

  // Priority: cover (any host) → Supabase avatar → no OG image.
  const ogImage = coverOgUrl ?? toOgImageUrl(avatarRaw) ?? null;
  console.log("[generateMetadata] final ogImage:", ogImage);

  const canonicalUrl = `https://${profile.slug}.sqrz.com/${linkSlug}`;

  return {
    metadataBase: new URL(`https://${profile.slug as string}.sqrz.com`),
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, secureUrl: ogImage, type: "image/jpeg", width: 600, height: 314, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PrivateLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ username?: string; ref?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string }>;
}) {
  const { slug: linkSlug } = await params;
  const sp = await searchParams;
  const headersList = await headers();
  const resolved = await resolveProfileSlug({
    host: headersList.get("host"),
    forwardedSlug: headersList.get("x-profile-slug"),
    devUsername: sp.username,
  });
  if (!resolved) return notFound();
  const username = resolved.slug;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, slug, name, first_name, last_name, brand_name, avatar_url, avatar_focal_x, avatar_focal_y, template_id, plan_id, inquiry_chat_enabled, pixel_google, pixel_facebook, pixel_linkedin, hubspot_portal_id, company_name, company_address, company_tax_id, legal_form, vat_id, trade_register_court, trade_register_number, responsible_person, regulatory_body, dpo_email, external_privacy_url, scheduling_provider, scheduling_url, shop_provider, beatstars_url, beatstars_store_url, shop_store_url")
    .eq("slug", username)
    .single();

  if (!profile) return notFound();

  const { data: link } = await supabase
    .from("private_booking_links")
    .select("id, link_slug, page_type, title, description, cover_image_url, external_url, external_url_label, expires_at, max_uses, use_count, video_url, payment_gate, price, currency, cta_label, show_scheduling_cta, show_shop_widget")
    .eq("profile_id", profile.id)
    .eq("link_slug", linkSlug)
    .eq("is_active", true)
    .single();

  if (!link) return notFound();

  if (link.expires_at && new Date(link.expires_at) < new Date()) return notFound();

  const maxUsesReached = link.max_uses != null && link.use_count >= link.max_uses;

  // Payment-gated links count a "use" only once payment completes (in the Stripe
  // webhook), never on page load — otherwise every visitor would burn a use.
  if (!maxUsesReached && !link.payment_gate) {
    await supabase
      .from("private_booking_links")
      .update({ use_count: (link.use_count || 0) + 1 })
      .eq("id", link.id);
  }

  // Collect tracking data — sent via client-side beacon after 5 seconds
  const country = headersList.get("x-vercel-ip-country") ?? null;
  const city = decodeURIComponent(headersList.get("x-vercel-ip-city") ?? "") || null;
  const referrer = headersList.get("referer") ?? null;

  const displayName = (profile.brand_name || profile.name || profile.slug) as string;

  const accent = TEMPLATE_ACCENTS[profile.template_id as string ?? ""] ?? DEFAULT_ACCENT;
  const hasRealAvatar =
    profile.avatar_url &&
    !String(profile.avatar_url).includes("placeholder.sqrz.com") &&
    !String(profile.avatar_url).includes("placeholder.");
  const profileAvatarSrc = hasRealAvatar
    ? // Square, center-cropped derivative for the small circle — cover, not the
      // default contain, so it fills the 32px circle without letterboxing.
      toDisplayImageUrl(profile.avatar_url as string, 64, { height: 64, resize: "cover" })
    : null;
  const pageType = (link.page_type as string) ?? "internal";
  // Large hero cover — aspect-preserved (contain); the 2:1 container's own
  // object-fit:cover does the framing.
  const coverImageSrc = toDisplayImageUrl(link.cover_image_url as string | null, 1600, { height: 1600, resize: "contain" });
  const videoId = getYouTubeId(link.video_url as string | null);

  // External links have no hosted page — send visitors straight to the URL.
  if (pageType === "external") {
    const dest = safeUrl(link.external_url as string | null);
    if (dest) redirect(dest);
  }

  const legalFooterProps = {
    privacyHref: `/${profile.slug}/privacy`,
    profileName: (profile.name as string) ?? null,
    companyName: (profile.company_name as string) ?? null,
    legalForm: (profile.legal_form as string) ?? null,
    companyAddress: (profile.company_address as string) ?? null,
    companyTaxId: (profile.company_tax_id as string) ?? null,
    vatId: (profile.vat_id as string) ?? null,
    tradeRegisterCourt: (profile.trade_register_court as string) ?? null,
    tradeRegisterNumber: (profile.trade_register_number as string) ?? null,
    regulatoryBody: (profile.regulatory_body as string) ?? null,
    dpoEmail: (profile.dpo_email as string) ?? null,
    externalPrivacyUrl: (profile.external_privacy_url as string) ?? null,
    responsiblePerson: (profile.responsible_person as string) ?? null,
  };

  if (maxUsesReached) {
    return (
      <div className="flex flex-col min-h-screen items-center" style={shell}>
        <div className="flex-1" style={container}>
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>No Longer Available</h1>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15 }}>This link has reached its maximum number of uses.</p>
          </div>
        </div>
        <LegalFooter {...legalFooterProps} />
      </div>
    );
  }

  const hasCustomPixels = !!(profile.pixel_google || profile.pixel_facebook || profile.pixel_linkedin || profile.hubspot_portal_id);

  // ─── INTERNAL PAGE ───────────────────────────────────────────────────────────
  // Single-offer layout (2026-08-08, then revised same day): Hero, Description,
  // Promo Video, and two independently-toggled CTA slots — no more profile-style
  // bloat (service pill/terms matched via the now-unused prefill_service, the
  // generic "book me" lead-gen form). show_scheduling_cta and show_shop_widget
  // stay independent toggles (either, both, or neither can be on), but what
  // show_scheduling_cta actually renders changed 2026-08-14: it's now a shared
  // floating-slot resolver — Scheduling ("Book …") or Shop ("Visit … Store"),
  // whichever of profiles.scheduling_provider/shop_provider is configured
  // (mutually exclusive at the account level, enforced upstream in the
  // dashboard/iOS Business UI) — see floatingActionCta below. show_shop_widget
  // (the inline product grid/player) is untouched by that change — it's a
  // completely separate slot and can be on regardless of what the floating
  // button shows. The download/payment-gate CTA (external_url) is a separate,
  // still-live mechanism, untouched — it takes priority over the floating slot
  // in the inline `cta` slot, since it's a deliberately different CTA type, not
  // "nothing configured". The floating slot is independent of that inline slot
  // entirely — it floats (see the page-level render below), matching the
  // profile page's primary CTA placement exactly, not the inline slot.
  if (pageType !== "external") {
    const ctaLabel = (link.cta_label as string | null) || null;
    const gatedUrl = safeUrl(link.external_url as string | null);
    const showSchedulingCta = link.show_scheduling_cta as boolean;
    const showShopWidget = link.show_shop_widget as boolean;

    const shopProducts =
      showShopWidget &&
      (profile.shop_provider === "gumroad" || profile.shop_provider === "shopify")
        ? await getShopProducts(profile.id as string)
        : [];

    const bookCta = (link.payment_gate as boolean) && gatedUrl ? (
      <PaymentGateCta
        linkId={link.id as string}
        price={link.price as number | null}
        currency={link.currency as string | null}
        externalUrl={gatedUrl}
        label={ctaLabel || "Unlock"}
        profileId={profile.id as string}
        profileSlug={username}
        linkSlug={linkSlug}
      />
    ) : gatedUrl ? (
      <DownloadCtaButton
        href={gatedUrl}
        accent={accent}
        profileSlug={username}
        profileId={profile.id as string}
        linkSlug={linkSlug}
        label={ctaLabel || "Open"}
      />
    ) : null;

    const shopWidget = showShopWidget ? (
      <ShopSection
        provider={profile.shop_provider as string | null}
        beatstarsUrl={profile.beatstars_url as string | null}
        products={shopProducts}
      />
    ) : null;

    // The floating action button (upper-right, show_scheduling_cta) is a
    // single shared slot: Scheduling ("Book …") or Shop ("Visit … Store") —
    // mutually exclusive at the account level (profiles.scheduling_provider
    // vs. shop_provider, enforced in the dashboard/iOS Business UI, never
    // both by design). Scheduling wins predictably if old data still has
    // both set (same priority the Business UI's own conflict warning
    // documents) — never both, never a crash. show_shop_widget (the inline
    // product grid/player rendered as shopWidget above) is a completely
    // separate, untouched toggle — this only concerns the floating button.
    const schedulingProvider = profile.scheduling_provider as string | null;
    const shopProviderForCta = profile.shop_provider as string | null;
    const shopStoreUrl =
      shopProviderForCta === "beatstars"
        ? (profile.beatstars_store_url as string | null)
        : (profile.shop_store_url as string | null);

    const floatingActionCta = !showSchedulingCta ? null : schedulingProvider ? (
      <SchedulingWidget provider={schedulingProvider} url={profile.scheduling_url as string | null} />
    ) : shopProviderForCta && shopStoreUrl ? (
      <LinkOutButton
        url={shopStoreUrl}
        text={`Visit ${SHOP_PROVIDER_LABELS[shopProviderForCta] ?? shopProviderForCta} Store`}
        style={floatingButtonStyle}
      />
    ) : null;

    return (
      <div style={{ ...shell, "--accent-color": accent } as React.CSSProperties}>
        <RefCapture refCode={sp.ref} />
        {floatingActionCta}
        <CoverImage coverImageSrc={coverImageSrc} alt={(link.title as string) ?? "Cover"} />
        <ContentSection
          title={link.title as string | null}
          cta={bookCta}
          shopWidget={shopWidget}
          videoId={videoId}
          description={link.description as string | null}
          username={username}
          profileAvatarSrc={profileAvatarSrc}
          displayName={displayName}
          accent={accent}
        />
        <LegalFooter {...legalFooterProps} />
        <AnalyticsGate
          googleAnalyticsId={profile.pixel_google as string | null}
          facebookPixelId={profile.pixel_facebook as string | null}
          hubspotPortalId={profile.hubspot_portal_id as string | null}
          hubspotEnabled={!!profile.hubspot_portal_id}
          linkedinPartnerId={profile.pixel_linkedin as string | null}
        />
        <TrackingGate
          profileSlug={profile.slug as string | null}
          profileId={profile.id as string | null}
          userTier={profile.plan_id as number | null}
          hasCustomPixels={hasCustomPixels}
        />
        <CookieBanner templateId={profile.template_id as string} />
        <ProfileInquiryBubble
          profileId={profile.id as string}
          profileSlug={profile.slug as string | null}
          ownerName={displayName}
          enabled={profile.inquiry_chat_enabled !== false}
        />
        <ViewTracker
          profileId={profile.id as string}
          slug={linkSlug}
          country={country}
          city={city}
          referrer={referrer}
          utmSource={sp.utm_source ?? null}
          utmMedium={sp.utm_medium ?? null}
          utmCampaign={sp.utm_campaign ?? null}
          utmContent={sp.utm_content ?? null}
          linkId={link.id as string}
        />
      </div>
    );
  }

  // ─── EXTERNAL FALLBACK ───────────────────────────────────────────────────────
  // Only reached for an external link whose URL was missing/invalid (the redirect
  // above didn't fire). Render a minimal page rather than 404.
  const ctaUrl = safeUrl(link.external_url as string | null);
  const downloadCta = ctaUrl ? (
    (link.payment_gate as boolean)
      ? <PaymentGateCta linkId={link.id as string} price={link.price as number | null} currency={link.currency as string | null} externalUrl={ctaUrl} label="Download" profileId={profile.id as string} profileSlug={profile.slug as string} linkSlug={linkSlug} />
      : <DownloadCtaButton
          href={ctaUrl}
          accent={accent}
          profileSlug={profile.slug as string}
          profileId={profile.id as string}
          linkSlug={linkSlug}
          label="Download"
        />
  ) : null;

  return (
    <div style={{ ...shell, "--accent-color": accent } as React.CSSProperties}>
      <CoverImage coverImageSrc={coverImageSrc} alt={(link.title as string) ?? "Cover"} />
      <ContentSection
        title={link.title as string | null}
        cta={downloadCta}
        videoId={videoId}
        description={link.description as string | null}
        username={username}
        profileAvatarSrc={profileAvatarSrc}
        displayName={displayName}
        accent={accent}
      />
      <LegalFooter {...legalFooterProps} />
      <AnalyticsGate
        googleAnalyticsId={profile.pixel_google as string | null}
        facebookPixelId={profile.pixel_facebook as string | null}
        hubspotPortalId={profile.hubspot_portal_id as string | null}
        hubspotEnabled={!!profile.hubspot_portal_id}
        linkedinPartnerId={profile.pixel_linkedin as string | null}
      />
      <TrackingGate
        profileSlug={profile.slug as string | null}
        profileId={profile.id as string | null}
        userTier={profile.plan_id as number | null}
        hasCustomPixels={hasCustomPixels}
      />
      <CookieBanner templateId={profile.template_id as string} />
      <ProfileInquiryBubble
        profileId={profile.id as string}
        profileSlug={profile.slug as string | null}
        ownerName={displayName}
        enabled={profile.inquiry_chat_enabled !== false}
      />
      <ViewTracker
        profileId={profile.id as string}
        slug={linkSlug}
        country={country}
        city={city}
        referrer={referrer}
        utmSource={sp.utm_source ?? null}
        utmMedium={sp.utm_medium ?? null}
        utmCampaign={sp.utm_campaign ?? null}
        utmContent={sp.utm_content ?? null}
        linkId={link.id as string}
      />
    </div>
  );
}
