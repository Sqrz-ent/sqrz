import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BookingLinkForm from "./BookingLinkForm";

// Template accent colors matching profileTemplates.ts
const TEMPLATE_ACCENTS: Record<string, string> = {
  "dj-dark": "#F3B130",
  "dancer-light": "#FD69D1",
  "tech-clean": "#7E6E6E",
};

const DEFAULT_ACCENT = "#F5A623";

type PageType = "booking" | "download" | "event" | "merch" | "press";

interface PrivateLink {
  id: string;
  profile_id: string;
  link_slug: string;
  is_active: boolean;
  page_type: PageType;
  title: string | null;
  description: string | null;
  cover_image_url: string | null;
  prefill_service: string | null;
  prefill_event_date: string | null;
  prefill_budget_min: number | null;
  prefill_budget_max: number | null;
  prefill_message: string | null;
  prefill_location: string | null;
  price: string | null;
  stripe_payment_link_url: string | null;
  external_ticket_url: string | null;
  inventory_count: number | null;
  event_name: string | null;
  event_date: string | null;
  event_venue: string | null;
  event_city: string | null;
  file_path: string | null;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
}

interface Profile {
  id: string;
  slug: string;
  name: string | null;
  avatar_url: string | null;
  is_published: boolean | null;
  template_id: string | null;
  email: string | null;
  bio: string | null;
  profile_services: Array<{
    id: string;
    title: string;
    price_min: number | null;
    price_max: number | null;
    price_label: string | null;
    currency: string | null;
  }>;
}

// Shared page shell styles
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

const profileRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 24,
};

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
      Powered by{" "}
      <span style={{ fontWeight: 700, color: "#888" }}>SQRZ</span>
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

export default async function PrivateLinkPage({
  params,
}: {
  params: Promise<{ username: string; link_slug: string }>;
}) {
  const { username, link_slug } = await params;

  // 1. Find profile by slug
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, slug, name, avatar_url, is_published, template_id, email, bio, profile_services(*)"
    )
    .eq("slug", username)
    .single();

  if (!profile) return notFound();

  // 2. Find the active private link
  const { data: link } = await supabase
    .from("private_booking_links")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("link_slug", link_slug)
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

  const p = profile as unknown as Profile;
  const l = link as unknown as PrivateLink;
  const accent =
    TEMPLATE_ACCENTS[p.template_id ?? ""] ?? DEFAULT_ACCENT;

  // Max uses reached — show unavailable message
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

  // ─── BOOKING ──────────────────────────────────────────────────────────────
  if (l.page_type === "booking") {
    const services = (p.profile_services ?? []) as Profile["profile_services"];

    return (
      <div style={shell}>
        <div style={container}>
          {/* Profile header */}
          <div style={profileRow}>
            {p.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.avatar_url}
                alt={p.name ?? username}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>
                {p.name ?? username}
              </div>
              {p.bio && (
                <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                  {p.bio}
                </div>
              )}
            </div>
          </div>

          {/* Headline + description */}
          {l.title && (
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#111",
                margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              {l.title}
            </h1>
          )}
          {l.description && (
            <p
              style={{
                fontSize: 15,
                color: "#555",
                margin: "0 0 24px",
                lineHeight: 1.6,
              }}
            >
              {l.description}
            </p>
          )}

          {/* Booking form */}
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
              prefillService={l.prefill_service}
              prefillEventDate={l.prefill_event_date}
              prefillBudgetMin={l.prefill_budget_min}
              prefillBudgetMax={l.prefill_budget_max}
              prefillMessage={l.prefill_message}
              prefillLocation={l.prefill_location}
              services={services}
            />
          </div>

          <PoweredBy />
        </div>
      </div>
    );
  }

  // ─── DOWNLOAD ─────────────────────────────────────────────────────────────
  if (l.page_type === "download") {
    return (
      <div style={shell}>
        <div style={container}>
          {l.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.cover_image_url} alt={l.title ?? "Cover"} style={coverImg} />
          )}
          {l.title && (
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 8px", lineHeight: 1.2 }}>
              {l.title}
            </h1>
          )}
          {l.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 16px", lineHeight: 1.6 }}>
              {l.description}
            </p>
          )}
          {l.price && (
            <div style={{ fontSize: 24, fontWeight: 700, color: accent, marginBottom: 20 }}>
              {l.price}
            </div>
          )}
          {l.stripe_payment_link_url && (
            <CtaButton href={l.stripe_payment_link_url} accent={accent}>
              Buy Now →
            </CtaButton>
          )}
          <PoweredBy />
        </div>
      </div>
    );
  }

  // ─── EVENT ────────────────────────────────────────────────────────────────
  if (l.page_type === "event") {
    const eventDateFormatted = formatEventDate(l.event_date);
    const ticketUrl = l.stripe_payment_link_url ?? l.external_ticket_url;

    return (
      <div style={shell}>
        <div style={container}>
          {l.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.cover_image_url} alt={l.event_name ?? "Event"} style={coverImg} />
          )}
          {l.event_name && (
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: "0 0 10px", lineHeight: 1.2 }}>
              {l.event_name}
            </h1>
          )}
          {eventDateFormatted && (
            <div style={{ fontSize: 15, fontWeight: 600, color: accent, marginBottom: 4 }}>
              {eventDateFormatted}
            </div>
          )}
          {(l.event_venue || l.event_city) && (
            <div style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
              {[l.event_venue, l.event_city].filter(Boolean).join(" · ")}
            </div>
          )}
          {l.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 24px", lineHeight: 1.6 }}>
              {l.description}
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

  // ─── MERCH ────────────────────────────────────────────────────────────────
  if (l.page_type === "merch") {
    return (
      <div style={shell}>
        <div style={container}>
          {l.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.cover_image_url} alt={l.title ?? "Product"} style={coverImg} />
          )}
          {l.title && (
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 8px", lineHeight: 1.2 }}>
              {l.title}
            </h1>
          )}
          {l.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 12px", lineHeight: 1.6 }}>
              {l.description}
            </p>
          )}
          {l.price && (
            <div style={{ fontSize: 24, fontWeight: 700, color: accent, marginBottom: 8 }}>
              {l.price}
            </div>
          )}
          {l.inventory_count != null && (
            <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
              {l.inventory_count} remaining
            </div>
          )}
          {l.stripe_payment_link_url && (
            <CtaButton href={l.stripe_payment_link_url} accent={accent}>
              Buy Now →
            </CtaButton>
          )}
          <PoweredBy />
        </div>
      </div>
    );
  }

  // ─── PRESS ────────────────────────────────────────────────────────────────
  if (l.page_type === "press") {
    return (
      <div style={shell}>
        <div style={container}>
          {/* Profile card */}
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
            {p.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.avatar_url}
                alt={p.name ?? username}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: "#111" }}>
                {p.name ?? username}
              </div>
              {p.bio && (
                <div style={{ fontSize: 14, color: "#555", marginTop: 4, lineHeight: 1.5 }}>
                  {p.bio}
                </div>
              )}
            </div>
          </div>

          {l.description && (
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 24px", lineHeight: 1.6 }}>
              {l.description}
            </p>
          )}

          {/* Downloads */}
          {l.file_path && (
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 10 }}>
                Downloads
              </h2>
              <CtaButton href={l.file_path} accent={accent}>
                Download Press Kit →
              </CtaButton>
            </div>
          )}

          {/* Contact */}
          {p.email && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "16px 20px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>
                Contact
              </div>
              <a
                href={`mailto:${p.email}`}
                style={{ fontSize: 15, fontWeight: 600, color: accent, textDecoration: "none" }}
              >
                {p.email}
              </a>
            </div>
          )}

          <PoweredBy />
        </div>
      </div>
    );
  }

  // Fallback
  return notFound();
}
