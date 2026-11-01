"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackCookieless } from "@/lib/tracking/track";

// Wraps the shop section (ShopSection, a server component) to record:
//   shop_visible — once per load, when ≥30% of the shop scrolls into view
//   shop_click   — a "Buy Now" tap on a product card (anchors marked
//                  data-shop-product). BeatStars purchases happen inside its
//                  cross-origin iframe, so only shop_visible exists for it.
// Same cookieless, consent-free pings as the music widgets (MusicEmbeds).
export default function ShopTracker({
  profileId,
  provider,
  children,
}: {
  profileId: string | null;
  provider: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        trackCookieless("shop_visible", { provider, profile_id: profileId });
        observer.disconnect();
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [profileId, provider]);

  return (
    <div
      ref={ref}
      onClickCapture={(e) => {
        const anchor = (e.target as Element | null)?.closest?.("a[data-shop-product]") as HTMLAnchorElement | null;
        if (!anchor) return;
        trackCookieless("shop_click", {
          provider,
          product_title: (anchor.dataset.shopProduct ?? "").slice(0, 100),
          link_url: anchor.href,
          profile_id: profileId,
        });
      }}
    >
      {children}
    </div>
  );
}
