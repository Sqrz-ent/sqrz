"use client";

import Script from "next/script";
import { useCookieConsent } from "@/components/hooks/useCookieConsent";

export default function AnalyticsGate({
  googleAnalyticsId,
  isPreview = false,
}: {
  googleAnalyticsId?: string | null;
  isPreview?: boolean;
}) {
  const { hasAnalyticsConsent, isReady } = useCookieConsent();

  if (isPreview) return null;
  if (!isReady) return null;
  if (!googleAnalyticsId) return null;

  return (
    <>
      {hasAnalyticsConsent && (
        <Script id={`ga-config-${googleAnalyticsId}`} strategy="afterInteractive">
          {`
            window.gtag && gtag('config', '${googleAnalyticsId}');
          `}
        </Script>
      )}
    </>
  );
}
