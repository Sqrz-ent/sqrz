"use client";

import { useState } from "react";
import Image from "next/image";

type Pic = any;

// next/image only accepts remote hosts allowlisted in next.config.ts's
// images.remotePatterns (currently just Supabase Storage) — anything else
// (e.g. a Dropbox-hosted pic, see lib/image-url.ts's normalizeImageUrl)
// would throw at request time. Use the optimizer where we know it's safe,
// and fall back to a plain <img> (still lazy-loaded) for everything else.
const SUPABASE_STORAGE_HOST = "fmjefvdtnmgdfauedpmg.supabase.co/storage/v1/object/public/";

function isOptimizableSrc(src: string): boolean {
  return src.includes(SUPABASE_STORAGE_HOST);
}

export default function ImageGallery({
  pics,
}: {
  pics: Pic[];
}) {
  if (!pics || pics.length === 0) return null;

  const normalizedPics = pics
    .map((pic: any) => {
      if (typeof pic === "string") return pic;
      if (pic?.url) return pic.url;
      if (pic?.cover?.url) return pic.cover.url;
      if (pic?.image?.url) return pic.image.url;
      if (pic?.file?.url) return pic.file.url;
      return null;
    })
    .filter(Boolean) as string[];

  if (normalizedPics.length === 0) return null;

  const [index, setIndex] = useState(0);

  function prev() {
    setIndex((i) => (i === 0 ? normalizedPics.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === normalizedPics.length - 1 ? 0 : i + 1));
  }

  const currentSrc = normalizedPics[index];

  return (
    <div
      style={{
        position: "relative",
        height: 320,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {isOptimizableSrc(currentSrc) ? (
        <Image
          key={currentSrc}
          src={currentSrc}
          alt={`Gallery image ${index + 1}`}
          fill
          sizes="(max-width: 720px) 100vw, 720px"
          quality={75}
          style={{ objectFit: "cover" }}
          // Below-the-fold content — default (lazy) loading, no `priority`.
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentSrc}
          alt={`Gallery image ${index + 1}`}
          loading="lazy"
          style={{
            width: "100%",
            height: 320,
            objectFit: "cover",
            display: "block",
          }}
        />
      )}

      {normalizedPics.length > 1 && (
        <button onClick={prev} style={navStyle("left")}>
          ‹
        </button>
      )}

      {normalizedPics.length > 1 && (
        <button onClick={next} style={navStyle("right")}>
          ›
        </button>
      )}

      {normalizedPics.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 6,
          }}
        >
          {normalizedPics.map((_, i) => (
            <span
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background:
                  i === index ? "#f3b130" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function navStyle(side: "left" | "right") {
  return {
    position: "absolute" as const,
    top: "50%",
    [side]: 12,
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    border: "none",
    width: 32,
    height: 32,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: "32px",
    textAlign: "center" as const,
  };
}
