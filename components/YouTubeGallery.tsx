"use client";

import { useState } from "react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

type VideoItem = {
  title?: string;
  youtube_url: string;
};

export default function YouTubeGallery({
  videos,
}: {
  videos: VideoItem[];
}) {
  if (!videos || videos.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);

  const activeEmbed = getYouTubeEmbedUrl(
    videos[activeIndex].youtube_url
  );

  if (!activeEmbed) return null;

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
        {videos.map((video, index) => (
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
                index === activeIndex ? "#dedede2c" : "#bcbcbc4f",
              color: "#fff",
              textAlign: "left",
              opacity: index === activeIndex ? 1 : 0.7,
            }}
          >
            {video.title || `Video ${index + 1}`}
          </button>
        ))}
      </div>
    </div>
  );
}
