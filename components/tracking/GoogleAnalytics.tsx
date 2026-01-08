"use client";

import Script from "next/script";

type GoogleAnalyticsProps = {
  id: string;
};

export default function GoogleAnalytics({ id }: GoogleAnalyticsProps) {
  if (!id) return null;

  return (
    <>
      {/* Load gtag */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />

      {/* Init GA */}
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
