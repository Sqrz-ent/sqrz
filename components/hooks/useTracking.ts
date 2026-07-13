"use client";

import { useEffect, useRef } from "react";
import { getConsentState } from "@/lib/tracking/getConsentState";
import {
  track,
  trackPageViewCookieless,
  trackPageExitCookieless,
} from "@/lib/tracking/track";

type UseTrackingOptions = {
  profileSlug: string | null;
  profileId: string | null;
  userTier: number | null;
  hasCustomPixels: boolean;
};

export function useTracking({
  profileSlug,
  profileId,
  userTier,
  hasCustomPixels,
}: UseTrackingOptions) {
  const firedRef = useRef(false);
  const maxScrollYRef = useRef(0);
  const exitedRef = useRef(false);

  useEffect(() => {
    const props = {
      profile_slug: profileSlug,
      profile_id: profileId,
      user_tier: userTier,
      has_custom_pixels: hasCustomPixels,
    };

    // ── page_view: exactly one per load ──────────────────────────────────────
    // Identified track() when analytics consent exists, otherwise the
    // consent-free cookieless ping so ad traffic (Meta in-app browser) that
    // bounces before touching the banner is still counted.
    if (!firedRef.current) {
      firedRef.current = true;
      if (getConsentState().analytics) {
        track("page_view", props).catch(() => {});
      } else {
        trackPageViewCookieless(props).catch(() => {});
      }
    }

    // ── scroll depth: track the deepest RAW scrollY reached ──────────────────
    // We store the max scroll position in pixels (not a percentage), and only
    // convert to a percentage once, at page_exit, against a freshly-measured
    // scrollHeight. Computing the ratio live is what caused under-reporting:
    // late-loading embeds/images grow the page after the user's last scroll, so
    // a live percentage never re-samples the true final bottom.
    const sample = () => {
      if (window.scrollY > maxScrollYRef.current) maxScrollYRef.current = window.scrollY;
    };
    sample(); // initial position
    window.addEventListener("scroll", sample, { passive: true });
    // Re-sample when the layout changes — content growth can shift scrollY
    // (scroll anchoring) without emitting a scroll event.
    window.addEventListener("resize", sample);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => sample());
      ro.observe(document.documentElement);
    }

    // ── page_exit: fire once, on the first hide/unload signal ────────────────
    const fireExit = () => {
      if (exitedRef.current) return;
      exitedRef.current = true;
      sample(); // final position before we resolve the percentage
      // Resolve against the current (fully-expanded) page height.
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0
        ? Math.min(100, Math.round((maxScrollYRef.current / scrollable) * 100))
        : 100; // page fits the viewport — everything was seen
      trackPageExitCookieless(pct, props).catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") fireExit();
    };

    // visibilitychange → hidden is the reliable signal on mobile/WebView, where
    // beforeunload often doesn't fire. Keep beforeunload as a desktop fallback.
    const supportsVisibility = typeof document.visibilityState !== "undefined";
    if (supportsVisibility) {
      document.addEventListener("visibilitychange", onVisibility);
    }
    window.addEventListener("beforeunload", fireExit);

    return () => {
      window.removeEventListener("scroll", sample);
      window.removeEventListener("resize", sample);
      ro?.disconnect();
      if (supportsVisibility) {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      window.removeEventListener("beforeunload", fireExit);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
