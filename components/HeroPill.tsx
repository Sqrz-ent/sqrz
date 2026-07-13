"use client";

import { track, trackCtaClick } from "@/lib/tracking/track";

type HeroPillProps = {
  href: string;
  label: string;
  icon: string;
  accent: string;
  // 'external' = skip straight to external_url; 'page' = route to the /{slug} page.
  destination: "external" | "page";
  profileId: string;
  linkId: string;
  linkSlug: string | null;
};

export default function HeroPill({
  href,
  label,
  icon,
  accent,
  destination,
  profileId,
  linkId,
  linkSlug,
}: HeroPillProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // Rich, identified event (consent-gated).
        track("external_link_clicked", {
          profile_id: profileId,
          link_id: linkId,
          link_slug: linkSlug,
          destination,
        });
        // Cookieless CTA click (the featured booking/action link is a real CTA).
        // Shared per-URL dedupe lives in trackCtaClick. The pill has no data-cta,
        // so the delegated LinkClickTracker won't double-count it.
        trackCtaClick({ link_url: href, link_label: label, profile_id: profileId });
      }}
      style={{
        display: "inline-flex",
        width: "auto",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 16px",
        borderRadius: 999,
        border: `1px solid ${accent}66`,
        background: `${accent}14`,
        color: accent,
        textDecoration: "none",
        textAlign: "center",
        fontSize: 14,
        fontWeight: 600,
        marginTop: 20,
        marginBottom: 10,
        boxSizing: "border-box",
      }}
    >
      {icon} {label}
    </a>
  );
}
