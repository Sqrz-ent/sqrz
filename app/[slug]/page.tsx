import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BookingLinkForm from "./BookingLinkForm";

// Matches PROFILE_TEMPLATES in lib/profileTemplates.ts
const TEMPLATE_ACCENTS: Record<string, string> = {
  "dj-dark": "#F3B130",
  "dancer-light": "#FD69D1",
  "tech-clean": "#7E6E6E",
};
const DEFAULT_ACCENT = "#F5A623";

type PageType = "booking" | "download" | "event" | "merch" | "press";

// ─── Hostname → username (mirrors app/page.tsx) ──────────────────────────────

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

  return null; // custom domains handled below via DB lookup
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

// ─── Shared layout pieces ─────────────────────────────────────────────────────

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

const coverImg: React.CSSProperties = {
  width: "100%",
  aspectRatio: "16/9",
  objectFit: "cover",
  borderRadius: 16,
  marginBottom: 24,
  display: "block",
};

function PoweredBy() {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "24px 0 32px",
        fontSize: 12,
        color: "#aaa",
        letterSpacing: "0.04em",
      }}
    >
      Powered by <span style={{ fontWeight: 700, color: "#888" }}>SQRZ</span>
    </div>
  );
}

function CtaButton({
  href,
  accent,
  children,
}: {
  href: string;
  accent: string;
  children: React.ReactNode;
}) {
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

function formatEventDate(dateStr: string | null) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
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

  // Resolve username — dev shortcut mirrors app/page.tsx
  let username: string | null = null;

  if (process.env.NODE_ENV === "development" && sp.username) {
    username = sp.username;
  } else {
    const headersList = await headers();
    const rawHost = headersList.get("host") ?? "";
    username = getUsernameFromHost(rawHost);
    if (!username) {
      username = await getUsernameFromCustomDomain(rawHost);
    }
  }

  if (!username) return notFound();

  // 1. Find profile
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, slug, name, avatar_url, template_id, email, bio, profile_services(*)"
    )
    .eq("slug", username)
    .single();

  if (!profile) return notFound();

  const hasRealAvatar =
    profile.avatar_url &&
    !String(profile.avatar_url).includes("placeholder.sqrz.com") &&
    !String(profile.avatar_url).includes("placeholder.");

  const profileAvatarSrc = hasRealAvatar
    ? (profile.avatar_url as string)
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent((profile.name ?? username) as string)}&backgroundColor=F5A623&textColor=ffffff&fontSize=38`;

  // 2. Find the active private link
  const { data: link } = await supabase
    .from("private_booking_links")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("link_slug", linkSlug)
    .eq("is_active", true)
    .single();

  if (!link) return notFound();

  // 3. Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return notFound();
  }

  // 4. Check max uses
  const maxUsesReached =
    link.max_uses != null && link.use_count >= link.max_uses;

  // 5. Increment use_count
  if (!maxUsesReached) {
    await supabase
      .from("private_booking_links")
      .update({ use_count: (link.use_count || 0) + 1 })
      .eq("id", link.id);
  }

  const accent =
    TEMPLATE_ACCENTS[profile.template_id as string ?? ""] ?? DEFAULT_ACCENT;
  const pageType = link.page_type as PageType;

  // Max uses exhausted
  if (maxUsesReached) {
    return (
      <div style={shell}>
        <div style={container}>
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>
              No Longer Available
            </h1>
            <p style={{ color: "#666", fontSize: 15 }}>
              This link has reached its maximum number of uses.
            </p>
          </div>
          <PoweredBy />
        </div>
      </div>
    );
  }

  // ─── BOOKING ────────────────────────────────────────────────────────────────
  if (pageType === "booking") {
    const services = (profile.profile_services ?? []) as Array<{
      id: string;
      title: string;
      price_min: number | null;
      price_max: number | null;
      price_label: string | null;
      currency: string | null;
    }>;

    return (
      <div style={shell}>
        <div style={container}>
          {/* Profile header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileAvatarSrc}
              alt={profile.name ?? username}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>
                {profile.name ?? username}
              </div>
              {profile.bio && (
                <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                  {profile.bio}
                </div>
              )}
            </div>
          </div>

          {link.title && (
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#111",
                margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              {link.title}
            </h1>
          )}
          {link.description && (
            <p
              style={{
                fontSize: 15,
                color: "#555",
                margin: "0 0 24px",
                lineHeight: 1.6,
              }}
            >
              {link.description}
            </p>
          )}

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px 20px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
            }}
          >
            <BookingLinkForm
              username={username}
              accent={accent}
              prefillService={link.prefill_service}
              prefillEventDate={link.prefill_event_date}
              prefillBudgetMin={link.prefill_budget_min}
              prefillBudgetMax={link.prefill_budget_max}
              prefillMessage={link.prefill_message}
              prefillLocation={link.prefill_location}
              services={services}
            />
          </div>

          <PoweredBy />
        </div>
      </div>
    );
  }

  // ─── DOWNLOAD ───────────────────────────────────────────────────────────────
  if (pageType === "download") {
    return (
      <div style={shell}>
        <div style={container}>
          {link.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.cover_image_url} alt={link.title ?? "Cover"} style={coverImg} />
          )}
          {link.title && (
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 8px", lineHeight: 1.2 }}>
              {link.title}
            </h1>
          )}
          {link.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 16px", lineHeight: 1.6 }}>
              {link.description}
            </p>
          )}
          {link.price && (
            <div style={{ fontSize: 24, fontWeight: 700, color: accent, marginBottom: 20 }}>
              {link.price}
            </div>
          )}
          {link.stripe_payment_link_url && (
            <CtaButton href={link.stripe_payment_link_url} accent={accent}>
              Buy Now →
            </CtaButton>
          )}
          <PoweredBy />
        </div>
      </div>
    );
  }

  // ─── EVENT ──────────────────────────────────────────────────────────────────
  if (pageType === "event") {
    const ticketUrl = link.stripe_payment_link_url ?? link.external_ticket_url;
    return (
      <div style={shell}>
        <div style={container}>
          {link.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.cover_image_url} alt={link.event_name ?? "Event"} style={coverImg} />
          )}
          {link.event_name && (
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "0 0 10px", lineHeight: 1.2 }}>
              {link.event_name}
            </h1>
          )}
          {formatEventDate(link.event_date) && (
            <div style={{ fontSize: 15, fontWeight: 600, color: accent, marginBottom: 4 }}>
              {formatEventDate(link.event_date)}
            </div>
          )}
          {(link.event_venue || link.event_city) && (
            <div style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
              {[link.event_venue, link.event_city].filter(Boolean).join(" · ")}
            </div>
          )}
          {link.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 24px", lineHeight: 1.6 }}>
              {link.description}
            </p>
          )}
          {ticketUrl && (
            <CtaButton href={ticketUrl} accent={accent}>
              Get Tickets →
            </CtaButton>
          )}
          <PoweredBy />
        </div>
      </div>
    );
  }

  // ─── MERCH ──────────────────────────────────────────────────────────────────
  if (pageType === "merch") {
    return (
      <div style={shell}>
        <div style={container}>
          {link.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.cover_image_url} alt={link.title ?? "Product"} style={coverImg} />
          )}
          {link.title && (
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 8px", lineHeight: 1.2 }}>
              {link.title}
            </h1>
          )}
          {link.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 12px", lineHeight: 1.6 }}>
              {link.description}
            </p>
          )}
          {link.price && (
            <div style={{ fontSize: 24, fontWeight: 700, color: accent, marginBottom: 8 }}>
              {link.price}
            </div>
          )}
          {link.inventory_count != null && (
            <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
              {link.inventory_count} remaining
            </div>
          )}
          {link.stripe_payment_link_url && (
            <CtaButton href={link.stripe_payment_link_url} accent={accent}>
              Buy Now →
            </CtaButton>
          )}
          <PoweredBy />
        </div>
      </div>
    );
  }

  // ─── PRESS ──────────────────────────────────────────────────────────────────
  if (pageType === "press") {
    return (
      <div style={shell}>
        <div style={container}>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "24px 20px",
              marginBottom: 20,
              boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileAvatarSrc}
              alt={profile.name ?? username}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: "#111" }}>
                {profile.name ?? username}
              </div>
              {profile.bio && (
                <div style={{ fontSize: 14, color: "#555", marginTop: 4, lineHeight: 1.5 }}>
                  {profile.bio}
                </div>
              )}
            </div>
          </div>

          {link.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 24px", lineHeight: 1.6 }}>
              {link.description}
            </p>
          )}

          {link.file_path && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#888",
                  marginBottom: 10,
                }}
              >
                Downloads
              </div>
              <CtaButton href={link.file_path} accent={accent}>
                Download Press Kit →
              </CtaButton>
            </div>
          )}

          {profile.email && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "16px 20px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#888",
                  marginBottom: 4,
                }}
              >
                Contact
              </div>
              <a
                href={`mailto:${profile.email}`}
                style={{ fontSize: 15, fontWeight: 600, color: accent, textDecoration: "none" }}
              >
                {profile.email}
              </a>
            </div>
          )}

          <PoweredBy />
        </div>
      </div>
    );
  }

  return notFound();
}
