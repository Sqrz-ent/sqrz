import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

// Matches PROFILE_TEMPLATES in lib/profileTemplates.ts
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

// ─── Shared layout ────────────────────────────────────────────────────────────

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
    .select("id, slug, name, avatar_url, template_id")
    .eq("slug", username)
    .single();

  if (!profile) return notFound();

  // 2. Find the active private link
  const { data: link } = await supabase
    .from("private_booking_links")
    .select("id, link_slug, title, description, cover_image_url, external_url, external_url_label, expires_at, max_uses, use_count")
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
  const maxUsesReached = link.max_uses != null && link.use_count >= link.max_uses;

  // 5. Increment use_count
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

  return (
    <div style={shell}>
      <div style={container}>
        {/* Cover image */}
        {link.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.cover_image_url}
            alt={link.title ?? "Cover"}
            style={{
              width: "100%",
              aspectRatio: "16/9",
              objectFit: "cover",
              borderRadius: 16,
              marginBottom: 24,
              display: "block",
            }}
          />
        )}

        {/* Profile attribution */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          {profileAvatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileAvatarSrc}
              alt={profile.name ?? username}
              style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: accent,
                color: "white",
                fontSize: 15,
                fontWeight: 800,
                fontFamily: "Barlow Condensed, sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {getInitials(profile.name ?? username)}
            </div>
          )}
          <span style={{ fontWeight: 600, fontSize: 15, color: "#333" }}>
            {profile.name ?? username}
          </span>
        </div>

        {/* Title */}
        {link.title && (
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#111",
              margin: "0 0 10px",
              lineHeight: 1.2,
            }}
          >
            {link.title}
          </h1>
        )}

        {/* Description */}
        {link.description && (
          <p
            style={{
              fontSize: 15,
              color: "#555",
              margin: "0 0 28px",
              lineHeight: 1.6,
            }}
          >
            {link.description}
          </p>
        )}

        {/* CTA */}
        {link.external_url && (
          <CtaButton href={link.external_url} accent={accent}>
            {link.external_url_label || "Learn More →"}
          </CtaButton>
        )}

        <PoweredBy />
      </div>
    </div>
  );
}
