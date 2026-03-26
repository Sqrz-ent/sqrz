"use client";

import { useState } from "react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

const INITIAL_SHOW = 2;

type VideoItem = {
  title?: string;
  url: string;
};

export default function YouTubeGallery({
  videos,
}: {
  videos: VideoItem[];
}) {
  if (!videos || videos.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const activeEmbed = getYouTubeEmbedUrl(videos[activeIndex].url);
  if (!activeEmbed) return null;

  const visibleVideos = showAll ? videos : videos.slice(0, INITIAL_SHOW);
  const hiddenCount = videos.length - INITIAL_SHOW;

  return (
    <div style={{ marginTop: 32 }}>
      {/* ▶️ PLAYER */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          aspectRatio: "16 / 9",
          background: "#000000",
        }}
      >
        <iframe
          key={activeEmbed}
          src={activeEmbed}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* 📃 VIDEO LIST */}
      <div style={{ marginTop: 16, textAlign: "left" }}>
        {visibleVideos.map((video, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            style={{
              display: "block",
              width: "100%",
              padding: "12px 14px",
              marginBottom: 8,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background:
                index === activeIndex ? "#dedede3e" : "#dedede19",
              color: "text-accent",
              textAlign: "left",
              opacity: index === activeIndex ? 1 : 0.7,
            }}
          >
            {video.title || `Video ${index + 1}`}
          </button>
        ))}

        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              display: "block",
              width: "100%",
              marginTop: 4,
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              cursor: "pointer",
              textAlign: "center",
              fontFamily: "inherit",
            }}
          >
            Load {hiddenCount} more video{hiddenCount !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}
