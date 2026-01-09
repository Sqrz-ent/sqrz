"use client";


import { useCookieConsent } from "@/components/hooks/useCookieConsent";

// import your tracking components
import HubSpotTracking from "@/components/tracking/HubSpotTracking";
import GoogleAnalytics from "@/components/tracking/GoogleAnalytics";
import FacebookPixel from "@/components/tracking/FacebookPixel";



type AnalyticsGateProps = {
  googleAnalyticsId?: string | null;
  facebookPixelId?: string | null;
  tiktokPixelId?: string | null;
  hubspotPortalId?: string | null;
  hubspotEnabled?: boolean;
  isPreview?: boolean;
};

export default function AnalyticsGate({
  googleAnalyticsId,
  facebookPixelId,
  tiktokPixelId,
  hubspotPortalId,
  hubspotEnabled = false,
  isPreview = false,
}: AnalyticsGateProps) {
  const {
    hasAnalyticsConsent,
    hasMarketingConsent,
    isReady,
  } = useCookieConsent();


  // ✅ DEBUG LOG (safe)
  console.log("[AnalyticsGate] state", {
    googleAnalyticsId,
    facebookPixelId,
    hubspotPortalId,
    hubspotEnabled,
    isPreview,
    hasAnalyticsConsent,
    hasMarketingConsent,
    isReady,
  });


  // ⛔ Never load analytics in preview mode
  if (isPreview) return null;

  // ⏳ Wait until cookie state is known
  if (!isReady) return null;

  return (
    <>
      {/* ---------- ANALYTICS ---------- */}
      {hasAnalyticsConsent && googleAnalyticsId && (
        <GoogleAnalytics id={googleAnalyticsId} />
      )}

      {hasAnalyticsConsent && hubspotEnabled && hubspotPortalId && (
        <HubSpotTracking portalId={hubspotPortalId} />
      )}

      {/* ---------- MARKETING ---------- */}
     {hasMarketingConsent && facebookPixelId && (
    <FacebookPixel pixelId={facebookPixelId} />
)}
    </>
  );
}
