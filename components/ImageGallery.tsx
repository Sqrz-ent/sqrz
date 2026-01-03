"use client";

import { useState } from "react";

type Pic =
  | { url: string }
  | string;

export default function ImageGallery({
  pics,
}: {
  pics: Pic[];
}) {
  if (!pics || pics.length === 0) return null;

  const normalizedPics = pics.map((pic) =>
    typeof pic === "string" ? pic : pic.url
  );

  const [index, setIndex] = useState(0);

  function prev() {
    setIndex((i) => (i === 0 ? normalizedPics.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === normalizedPics.length - 1 ? 0 : i + 1));
  }

  return (
    <div
      style={{
        marginTop: 32,
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* IMAGE */}
      <img
        src={normalizedPics[index]}
        alt={`Gallery image ${index + 1}`}
        style={{
          width: "100%",
          height: 320,
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* LEFT */}
      {normalizedPics.length > 1 && (
        <button
          onClick={prev}
          style={navStyle("left")}
        >
          ‹
        </button>
      )}

      {/* RIGHT */}
      {normalizedPics.length > 1 && (
        <button
          onClick={next}
          style={navStyle("right")}
        >
          ›
        </button>
      )}

      {/* DOTS */}
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
