import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BookLinkButton from "@/components/BookLinkButton";
import LegalFooter from "@/components/LegalFooter";
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

function getUsernameFromHost(host: string): string | null {
  const cleanHost = host
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .trim();
  if (cleanHost.endsWith(".sqrz.com")) {
    const username = cleanHost.replace(".sqrz.com", "");
    if (!username || username === "www" || username === "sqrz") return null;
    return username;
  }
  return null;
}

async function getUsernameFromCustomDomain(host: string): Promise<string | null> {
  const cleanHost = host.toLowerCase().replace(/:\d+$/, "").trim();
  const { data } = await supabase
    .from("profiles")
    .select("slug")
    .eq("custom_domain", cleanHost)
    .eq("custom_domain_verified", true)
    .single();
  return data?.slug ?? null;
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
  minHeight: "100vh",
  background: "#f7f7f5",
  fontFamily: "'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const container: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  padding: "32px 20px 80px",
};

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
      <span style={{ fontWeight: 600, fontSize: 15, color: "#333" }}>{name ?? username}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PrivateLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ username?: string }>;
}) {
  const { slug: linkSlug } = await params;
  const sp = await searchParams;

  let username: string | null = null;
  if (process.env.NODE_ENV === "development" && sp.username) {
    username = sp.username;
  } else {
    const headersList = await headers();
    const rawHost = headersList.get("host") ?? "";
    username = getUsernameFromHost(rawHost);
    if (!username) username = await getUsernameFromCustomDomain(rawHost);
  }

  if (!username) return notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, slug, name, avatar_url, template_id, company_name, company_address, company_tax_id, legal_form, vat_id, trade_register_court, trade_register_number, responsible_person, regulatory_body, dpo_email, external_privacy_url")
    .eq("slug", username)
    .single();

  if (!profile) return notFound();

  const { data: link } = await supabase
    .from("private_booking_links")
    .select("id, link_slug, page_type, title, description, cover_image_url, external_url, external_url_label, event_date, event_venue, event_city, prefill_service, expires_at, max_uses, use_count")
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
      <div style={shell}>
        <div style={container}>
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>No Longer Available</h1>
            <p style={{ color: "#666", fontSize: 15 }}>This link has reached its maximum number of uses.</p>
          </div>
          <LegalFooter {...legalFooterProps} />
        </div>
      </div>
    );
  }

  // ─── BOOK ────────────────────────────────────────────────────────────────────
  if (pageType === "book") {
    const { data: servicesData } = await supabase
      .from("profile_services")
      .select("id, title, description, price_min, price_max, price_label, currency, booking_type")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true });

    const services = (servicesData ?? []) as Service[];
    const prefillServiceTitle = link.prefill_service as string | null;
    const matchedService = prefillServiceTitle
      ? services.find((s) => s.title === prefillServiceTitle)
      : null;

    return (
      <div style={shell}>
        <div style={container}>
          {link.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={link.cover_image_url}
              alt={link.title ?? "Cover"}
              style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 16, marginBottom: 24, display: "block" }}
            />
          )}

          <ProfileAttribution
            profileAvatarSrc={profileAvatarSrc}
            name={(profile.brand_name || profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.slug) as string ?? null}
            username={username}
            accent={accent}
          />

          {link.title && (
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "0 0 10px", lineHeight: 1.2 }}>
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

          {link.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 28px", lineHeight: 1.6 }}>
              {link.description}
            </p>
          )}

          <BookLinkButton
            username={username}
            services={services}
            profileId={profile.id as string}
            accent={accent}
            prefillService={prefillServiceTitle}
            prefilledTitle={link.title as string | null}
            prefilledDescription={link.description as string | null}
          />

          <LegalFooter {...legalFooterProps} />
        </div>
      </div>
    );
  }

  // ─── EVENT ───────────────────────────────────────────────────────────────────
  if (pageType === "event") {
    const eventDateStr = formatEventDate(link.event_date as string | null);
    const venue = [link.event_venue, link.event_city].filter(Boolean).join(" · ");
    const ctaUrl = safeUrl(link.external_url as string | null);

    return (
      <div style={shell}>
        <div style={container}>
          {link.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={link.cover_image_url}
              alt={link.title ?? "Event"}
              style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 16, marginBottom: 24, display: "block" }}
            />
          )}

          <ProfileAttribution
            profileAvatarSrc={profileAvatarSrc}
            name={(profile.brand_name || profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.slug) as string ?? null}
            username={username}
            accent={accent}
          />

          {link.title && (
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "0 0 12px", lineHeight: 1.2 }}>
              {link.title}
            </h1>
          )}

          {eventDateStr && (
            <div style={{ fontSize: 15, fontWeight: 600, color: accent, marginBottom: 6 }}>
              {eventDateStr}
            </div>
          )}

          {venue && (
            <div style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
              📍 {venue}
            </div>
          )}

          {link.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 28px", lineHeight: 1.6 }}>
              {link.description}
            </p>
          )}

          {ctaUrl && (
            <CtaButton href={ctaUrl} accent={accent}>
              {(link.external_url_label as string) || "Get Tickets →"}
            </CtaButton>
          )}

          <LegalFooter {...legalFooterProps} />
        </div>
      </div>
    );
  }

  // ─── DOWNLOAD (default) ───────────────────────────────────────────────────────
  const ctaUrl = safeUrl(link.external_url as string | null);

  return (
    <div style={shell}>
      <div style={container}>
        {link.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.cover_image_url}
            alt={link.title ?? "Cover"}
            style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 16, marginBottom: 24, display: "block" }}
          />
        )}

        <ProfileAttribution
          profileAvatarSrc={profileAvatarSrc}
          name={profile.name ?? null}
          username={username}
          accent={accent}
        />

        {link.title && (
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "0 0 10px", lineHeight: 1.2 }}>
            {link.title}
          </h1>
        )}

        {link.description && (
          <p style={{ fontSize: 15, color: "#555", margin: "0 0 28px", lineHeight: 1.6 }}>
            {link.description}
          </p>
        )}

        {ctaUrl && (
          <CtaButton href={ctaUrl} accent={accent}>
            {(link.external_url_label as string) || "Download →"}
          </CtaButton>
        )}

        <LegalFooter {...legalFooterProps} />
      </div>
    </div>
  );
}
