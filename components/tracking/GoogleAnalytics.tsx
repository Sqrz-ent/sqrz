"use client";

import Script from "next/script";

type GoogleAnalyticsProps = {
  id: string; // GA4 Measurement ID: G-XXXXXXX
};

export default function GoogleAnalytics({ id }: GoogleAnalyticsProps) {
  if (!id) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />

      <Script id={`gtag-init-${id}`} strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
