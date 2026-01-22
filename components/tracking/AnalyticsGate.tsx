"use client";

import Script from "next/script";
import { useCookieConsent } from "@/components/hooks/useCookieConsent";

type AnalyticsGateProps = {
  googleAnalyticsId?: string | null;
  facebookPixelId?: string | null;
  hubspotPortalId?: string | null;
  hubspotEnabled?: boolean;
  isPreview?: boolean;
};

export default function AnalyticsGate({
  googleAnalyticsId,
  facebookPixelId,
  hubspotPortalId,
  hubspotEnabled = false,
  isPreview = false,
}: AnalyticsGateProps) {
  const { isReady } = useCookieConsent();

  // TEMP BYPASS CONSENT (testing only)
  const hasAnalyticsConsent = true;
  const hasMarketingConsent = true;

  if (isPreview) return null;

  // optional: you can remove this too for testing
  if (!isReady) return null;

  return (
    <>
      {googleAnalyticsId && (
  <Script id={`ga-config-${googleAnalyticsId}`} strategy="afterInteractive">
    {`
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

      gtag('config', '${googleAnalyticsId}');
    `}
  </Script>
)}


      {/* Hubspot */}
      {hasAnalyticsConsent && hubspotEnabled && hubspotPortalId && (
        <Script id={`hubspot-${hubspotPortalId}`} strategy="afterInteractive">
          {`
            (function(d,s,i){
              if (d.getElementById(i)) return;
              var js=d.createElement(s), f=d.getElementsByTagName(s)[0];
              js.id=i; js.src='https://js.hs-scripts.com/${hubspotPortalId}.js';
              f.parentNode.insertBefore(js,f);
            })(document,'script','hs-script-loader');
          `}
        </Script>
      )}

      {/* Meta Pixel */}
      {hasMarketingConsent && facebookPixelId && (
        <Script id={`fb-pixel-${facebookPixelId}`} strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${facebookPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
