"use client";

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
        <img
          key={i}
          src={url}
          alt=""
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
