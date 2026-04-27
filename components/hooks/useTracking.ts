"use client";

import { useEffect, useRef } from "react";

type UseTrackingOptions = {
  profileSlug: string | null;
  profileId: string | null;
  userTier: number | null;
  hasCustomPixels: boolean;
};

function readAnalyticsConsent(): boolean {
  try {
    const raw = document.cookie
      .split("; ")
      .find((r) => r.startsWith("sqrz_cookie_consent="));
    if (!raw) return false;
    const consent = JSON.parse(decodeURIComponent(raw.split("=")[1]));
    return consent.analytics === true;
  } catch {
    return false;
  }
}

export function useTracking({
  profileSlug,
  profileId,
  userTier,
  hasCustomPixels,
}: UseTrackingOptions) {
  const firedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Generate session_id once per mount
    sessionIdRef.current = crypto.randomUUID();

    function firePageView() {
      if (firedRef.current) return;
      firedRef.current = true;

      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "page_view",
          profile_slug: profileSlug,
          profile_id: profileId,
          user_tier: userTier,
          has_custom_pixels: hasCustomPixels,
          referrer: document.referrer || null,
          session_id: sessionIdRef.current,
        }),
      }).catch(() => {
        // fire-and-forget — reset so a retry is possible on consent update
        firedRef.current = false;
      });
    }

    // Check consent immediately
    if (readAnalyticsConsent()) {
      firePageView();
    }

    // Re-check if user interacts with banner after mount
    function onConsentUpdated() {
      if (readAnalyticsConsent()) {
        firePageView();
      }
    }

    window.addEventListener("sqrz_consent_updated", onConsentUpdated);
    return () => window.removeEventListener("sqrz_consent_updated", onConsentUpdated);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
