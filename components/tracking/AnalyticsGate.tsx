"use client";

import Script from "next/script";
import { useState, useEffect } from "react";
import { getConsentState } from "@/lib/tracking/getConsentState";

type AnalyticsGateProps = {
  googleAnalyticsId?: string | null;
  facebookPixelId?: string | null;
  hubspotPortalId?: string | null;
  hubspotEnabled?: boolean;
  linkedinPartnerId?: string | null;
  tiktokPixelId?: string | null;
  isPreview?: boolean;
};

export default function AnalyticsGate({
  googleAnalyticsId,
  facebookPixelId,
  hubspotPortalId,
  hubspotEnabled = false,
  linkedinPartnerId,
  tiktokPixelId,
  isPreview = false,
}: AnalyticsGateProps) {
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const { analytics, marketing } = getConsentState();
      setAnalyticsConsent(analytics);
      setMarketingConsent(marketing);
    };

    // Check immediately
    checkConsent();

    // Also listen for cookie changes (when user accepts/declines banner)
    window.addEventListener("sqrz_consent_updated", checkConsent);
    return () => window.removeEventListener("sqrz_consent_updated", checkConsent);
  }, []);

  const userGaId  = googleAnalyticsId  || null;
  const userFbId  = facebookPixelId    || null;
  const userHsId  = hubspotPortalId    || null;
  const userLiId  = linkedinPartnerId  || null;
  const userTtId  = tiktokPixelId      || null;

  const sqrzGaId  = process.env.NEXT_PUBLIC_SQRZ_GA_ID         || null;
  const sqrzFbId  = process.env.NEXT_PUBLIC_SQRZ_FB_PIXEL       || null;
  const sqrzHsId  = process.env.NEXT_PUBLIC_SQRZ_HUBSPOT_PORTAL || null;
  const sqrzLiId  = process.env.NEXT_PUBLIC_SQRZ_LINKEDIN        || null;
  const sqrzTtId  = process.env.NEXT_PUBLIC_SQRZ_TIKTOK_PIXEL    || null;

  if (isPreview) return null;

  return (
    <>
      {/* GA4 — fires on statistics consent */}
      {analyticsConsent && userGaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${userGaId}`}
            strategy="afterInteractive"
          />
          <Script id={`ga-user-${userGaId}`} strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${userGaId}', { send_page_view: true });
            `}
          </Script>
        </>
      )}
      {analyticsConsent && sqrzGaId && sqrzGaId !== userGaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${sqrzGaId}`}
            strategy="afterInteractive"
          />
          <Script id={`ga-sqrz-${sqrzGaId}`} strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${sqrzGaId}', { send_page_view: true });
            `}
          </Script>
        </>
      )}

      {/* HubSpot — fires on marketing consent */}
      {marketingConsent && userHsId && (
        <Script id={`hubspot-user-${userHsId}`} strategy="afterInteractive">
          {`
            (function(d,s,i){
              if (d.getElementById(i)) return;
              var js=d.createElement(s), f=d.getElementsByTagName(s)[0];
              js.id=i; js.src='https://js.hs-scripts.com/${userHsId}.js';
              f.parentNode.insertBefore(js,f);
            })(document,'script','hs-script-loader-user');
          `}
        </Script>
      )}
      {marketingConsent && sqrzHsId && sqrzHsId !== userHsId && (
        <Script id={`hubspot-sqrz-${sqrzHsId}`} strategy="afterInteractive">
          {`
            (function(d,s,i){
              if (d.getElementById(i)) return;
              var js=d.createElement(s), f=d.getElementsByTagName(s)[0];
              js.id=i; js.src='https://js.hs-scripts.com/${sqrzHsId}.js';
              f.parentNode.insertBefore(js,f);
            })(document,'script','hs-script-loader-sqrz');
          `}
        </Script>
      )}

      {/* LinkedIn Insight Tag — fires on marketing consent */}
      {marketingConsent && userLiId && (
        <Script id={`linkedin-user-${userLiId}`} strategy="afterInteractive">
          {`
            _linkedin_partner_id = "${userLiId}";
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
      {marketingConsent && sqrzLiId && sqrzLiId !== userLiId && (
        <Script id={`linkedin-sqrz-${sqrzLiId}`} strategy="afterInteractive">
          {`
            _linkedin_partner_id = "${sqrzLiId}";
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

      {/* Meta Pixel — fires on marketing consent */}
      {marketingConsent && userFbId && (
        <Script id={`fb-user-${userFbId}`} strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${userFbId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
      {marketingConsent && sqrzFbId && sqrzFbId !== userFbId && (
        <Script id={`fb-sqrz-${sqrzFbId}`} strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${sqrzFbId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* TikTok Pixel — fires on marketing consent */}
      {marketingConsent && userTtId && (
        <Script id={`tiktok-user-${userTtId}`} strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<e.length;n++)ttq.setAndDefer(e,e[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('${userTtId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}
      {marketingConsent && sqrzTtId && sqrzTtId !== userTtId && (
        <Script id={`tiktok-sqrz-${sqrzTtId}`} strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<e.length;n++)ttq.setAndDefer(e,e[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('${sqrzTtId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}
    </>
  );
}
