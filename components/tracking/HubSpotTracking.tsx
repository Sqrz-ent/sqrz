"use client";

import Script from "next/script";

type HubSpotTrackingProps = {
  portalId: string;
};

export default function HubSpotTracking({ portalId }: HubSpotTrackingProps) {
  if (!portalId) return null;

  return (
    <Script
      id="hubspot-tracking"
      strategy="afterInteractive"
      src={`https://js.hs-scripts.com/${portalId}.js`}
    />
  );
}
