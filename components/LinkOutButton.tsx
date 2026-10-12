"use client";

import type { CSSProperties } from "react";

// Generic "just open the link" CTA for any scheduling/reservation provider
// that isn't a true one-off integration (Calendly gets a popup, HubSpot gets
// an iframe modal — everything else, OpenTable/Resy/Eventbrite/etc., just
// opens in a new tab). No modal, no iframe, no SDK, no per-provider code.
export default function LinkOutButton({
  url,
  text,
  style,
  onOpen,
}: {
  url: string;
  text: string;
  style: CSSProperties;
  // Optional, additive — fired alongside window.open, never required.
  // Existing/other callers that don't pass it are unaffected.
  onOpen?: () => void;
}) {
  return (
    <button
      onClick={() => {
        window.open(url, "_blank", "noopener,noreferrer");
        onOpen?.();
      }}
      style={style}
    >
      {text}
    </button>
  );
}
