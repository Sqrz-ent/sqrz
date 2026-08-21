"use client";

import { useEffect, useRef, useState } from "react";

// Plain <img> with the same onError-fallback pattern as HeroImage.tsx, for
// avatar renders that don't need HeroImage's focal-point/zoom cover-transform
// math (e.g. the small circular avatar on private link pages) — extracted
// into its own client component because its call site (app/[slug]/page.tsx's
// ContentSection) is a Server Component and can't carry an onError handler
// directly.
//
// TEMPORARY (2026-08-21): Supabase Image Transformations is disabled on the
// current (Free tier) plan — `src` (a toDisplayImageUrl()-transformed render-
// endpoint URL) 403s "FeatureNotEnabled" for every request, tenant-wide. On
// load failure, fall back once to the raw, untransformed object URL
// (`fallbackSrc`) so the avatar still renders — at full original size, which
// costs more bandwidth egress than the resized transform would have. REVERT
// once Pro is reactivated: either delete this component and go back to a
// plain <img src={src}>, or just leave it in place as a harmless no-op safety
// net — it only ever fires when the primary src actually fails to load.
export default function AvatarImg({
  src,
  fallbackSrc,
  alt,
  style,
}: {
  src: string;
  fallbackSrc?: string | null;
  alt: string;
  style: React.CSSProperties;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const triedFallback = useRef(false);

  useEffect(() => {
    setCurrentSrc(src);
    triedFallback.current = false;
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      style={style}
      onError={() => {
        if (!triedFallback.current && fallbackSrc && fallbackSrc !== currentSrc) {
          triedFallback.current = true;
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
