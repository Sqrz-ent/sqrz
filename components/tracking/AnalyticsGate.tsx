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
  const { hasAnalyticsConsent, hasMarketingConsent, isReady } = useCookieConsent();

  if (isPreview) return null;
  if (!isReady) return null;

  return (
    <>
      {/* GA config */}
      {hasAnalyticsConsent && googleAnalyticsId && (
        <Script id={`ga-config-${googleAnalyticsId}`} strategy="afterInteractive">
          {`window.gtag && gtag('config', '${googleAnalyticsId}');`}
        </Script>
      )}

      {/* Hubspot */}
      {hasAnalyticsConsent && hubspotEnabled && hubspotPortalId && (
        <Script id={`hubspot-${hubspotPortalId}`} strategy="afterInteractive">
          {`
            (function(d,s,i,r){
              if (d.getElementById(i)) return;
              var js=d.createElement(s), f=d.getElementsByTagName(s)[0];
              js.id=i; js.src='https://js.hs-scripts.com/${hubspotPortalId}.js';
              f.parentNode.insertBefore(js,f);
            })(document,'script','hs-script-loader','https://js.hs-scripts.com/${hubspotPortalId}.js');
          `}
        </Script>
      )}

      {/* Meta Pixel (only if you want it here too) */}
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
