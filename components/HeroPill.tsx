"use client";

import { track, trackCookieless } from "@/lib/tracking/track";

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
      // Already tracked here — tell the delegated LinkClickTracker to skip it so
      // this CTA isn't counted twice.
      data-cta-tracked="1"
      onClick={() => {
        // Rich, identified event (consent-gated).
        track("external_link_clicked", {
          profile_id: profileId,
          link_id: linkId,
          link_slug: linkSlug,
          destination,
        });
        // Cookieless CTA click so ad traffic (no consent) is still captured.
        trackCookieless("cta_click", { link_url: href, link_label: label });
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
