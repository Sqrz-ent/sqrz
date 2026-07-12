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
  const maxScrollRef = useRef(0);
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

    // ── scroll depth: passive max-position tracker ───────────────────────────
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      const capped = Math.min(100, Math.round(pct));
      if (capped > maxScrollRef.current) maxScrollRef.current = capped;
    };
    onScroll(); // capture initial position (short pages may need no scroll)
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── page_exit: fire once, on the first hide/unload signal ────────────────
    const fireExit = () => {
      if (exitedRef.current) return;
      exitedRef.current = true;
      trackPageExitCookieless(maxScrollRef.current, props).catch(() => {});
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
      window.removeEventListener("scroll", onScroll);
      if (supportsVisibility) {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      window.removeEventListener("beforeunload", fireExit);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
