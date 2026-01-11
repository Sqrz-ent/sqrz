"use client";


import { useCookieConsent } from "@/components/hooks/useCookieConsent";

// import your tracking components
import HubSpotTracking from "@/components/tracking/HubSpotTracking";
import GoogleAnalytics from "@/components/tracking/GoogleAnalytics";
import FacebookPixel from "@/components/tracking/FacebookPixel";

const SQZR = {
  facebook: process.env.NEXT_PUBLIC_SQRZ_FB_PIXEL!,
  google: process.env.NEXT_PUBLIC_SQRZ_GA_ID!,
  hubspot: process.env.NEXT_PUBLIC_SQRZ_HUBSPOT_PORTAL!,
};

console.log("User pixel:", profile.facebook_pixel_id);
console.log("SQRZ pixel:", process.env.NEXT_PUBLIC_SQRZ_FB_PIXEL);

type AnalyticsGateProps = {
  googleAnalyticsId?: string | null;
  facebookPixelId?: string | null;
  tiktokPixelId?: string | null;
  hubspotPortalId?: string | null;
  hubspotEnabled?: boolean;
// SQRZ master
  sqrzGoogleId: string;
  sqrzFacebookPixel: string;
  sqrzHubspotPortal: string;


  isPreview?: boolean;
};

export default function AnalyticsGate({
  googleAnalyticsId,
  facebookPixelId,
  hubspotPortalId,
  hubspotEnabled = false,
  sqrzGoogleId,
  sqrzFacebookPixel,
  sqrzHubspotPortal,
  isPreview = false,
}: AnalyticsGateProps) {
  const {
    hasAnalyticsConsent,
    hasMarketingConsent,
    isReady,
  } = useCookieConsent();


  // ⛔ Never load analytics in preview mode
  if (isPreview) return null;

  // ⏳ Wait until cookie state is known
  if (!isReady) return null;

  return (
    <>
      {/* ---------- ANALYTICS ---------- */}
{hasAnalyticsConsent && (
  <>
    {/* SQRZ Master */}
    <GoogleAnalytics id={sqrzGoogleId} />
    <HubSpotTracking portalId={sqrzHubspotPortal} />

    {/* User (optional) */}
    {googleAnalyticsId && <GoogleAnalytics id={googleAnalyticsId} />}
    {hubspotEnabled && hubspotPortalId && (
      <HubSpotTracking portalId={hubspotPortalId} />
    )}
  </>
)}

{/* ---------- MARKETING ---------- */}
{hasMarketingConsent && (
  <>
    {/* SQRZ Master */}
    <FacebookPixel pixelId={sqrzFacebookPixel} />

    {/* User (optional) */}
    {facebookPixelId && <FacebookPixel pixelId={facebookPixelId} />}
  </>
)}
    </>
  );
}
