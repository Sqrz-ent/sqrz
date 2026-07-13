"use client";

import { useEffect } from "react";
import { trackCtaClick } from "@/lib/tracking/track";

// Delegated, cookieless CTA click tracking. OPT-IN: only anchors explicitly
// marked with data-cta are tracked, so cta_click means real conversion intent —
// the main action link and profile/booking links. Social icons, the "powered
// by SQRZ" footer link, and legal links are intentionally NOT instrumented here
// (they're chrome/utility links, not CTAs). This also stops the Meta in-app
// browser's synthetic/prefetch clicks on those non-CTA anchors from being
// logged as CTA clicks.
//
// Capture phase runs before navigation; keepalive on the ping (in track.ts)
// lets it flush even when the click immediately navigates the tab away. The
// shared per-URL dedupe in trackCtaClick is a second layer of protection.
export default function LinkClickTracker({ profileId }: { profileId: string | null }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a[data-cta]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      // Ignore in-page and non-navigational links.
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      const label =
        anchor.getAttribute("aria-label") ||
        anchor.getAttribute("title") ||
        anchor.textContent?.trim() ||
        anchor.querySelector("img")?.getAttribute("alt") ||
        "link";

      trackCtaClick({
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
