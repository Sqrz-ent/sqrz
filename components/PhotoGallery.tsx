"use client";

import Image from "next/image";

type PhotoGalleryProps = { urls: string[] };

export default function PhotoGallery({ urls }: PhotoGalleryProps) {
  if (!urls || urls.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 8,
      }}
    >
      {urls.map((url, i) => (
        <Image
          key={i}
          src={url}
          alt=""
          width={600}
          height={600}
          priority={i < 2}
          sizes="(max-width: 768px) 50vw, 360px"
          style={{
            width: "100%",
            height: "auto",
            aspectRatio: "1",
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      ))}
    </div>
  );
}