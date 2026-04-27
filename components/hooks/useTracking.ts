"use client";

import { useEffect, useRef } from "react";
import { getConsentState } from "@/lib/tracking/getConsentState";

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
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Generate session_id once per mount
    sessionIdRef.current = crypto.randomUUID();

    function firePageView() {
      if (firedRef.current) return;
      firedRef.current = true;

      const searchParams = new URLSearchParams(window.location.search);
      const utmSource   = searchParams.get("utm_source");
      const utmMedium   = searchParams.get("utm_medium");
      const utmCampaign = searchParams.get("utm_campaign");
      const utmContent  = searchParams.get("utm_content");

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
          utm_source:   utmSource,
          utm_medium:   utmMedium,
          utm_campaign: utmCampaign,
          utm_content:  utmContent,
        }),
      }).catch(() => {
        // fire-and-forget — reset so a retry is possible on consent update
        firedRef.current = false;
      });
    }

    // Check consent immediately
    if (getConsentState().analytics) {
      firePageView();
    }

    // Re-check if user interacts with banner after mount
    function onConsentUpdated() {
      if (getConsentState().analytics) {
        firePageView();
      }
    }

    window.addEventListener("sqrz_consent_updated", onConsentUpdated);
    return () => window.removeEventListener("sqrz_consent_updated", onConsentUpdated);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
