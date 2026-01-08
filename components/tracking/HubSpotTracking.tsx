"use client";

import Script from "next/script";

type Props = {
  portalId: string | null;
  enabled: boolean;
  hasConsent: boolean;
  isPreview: boolean;
};

export default function HubSpotTracking({
  portalId,
  enabled,
  hasConsent,
  isPreview,
}: Props) {
  // 🔒 Hard safety gate
  if (!enabled) return null;
  if (!portalId) return null;
  if (!hasConsent) return null;
  if (isPreview) return null;

  return (
    <Script
      id="hubspot-tracking"
      strategy="afterInteractive"
      src={`https://js.hs-scripts.com/${portalId}.js`}
    />
  );
}