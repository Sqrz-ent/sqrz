"use client";

import Script from "next/script";

type GoogleAnalyticsProps = {
  id: string;
};

export default function GoogleAnalytics({ id }: GoogleAnalyticsProps) {
  if (!id) return null;

  return (
    <>
      {/* Load gtag core (only once per ID) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />

      {/* Init / config GA */}
      <Script
        id={`ga-init-${id}`}
        strategy="afterInteractive"
      >
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
          };

          gtag('js', new Date());
          gtag('config', '${id}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
