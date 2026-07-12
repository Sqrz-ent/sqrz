"use client";

import { useEffect } from "react";
import { trackCookieless } from "@/lib/tracking/track";

// Delegated, cookieless click tracking for every profile link — the middle CTA,
// social bar, featured/private booking pill, and any external link — in one
// place, so no individual anchor needs its own handler. Capture phase runs
// before navigation; keepalive on the ping (in track.ts) lets it flush even
// when the click immediately navigates the tab away.
//
// Cookieless (no session_id, no consent dependency), so it also captures ad
// traffic that never accepted the cookie banner. Anchors that already emit
// their own tracking can opt out with data-cta-tracked.
export default function LinkClickTracker({ profileId }: { profileId: string | null }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.dataset.ctaTracked) return;

      const href = anchor.getAttribute("href") ?? "";
      // Ignore in-page and non-navigational links.
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      const label =
        anchor.getAttribute("aria-label") ||
        anchor.getAttribute("title") ||
        anchor.textContent?.trim() ||
        anchor.querySelector("img")?.getAttribute("alt") ||
        "link";

      trackCookieless("cta_click", {
        link_url: anchor.href, // resolved absolute URL
        link_label: label.slice(0, 100),
        profile_id: profileId,
      });
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [profileId]);

  return null;
}
