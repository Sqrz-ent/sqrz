"use client";

import Script from "next/script";
import { useCookieConsent } from "@/components/hooks/useCookieConsent";

type AnalyticsGateProps = {
  googleAnalyticsId?: string | null;
  facebookPixelId?: string | null;
  hubspotPortalId?: string | null;
  hubspotEnabled?: boolean;
  linkedinPartnerId?: string | null;   // 👈 ADD THIS
  isPreview?: boolean;
};

export default function AnalyticsGate({
  googleAnalyticsId,
  facebookPixelId,
  hubspotPortalId,
  hubspotEnabled = false,
  linkedinPartnerId,
  isPreview = false,
}: AnalyticsGateProps) {
  const { isReady } = useCookieConsent();

  // TEMP BYPASS CONSENT (testing only)
  const hasAnalyticsConsent = true;
  const hasMarketingConsent = true;

  // ✅ sanitize IDs (removes accidental double quotes like ""123"" or "G-XXXX")
  const cleanId = (val?: string | null) =>
    val?.trim().replace(/^"+|"+$/g, "") || null;
  
  const liId = cleanId(linkedinPartnerId);
  const gaId = cleanId(googleAnalyticsId);
  const fbId = cleanId(facebookPixelId);
  const hsId = cleanId(hubspotPortalId);

  if (isPreview) return null;
  if (!isReady) return null;

  return (
    <>
      {/* GA config */}
     {gaId && (
  <>
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      strategy="afterInteractive"
    />

    <Script id={`ga-init-${gaId}`} strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}', { send_page_view: true });
      `}
    </Script>
  </>
)}


      {/* Hubspot */}
      {hasAnalyticsConsent && hubspotEnabled && hsId && (
        <Script id={`hubspot-${hsId}`} strategy="afterInteractive">
          {`
            (function(d,s,i){
              if (d.getElementById(i)) return;
              var js=d.createElement(s), f=d.getElementsByTagName(s)[0];
              js.id=i; js.src='https://js.hs-scripts.com/${hsId}.js';
              f.parentNode.insertBefore(js,f);
            })(document,'script','hs-script-loader');
          `}
        </Script>
      )}

{/* LinkedIn Insight Tag */}
{hasMarketingConsent && liId && (
  <Script id={`linkedin-insight-${liId}`} strategy="afterInteractive">
    {`
      _linkedin_partner_id = "${liId}";
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
      window._linkedin_data_partner_ids.push(_linkedin_partner_id);

      (function(l) {
        if (!l){
          window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
          window.lintrk.q=[];
        }
        var s = document.getElementsByTagName("script")[0];
        var b = document.createElement("script");
        b.type = "text/javascript";
        b.async = true;
        b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
        s.parentNode.insertBefore(b, s);
      })(window.lintrk);
    `}
  </Script>
)}



      {/* Meta Pixel */}
      {hasMarketingConsent && fbId && (
        <Script id={`fb-pixel-${fbId}`} strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
