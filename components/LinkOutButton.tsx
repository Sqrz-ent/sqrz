"use client";

import type { CSSProperties } from "react";
import { trackCtaClick } from "@/lib/tracking/track";

// Generic "just open the link" CTA for any scheduling/reservation provider
// that isn't a true one-off integration (Calendly gets a popup, HubSpot gets
// an iframe modal — everything else, OpenTable/Resy/Eventbrite/etc., just
// opens in a new tab). No modal, no iframe, no SDK, no per-provider code.
export default function LinkOutButton({
  url,
  text,
  style,
  onOpen,
  tracking,
}: {
  url: string;
  text: string;
  style: CSSProperties;
  // Optional, additive — fired alongside window.open, never required.
  // Existing/other callers that don't pass it are unaffected.
  onOpen?: () => void;
  // Optional analytics (cta_click) as plain data, for server-component callers
  // (the private-link page) that can't pass an onOpen function.
  tracking?: { profileId: string; source: string; provider?: string | null };
}) {
  return (
    <button
      onClick={() => {
        window.open(url, "_blank", "noopener,noreferrer");
        if (tracking) {
          trackCtaClick({
            link_url: url,
            link_label: text,
            profile_id: tracking.profileId,
            cta_source: tracking.source,
            provider: tracking.provider ?? null,
          });
        }
        onOpen?.();
      }}
      style={style}
    >
      {text}
    </button>
  );
}
