import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

function getUsernameFromHost(host: string): string | null {
  const cleanHost = host.toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "").trim();
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

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
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
    .select(
      "id, slug, name, email, company_name, legal_form, company_address, responsible_person, vat_id, dpo_email, external_privacy_url, widget_spotify, widget_soundcloud, widget_mixcloud, social_youtube, social_instagram, social_facebook, social_linkedin, plan_id, custom_domain, pixel_google, pixel_facebook, pixel_linkedin"
    )
    .eq("slug", username)
    .single();

  if (!profile) return notFound();

  // If they have their own privacy policy, redirect there
  if (profile.external_privacy_url) {
    const url = (profile.external_privacy_url as string).startsWith("http")
      ? (profile.external_privacy_url as string)
      : `https://${profile.external_privacy_url}`;
    redirect(url);
  }

  const controllerName = (profile.company_name as string) || (profile.name as string) || username;
  const contactEmail = (profile.dpo_email as string) || (profile.email as string) || null;
  const profileUrl = `https://${username}.sqrz.com`;
  const year = new Date().getFullYear();

  const hasGA = !!(profile.pixel_google as string);
  const hasMeta = !!(profile.pixel_facebook as string);
  const hasLinkedIn = !!(profile.pixel_linkedin as string);

  const activeEmbeds: string[] = [];
  if (profile.widget_spotify) activeEmbeds.push("Spotify (Spotify AB, Sweden)");
  if (profile.widget_soundcloud) activeEmbeds.push("SoundCloud (SoundCloud Ltd., Germany)");
  if (profile.widget_mixcloud) activeEmbeds.push("Mixcloud (Mixcloud Ltd., UK)");
  if (profile.social_youtube) activeEmbeds.push("YouTube (Google LLC, USA)");

  const isPaidUser = profile.plan_id != null;

  return (
    <div style={shell}>
      {/* Back link */}
      <div style={topBar}>
        <a href={profileUrl} style={backLink}>
          ← {username}.sqrz.com
        </a>
      </div>

      <main style={container}>
        <h1 style={h1}>Privacy Policy</h1>
        <p style={meta}>
          This privacy policy applies to the profile page at{" "}
          <a href={profileUrl} style={link}>{profileUrl}</a>.
        </p>

        {/* 1. Controller */}
        <section style={section}>
          <h2 style={h2}>1. Controller / Responsible Party</h2>
          <p style={body}>This website is operated by:</p>
          <address style={address}>
            {controllerName && <span>{controllerName}<br /></span>}
            {(profile.legal_form as string) && <span>{profile.legal_form as string}<br /></span>}
            {(profile.company_address as string) && <span>{profile.company_address as string}<br /></span>}
            {(profile.email as string) && <span><a href={`mailto:${profile.email}`} style={link}>{profile.email as string}</a><br /></span>}
            {(profile.responsible_person as string) && (
              <span>Responsible person: {profile.responsible_person as string}<br /></span>
            )}
            {(profile.vat_id as string) && <span>VAT / Tax ID: {profile.vat_id as string}<br /></span>}
          </address>
        </section>

        {/* 2. Hosting */}
        <section style={section}>
          <h2 style={h2}>2. Hosting</h2>
          <p style={body}>
            This site is hosted via{" "}
            <a href="https://sqrz.com" target="_blank" rel="noopener noreferrer" style={link}>SQRZ</a>,
            operated by SQRZ Enterprises Inc., 1250 Broadway, New York, NY 10001, USA.
            Server access logs (IP address, browser type, pages visited, timestamps) are
            retained for up to 30 days for security and diagnostic purposes.
          </p>
          <p style={body}>
            SQRZ privacy policy:{" "}
            <a href="https://sqrz.com/privacy" target="_blank" rel="noopener noreferrer" style={link}>
              sqrz.com/privacy
            </a>
          </p>
        </section>

        {/* 3. Analytics */}
        {hasGA && (
          <section style={section}>
            <h2 style={h2}>3. Analytics</h2>
            <p style={body}>
              This site uses <strong>Google Analytics</strong> (Google LLC, 1600 Amphitheatre Parkway,
              Mountain View, CA 94043, USA) to analyze visitor traffic. Data collected includes
              pages visited, time on site, approximate location (country/city), and device type.
              Data is processed in the USA under Google&rsquo;s Standard Contractual Clauses.
            </p>
            <p style={body}>
              Opt out:{" "}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={link}>
                tools.google.com/dlpage/gaoptout
              </a>
            </p>
          </section>
        )}

        {/* 4. Advertising pixels */}
        {(hasMeta || hasLinkedIn) && (
          <section style={section}>
            <h2 style={h2}>{hasGA ? "4" : "3"}. Advertising &amp; Remarketing</h2>
            {hasMeta && (
              <p style={body}>
                This site uses the <strong>Meta Pixel</strong> (Meta Platforms Inc., 1 Hacker Way,
                Menlo Park, CA 94025, USA) for advertising measurement and remarketing purposes.
                Data may be used to show you relevant ads on Facebook and Instagram.{" "}
                <a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" style={link}>
                  Meta Privacy Policy ↗
                </a>
              </p>
            )}
            {hasLinkedIn && (
              <p style={body}>
                This site uses the <strong>LinkedIn Insight Tag</strong> (LinkedIn Corporation,
                1000 W Maude Avenue, Sunnyvale, CA 94085, USA) for advertising analytics and
                campaign measurement.{" "}
                <a href="https://www.linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={link}>
                  LinkedIn Privacy Policy ↗
                </a>
              </p>
            )}
          </section>
        )}

        {/* 5. Embedded content */}
        {activeEmbeds.length > 0 && (
          <section style={section}>
            <h2 style={h2}>
              {[hasGA, hasMeta || hasLinkedIn].filter(Boolean).length + 3}. Embedded Content
            </h2>
            <p style={body}>
              This site embeds content from the following third-party platforms:
            </p>
            <ul style={{ ...body, paddingLeft: 20, margin: "0 0 12px" }}>
              {activeEmbeds.map((e) => <li key={e}>{e}</li>)}
            </ul>
            <p style={body}>
              These services may set cookies and collect usage data when you interact with
              embedded content. Please refer to each provider&rsquo;s privacy policy for details.
            </p>
          </section>
        )}

        {/* 6. Payments */}
        {isPaidUser && (
          <section style={section}>
            <h2 style={h2}>Payments</h2>
            <p style={body}>
              Booking inquiries and payments on this site are facilitated via{" "}
              <strong>Stripe</strong> (Stripe Inc., 354 Oyster Point Blvd, South San Francisco,
              CA 94080, USA). Stripe may collect payment and identity data as described in
              their privacy policy:{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={link}>
                stripe.com/privacy
              </a>
            </p>
          </section>
        )}

        {/* 7. Contact & data requests */}
        <section style={section}>
          <h2 style={h2}>Your Rights &amp; Contact</h2>
          <p style={body}>
            You have the right to request access to, correction, or deletion of any personal
            data we hold about you. Under GDPR and similar regulations you may also object to
            or restrict certain processing.
          </p>
          {contactEmail ? (
            <p style={body}>
              To submit a data request, contact:{" "}
              <a href={`mailto:${contactEmail}`} style={link}>{contactEmail}</a>
            </p>
          ) : (
            <p style={body}>
              To submit a data request, contact the site operator via their profile page at{" "}
              <a href={profileUrl} style={link}>{profileUrl}</a>.
            </p>
          )}
          {(profile.dpo_email as string) && (
            <p style={body}>
              Data Protection Officer: <a href={`mailto:${profile.dpo_email}`} style={link}>{profile.dpo_email as string}</a>
            </p>
          )}
        </section>

        {/* 8. Last updated */}
        <section style={{ ...section, borderTop: "1px solid #e5e5e5", paddingTop: 24 }}>
          <p style={{ ...meta, color: "#aaa" }}>
            Last updated: {year}
            {" · "}
            Generated by{" "}
            <a href="https://sqrz.com" target="_blank" rel="noopener noreferrer" style={link}>
              SQRZ
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "#fff",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  color: "#222",
};

const topBar: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
  padding: "14px 24px",
};

const backLink: React.CSSProperties = {
  fontSize: 13,
  color: "#888",
  textDecoration: "none",
};

const container: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "40px 24px 80px",
};

const h1: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  margin: "0 0 8px",
  letterSpacing: "-0.01em",
};

const h2: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  margin: "0 0 10px",
  color: "#111",
};

const section: React.CSSProperties = {
  marginBottom: 36,
};

const body: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.7,
  color: "#444",
  margin: "0 0 10px",
};

const address: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.8,
  color: "#444",
  fontStyle: "normal",
  margin: "0 0 10px",
};

const meta: React.CSSProperties = {
  fontSize: 13,
  color: "#888",
  margin: "0 0 32px",
  lineHeight: 1.6,
};

const link: React.CSSProperties = {
  color: "#F3B130",
  textDecoration: "none",
};
