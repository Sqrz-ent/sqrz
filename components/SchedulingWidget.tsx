"use client";

import CalendlyPopupButton from "./CalendlyPopupButton";

type Props = {
  // From profiles.scheduling_provider / scheduling_url. Generic on purpose:
  // provider-specific rendering is keyed off `provider` here, so cal_com /
  // savvycal slot in later with no rename and no consumer-side changes.
  provider: string | null;
  url: string | null;
};

// In-flow scheduling link-out widget. As of the primary-CTA resolver
// (lib/primaryCta.ts), a Calendly integration is promoted to the profile's
// single primary floating CTA and this in-flow block is no longer rendered
// from app/page.tsx for that case — one "book me" affordance, not two. This
// component is kept for a future provider that resolves as a secondary (non-
// primary) action rather than taking over the primary CTA slot.
export default function SchedulingWidget({ provider, url }: Props) {
  // Only Calendly is implemented today. Unset or any future/unsupported provider,
  // or a missing URL → render nothing (no throw, no empty state) — exactly like
  // the social/music embeds when their field is unset.
  if (provider !== "calendly" || !url) return null;

  return (
    <CalendlyPopupButton
      url={url}
      text="Check availability"
      // Match the in-flow CTA convention on the profile page (see
      // DownloadCtaButton / BookMeButton): full-width accent block, dark text.
      style={{
        display: "block",
        width: "100%",
        padding: "16px",
        background: "var(--accent-color, #F3B130)",
        color: "#000",
        border: "none",
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 700,
        textAlign: "center",
        cursor: "pointer",
        boxSizing: "border-box",
      }}
    />
  );
}
