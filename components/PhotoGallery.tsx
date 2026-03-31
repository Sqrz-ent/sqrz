"use client";

type PhotoGalleryProps = { urls: string[] };

export default function PhotoGallery({ urls }: PhotoGalleryProps) {
  if (!urls || urls.length === 0) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
      {urls.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={url}
          alt=""
          loading="lazy"
          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, display: "block" }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ))}
    </div>
  );
}
