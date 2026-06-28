import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ViewTracker from "@/components/ViewTracker";
import { resolveProfileSlug } from "@/lib/profile-resolver";
import BookLinkButton from "@/components/BookLinkButton";
import RefCapture from "@/components/RefCapture";
import LegalFooter from "@/components/LegalFooter";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsGate from "@/components/tracking/AnalyticsGate";
import TrackingGate from "@/components/tracking/TrackingGate";
import DownloadCtaButton from "@/components/DownloadCtaButton";
import LeadGateCta from "@/components/LeadGateCta";
import PaymentGateCta from "@/components/PaymentGateCta";
import ProfileInquiryBubble from "@/components/ProfileInquiryBubble";
import { normalizeImageUrl } from "@/lib/image-url";
import type { Service } from "@/types/service";

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

function formatEventDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${day} · ${time}`;
  } catch {
    return dateStr;
  }
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

function getCurrencySymbol(currency?: string): string {
  if (!currency) return "€";
  const map: Record<string, string> = { eur: "€", usd: "$", gbp: "£", chf: "CHF " };
  return map[currency.toLowerCase()] ?? currency.toUpperCase() + " ";
}

function ServiceTerms({ service, accent }: { service: Service; accent: string }) {
  const sym = getCurrencySymbol(service.currency);
  const hasRange = service.price_min != null && service.price_max != null && service.price_min > 0 && service.price_max > 0;
  const priceNode = hasRange ? (
    <span style={{ fontSize: 15, fontWeight: 700, color: accent }}>
      {sym}{service.price_min} – {sym}{service.price_max}
    </span>
  ) : service.price_label ? (
    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{service.price_label}</span>
  ) : null;

  const rawDesc = service.description?.trim();

  // Parse description into segments: paragraph → line | bullet
  type Segment = { type: "para"; lines: ({ type: "line"; text: string } | { type: "bullet"; text: string })[] };
  const segments: Segment[] = rawDesc
    ? rawDesc.split(/\n\n+/).map((para) => ({
        type: "para" as const,
        lines: para.split("\n").map((line) =>
          line.trimStart().startsWith("* ")
            ? { type: "bullet" as const, text: line.trimStart().slice(2) }
            : { type: "line" as const, text: line }
        ),
      }))
    : [];

  if (!priceNode && segments.length === 0) return null;

  return (
    <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: 10 }}>
        Service Terms
      </span>
      {priceNode && <div style={{ marginBottom: segments.length > 0 ? 12 : 0 }}>{priceNode}</div>}
      {segments.map((seg, i) => (
        <div key={i} style={{ marginBottom: i < segments.length - 1 ? 10 : 0 }}>
          {seg.lines.map((line, j) =>
            line.type === "bullet" ? (
              <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 3 }}>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, flexShrink: 0, lineHeight: "1.5" }}>•</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{line.text}</span>
              </div>
            ) : (
              <span key={j} style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, display: "inline" }}>
                {line.text}{j < seg.lines.length - 1 && <br />}
              </span>
            )
          )}
        </div>
      ))}
    </div>
  );
}

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

function CtaButton({ href, accent, children }: { href: string; accent: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        width: "100%",
        padding: "16px",
        background: accent,
        color: "#fff",
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 700,
        textAlign: "center",
        textDecoration: "none",
        boxSizing: "border-box",
      }}
    >
      {children}
    </a>
  );
}

function CoverImage({ coverImageSrc, alt }: { coverImageSrc: string | null; alt: string }) {
  if (!coverImageSrc) return null;
  return (
    <div style={{ width: "100%", height: "50vh", overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverImageSrc}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

function ServicePill({ label, accent }: { label: string; accent: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: `${accent}18`, border: `1px solid ${accent}44`,
      borderRadius: 8, padding: "5px 12px",
      fontSize: 13, fontWeight: 600, color: accent,
    }}>
      {label}
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
  pill,
  meta,
  cta,
  videoId,
  description,
  extra,
  username,
  profileAvatarSrc,
  displayName,
  accent,
}: {
  title: string | null;
  pill?: React.ReactNode;
  meta?: React.ReactNode;
  cta: React.ReactNode;
  videoId: string | null;
  description: string | null;
  extra?: React.ReactNode;
  username: string;
  profileAvatarSrc: string | null;
  displayName: string | null;
  accent: string;
}) {
  const hasScrollContent = !!(videoId || description);
  return (
    <div style={{ width: "100%", maxWidth: 600, margin: "0 auto", padding: "0 24px", boxSizing: "border-box" }}>

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24 }}>
        {profileAvatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profileAvatarSrc}
            alt={displayName ?? username}
            style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
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

      {/* Service pill (book type only) */}
      {pill && <div style={{ marginTop: 8 }}>{pill}</div>}

      {/* Event date/venue meta */}
      {meta && <div style={{ marginTop: 8 }}>{meta}</div>}

      {/* Primary CTA (includes lead-gate form if applicable) */}
      {cta && <div style={{ marginTop: 24 }}>{cta}</div>}

      {/* YouTube embed */}
      {videoId && <div style={{ marginTop: 32 }}><VideoEmbed videoId={videoId} /></div>}

      {/* Description */}
      {description && (
        <div style={{ marginTop: 32 }}>
          <RichDescription text={description} />
        </div>
      )}

      {/* Service terms */}
      {extra && <div style={{ marginTop: 16 }}>{extra}</div>}

      {/* Second CTA — only when there's content between the two */}
      {hasScrollContent && cta && <div style={{ marginTop: 40 }}>{cta}</div>}

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
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
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
    .select("id, slug, name, first_name, last_name, brand_name, avatar_url, template_id, plan_id, inquiry_chat_enabled, pixel_google, pixel_facebook, pixel_linkedin, hubspot_portal_id, company_name, company_address, company_tax_id, legal_form, vat_id, trade_register_court, trade_register_number, responsible_person, regulatory_body, dpo_email, external_privacy_url")
    .eq("slug", username)
    .single();

  if (!profile) return notFound();

  const { data: link } = await supabase
    .from("private_booking_links")
    .select("id, link_slug, page_type, title, description, cover_image_url, external_url, external_url_label, event_date, event_venue, event_city, prefill_service, expires_at, max_uses, use_count, lead_gate, video_url, payment_gate, price, currency")
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

  const displayName = (profile.brand_name || profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.slug) as string;

  const accent = TEMPLATE_ACCENTS[profile.template_id as string ?? ""] ?? DEFAULT_ACCENT;
  const hasRealAvatar =
    profile.avatar_url &&
    !String(profile.avatar_url).includes("placeholder.sqrz.com") &&
    !String(profile.avatar_url).includes("placeholder.");
  const profileAvatarSrc = hasRealAvatar ? (profile.avatar_url as string) : null;
  const pageType = (link.page_type as string) ?? "download";
  const coverImageSrc = normalizeImageUrl(link.cover_image_url as string | null);
  const videoId = getYouTubeId(link.video_url as string | null);

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

  // ─── BOOK ────────────────────────────────────────────────────────────────────
  if (pageType === "book") {
    const { data: servicesData } = await supabase
      .from("profile_services")
      .select("id, title, description, price_min, price_max, price_label, currency, booking_type, instant_price, instant_currency, instant_tax_rate")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true });

    const services = (servicesData ?? []) as Service[];
    const prefillServiceTitle = link.prefill_service as string | null;
    const matchedService = prefillServiceTitle
      ? services.find((s) => s.title === prefillServiceTitle)
      : null;

    const bookCta = (
      <BookLinkButton
        username={username}
        services={services}
        profileId={profile.id as string}
        planId={profile.plan_id as number | null}
        accent={accent}
        prefillService={prefillServiceTitle}
        prefilledTitle={link.title as string | null}
        prefilledDescription={link.description as string | null}
        profileName={displayName}
      />
    );

    return (
      <div style={{ ...shell, "--accent-color": accent } as React.CSSProperties}>
        <RefCapture refCode={sp.ref} />
        <CoverImage coverImageSrc={coverImageSrc} alt={(link.title as string) ?? "Cover"} />
        <ContentSection
          title={link.title as string | null}
          pill={matchedService && <ServicePill label={matchedService.title} accent={accent} />}
          cta={bookCta}
          videoId={videoId}
          description={link.description as string | null}
          extra={matchedService && <ServiceTerms service={matchedService} accent={accent} />}
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
          enabled={!!profile.plan_id && Number(profile.plan_id) > 0 && profile.inquiry_chat_enabled !== false}
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

  // ─── EVENT ───────────────────────────────────────────────────────────────────
  if (pageType === "event") {
    const eventDateStr = formatEventDate(link.event_date as string | null);
    const venue = [link.event_venue, link.event_city].filter(Boolean).join(" · ");
    const ctaUrl = safeUrl(link.external_url as string | null);
    const eventCta = ctaUrl ? (
      (link.payment_gate as boolean)
        ? <PaymentGateCta linkId={link.id as string} price={link.price as number | null} currency={link.currency as string | null} externalUrl={ctaUrl} label="Get Tickets" />
        : (link.lead_gate as boolean)
          ? <LeadGateCta href={ctaUrl} accent={accent} label="Get Tickets" linkId={link.id as string} />
          : <CtaButton href={ctaUrl} accent={accent}>Get Tickets</CtaButton>
    ) : null;
    const eventMeta = (eventDateStr || venue) ? (
      <div style={{ marginBottom: 16 }}>
        {eventDateStr && <div style={{ fontSize: 15, fontWeight: 600, color: accent, marginBottom: 4 }}>{eventDateStr}</div>}
        {venue && <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>📍 {venue}</div>}
      </div>
    ) : null;

    return (
      <div style={{ ...shell, "--accent-color": accent } as React.CSSProperties}>
        <CoverImage coverImageSrc={coverImageSrc} alt={(link.title as string) ?? "Event"} />
        <ContentSection
          title={link.title as string | null}
          meta={eventMeta}
          cta={eventCta}
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
          enabled={!!profile.plan_id && Number(profile.plan_id) > 0 && profile.inquiry_chat_enabled !== false}
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

  // ─── DOWNLOAD (default) ───────────────────────────────────────────────────────
  const ctaUrl = safeUrl(link.external_url as string | null);
  const downloadCta = ctaUrl ? (
    (link.payment_gate as boolean)
      ? <PaymentGateCta linkId={link.id as string} price={link.price as number | null} currency={link.currency as string | null} externalUrl={ctaUrl} label="Download" />
      : (link.lead_gate as boolean)
        ? <LeadGateCta href={ctaUrl} accent={accent} label="Download" linkId={link.id as string} />
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
        enabled={!!profile.plan_id && Number(profile.plan_id) > 0 && profile.inquiry_chat_enabled !== false}
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
