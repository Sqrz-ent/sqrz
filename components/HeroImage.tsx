"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { computeCoverTransform } from "@/lib/heroTransform";

// Renders the hero avatar as an <img> + transform (not background-image) so we can
// express zoom-beyond-cover + arbitrary focal panning with real pixel math against
// the image's natural size. Fills its parent (the hero container). Uses the shared
// computeCoverTransform so it can never drift from the dashboard picker.
//
// Before JS measures the container / the image loads, it falls back to plain
// object-fit:cover + object-position (today's behavior), which is exact for the
// default zoom=1 case — so existing profiles paint identically with no flash.
export default function HeroImage({
  src,
  focalX,
  focalY,
  zoom,
}: {
  src: string;
  focalX: number;
  focalY: number;
  zoom: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const t =
    natural && box && natural.w > 0 && natural.h > 0
      ? computeCoverTransform(box.w, box.h, natural.w, natural.h, focalX, focalY, zoom)
      : null;

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onLoad={(e) =>
          setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
        }
        style={
          t && natural
            ? {
                position: "absolute",
                top: 0,
                left: 0,
                width: natural.w,
                height: natural.h,
                maxWidth: "none",
                transformOrigin: "top left",
                transform: `translate(${t.translateX}px, ${t.translateY}px) scale(${t.scale})`,
              }
            : {
                // SSR / pre-measure fallback — identical to the previous behavior.
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${focalX * 100}% ${focalY * 100}%`,
              }
        }
      />
    </div>
  );
}
