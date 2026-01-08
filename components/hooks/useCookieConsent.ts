"use client";

import { useEffect, useState } from "react";

export type CookieConsent = {
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
};

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sqrz_cookie_consent="));

    if (match) {
      try {
        const value = decodeURIComponent(match.split("=")[1]);
        setConsent(JSON.parse(value));
      } catch {
        setConsent(null);
      }
    }

    setIsReady(true);
  }, []);

  return {
    consent,
    hasAnalyticsConsent: !!consent?.analytics,
    hasMarketingConsent: !!consent?.marketing,
    isReady,
  };
}
