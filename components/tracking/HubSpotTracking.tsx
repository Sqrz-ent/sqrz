"use client";

import Script from "next/script";

type HubSpotTrackingProps = {
  portalId: string;
};

export default function HubSpotTracking({ portalId }: HubSpotTrackingProps) {
  if (!portalId) return null;

  const cleanPortalId = String(portalId).replace(/["']/g, "").trim();

  return (
    <Script
      id={`hubspot-tracking-${cleanPortalId}`}
      strategy="afterInteractive"
      src={`https://js.hs-scripts.com/${cleanPortalId}.js`}
    />
  );
}
