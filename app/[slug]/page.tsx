import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getProfileIconUrl } from "@/lib/profile-icons";
import { resolveProfileSlug } from "@/lib/profile-resolver";
import BookLinkButton from "@/components/BookLinkButton";
import RefCapture from "@/components/RefCapture";
import LegalFooter from "@/components/LegalFooter";
import ChatBubble from "@/components/ChatBubble";
import CookieBanner from "@/components/CookieBanner";
import AnalyticsGate from "@/components/tracking/AnalyticsGate";
import TrackingGate from "@/components/tracking/TrackingGate";
import DownloadCtaButton from "@/components/DownloadCtaButton";
import LeadGateCta from "@/components/LeadGateCta";
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
  background: "#111111",
  fontFamily: "'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif",
};

const container: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  padding: "32px 20px 32px",
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

function CtaButton({ href, accent, children }: { href: string; accent: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        width: "100%",
        padding: "14px",
        background: accent,
        color: "#fff",
        borderRadius: 12,
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

function ProfileAttribution({
  profileAvatarSrc,
  name,
  username,
  accent,
}: {
  profileAvatarSrc: string | null;
  name: string | null;
  username: string;
  accent: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      {profileAvatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileAvatarSrc}
          alt={name ?? username}
          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 40, height: 40, borderRadius: "50%", background: accent,
            color: "white", fontSize: 15, fontWeight: 800,
            fontFamily: "Barlow Condensed, sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          {getInitials(name ?? username)}
        </div>
      )}
      <span style={{ fontWeight: 600, fontSize: 15, color: "#e5e5e5" }}>{name ?? username}</span>
    </div>
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

const DEFAULT_OG_IMAGE = "https://sqrz.com/og.png";

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
    .select("title, description")
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
  const ogImage = (profile.avatar_url as string | null) ?? DEFAULT_OG_IMAGE;
  const iconUrl = getProfileIconUrl(profile.avatar_url as string | null);
  const canonicalUrl = `https://${profile.slug}.sqrz.com/${linkSlug}`;

  return {
    title,
    description,
    icons: {
      icon: iconUrl,
      apple: iconUrl,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PrivateLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ username?: string; ref?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string }>;
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
    .select("id, slug, name, first_name, last_name, brand_name, avatar_url, template_id, plan_id, pixel_google, pixel_facebook, pixel_linkedin, hubspot_portal_id, company_name, company_address, company_tax_id, legal_form, vat_id, trade_register_court, trade_register_number, responsible_person, regulatory_body, dpo_email, external_privacy_url")
    .eq("slug", username)
    .single();

  if (!profile) return notFound();

  const { data: link } = await supabase
    .from("private_booking_links")
    .select("id, link_slug, page_type, title, description, cover_image_url, external_url, external_url_label, event_date, event_venue, event_city, prefill_service, expires_at, max_uses, use_count, lead_gate")
    .eq("profile_id", profile.id)
    .eq("link_slug", linkSlug)
    .eq("is_active", true)
    .single();

  if (!link) return notFound();

  if (link.expires_at && new Date(link.expires_at) < new Date()) return notFound();

  const maxUsesReached = link.max_uses != null && link.use_count >= link.max_uses;

  if (!maxUsesReached) {
    await supabase
      .from("private_booking_links")
      .update({ use_count: (link.use_count || 0) + 1 })
      .eq("id", link.id);
  }

  // ── Link view logging — best-effort, not render-blocking ───────────────────
  {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const referrer = headersList.get("referer");

    const cookieHeader = headersList.get("cookie") || "";
    const sessionMatch = cookieHeader.match(/sqrz_session=([^;]+)/);
    const session_id = sessionMatch?.[1] || Math.random().toString(36).slice(2);

    const userAgent = headersList.get("user-agent") || "";
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "";
    const visitor_fingerprint = Buffer.from(userAgent.slice(0, 50) + ip)
      .toString("base64")
      .slice(0, 16);

    void (async () => {
      try {
        const { error } = await adminSupabase
          .from("profile_views")
          .insert({
            profile_id: profile.id,
            link_id: link.id,
            session_id,
            visitor_fingerprint,
            utm_source: sp.utm_source || sp.ref || null,
            utm_medium: sp.utm_medium || null,
            utm_campaign: sp.utm_campaign || null,
            referrer: referrer || null,
          });

        if (error) {
          console.error("[link views] insert error:", error.message);
        }
      } catch (error) {
        console.error("[link views] logging failed:", error);
      }
    })();
  }

  const displayName = (profile.brand_name || profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.slug) as string;

  const accent = TEMPLATE_ACCENTS[profile.template_id as string ?? ""] ?? DEFAULT_ACCENT;
  const hasRealAvatar =
    profile.avatar_url &&
    !String(profile.avatar_url).includes("placeholder.sqrz.com") &&
    !String(profile.avatar_url).includes("placeholder.");
  const profileAvatarSrc = hasRealAvatar ? (profile.avatar_url as string) : null;
  const pageType = (link.page_type as string) ?? "download";

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

    return (
      <div className="flex flex-col min-h-screen items-center" style={{ ...shell, "--accent-color": accent } as React.CSSProperties}>
        <RefCapture refCode={sp.ref} />
        <div className="flex-1" style={container}>
          <ProfileAttribution
            profileAvatarSrc={profileAvatarSrc}
            name={displayName}
            username={username}
            accent={accent}
          />

          <a
            href={`https://${username}.sqrz.com`}
            style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", display: "inline-block", marginBottom: 20, marginTop: -16 }}
          >
            ← View full profile
          </a>

          {link.cover_image_url && (
            <div style={{ position: "relative", marginBottom: 24, borderRadius: 12, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.cover_image_url}
                alt={link.title ?? "Cover"}
                style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
                background: "linear-gradient(to bottom, transparent, #111111)",
              }} />
            </div>
          )}

          {link.title && (
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.2 }}>
              {link.title}
            </h1>
          )}

          {matchedService && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: `${accent}18`, border: `1px solid ${accent}44`,
              borderRadius: 8, padding: "5px 12px", marginBottom: 16,
              fontSize: 13, fontWeight: 600, color: accent,
            }}>
              {matchedService.title}
            </div>
          )}

          {(link.description as string | null) && (
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", margin: "0 0 28px", lineHeight: 1.6 }}>
              {link.description as string}
            </p>
          )}

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
          {matchedService && <ServiceTerms service={matchedService} accent={accent} />}
        </div>
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
        <ChatBubble profileId={profile.id as string} profileSlug={profile.slug as string} profileName={displayName} />
      </div>
    );
  }

  // ─── EVENT ───────────────────────────────────────────────────────────────────
  if (pageType === "event") {
    const eventDateStr = formatEventDate(link.event_date as string | null);
    const venue = [link.event_venue, link.event_city].filter(Boolean).join(" · ");
    const ctaUrl = safeUrl(link.external_url as string | null);

    return (
      <div className="flex flex-col min-h-screen items-center" style={{ ...shell, "--accent-color": accent } as React.CSSProperties}>
        <div className="flex-1" style={container}>
          <ProfileAttribution
            profileAvatarSrc={profileAvatarSrc}
            name={displayName}
            username={username}
            accent={accent}
          />

          <a
            href={`https://${username}.sqrz.com`}
            style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", display: "inline-block", marginBottom: 20, marginTop: -16 }}
          >
            ← View full profile
          </a>

          {link.cover_image_url && (
            <div style={{ position: "relative", marginBottom: 24, borderRadius: 12, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.cover_image_url}
                alt={link.title ?? "Event"}
                style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
                background: "linear-gradient(to bottom, transparent, #111111)",
              }} />
            </div>
          )}

          {link.title && (
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>
              {link.title}
            </h1>
          )}

          {eventDateStr && (
            <div style={{ fontSize: 15, fontWeight: 600, color: accent, marginBottom: 6 }}>
              {eventDateStr}
            </div>
          )}

          {venue && (
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              📍 {venue}
            </div>
          )}

          {link.description && (
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", margin: "0 0 28px", lineHeight: 1.6 }}>
              {link.description}
            </p>
          )}

          {ctaUrl && (
            (link.lead_gate as boolean)
              ? <LeadGateCta href={ctaUrl} accent={accent} label={(link.external_url_label as string) || "Get Tickets →"} linkId={link.id as string} />
              : <CtaButton href={ctaUrl} accent={accent}>{(link.external_url_label as string) || "Get Tickets →"}</CtaButton>
          )}
        </div>
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
      </div>
    );
  }

  // ─── DOWNLOAD (default) ───────────────────────────────────────────────────────
  const ctaUrl = safeUrl(link.external_url as string | null);

  return (
    <div className="flex flex-col min-h-screen items-center" style={{ ...shell, "--accent-color": accent } as React.CSSProperties}>
      <div className="flex-1" style={container}>
        <ProfileAttribution
          profileAvatarSrc={profileAvatarSrc}
          name={displayName}
          username={username}
          accent={accent}
        />

        <a
          href={`https://${username}.sqrz.com`}
          style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", display: "inline-block", marginBottom: 20, marginTop: -16 }}
        >
          ← View full profile
        </a>

        {link.cover_image_url && (
          <div style={{ position: "relative", marginBottom: 24, borderRadius: 12, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={link.cover_image_url}
              alt={link.title ?? "Cover"}
              style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
            />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
              background: "linear-gradient(to bottom, transparent, #111111)",
            }} />
          </div>
        )}

        {link.title && (
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: "0 0 10px", lineHeight: 1.2 }}>
            {link.title}
          </h1>
        )}

        {link.description && (
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", margin: "0 0 28px", lineHeight: 1.6 }}>
            {link.description}
          </p>
        )}

        {ctaUrl && (
          (link.lead_gate as boolean)
            ? <LeadGateCta href={ctaUrl} accent={accent} label={(link.external_url_label as string) || "Download →"} linkId={link.id as string} />
            : <DownloadCtaButton
                href={ctaUrl}
                accent={accent}
                profileSlug={profile.slug as string}
                profileId={profile.id as string}
                linkSlug={linkSlug}
                label={(link.external_url_label as string) || "Download →"}
              />
        )}
      </div>
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
    </div>
  );
}
