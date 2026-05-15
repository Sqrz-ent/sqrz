"use client";

import { useState, useEffect } from "react";
import { getYouTubeEmbedUrl, getYouTubeId } from "@/lib/youtube";

const INITIAL_SHOW = 4;

type VideoItem = {
  title?: string;
  url: string;
};

function readConsent(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("sqrz_cookie_consent="))
      ?.split("=")[1] === "accepted"
  );
}

export default function YouTubeGallery({
  videos,
}: {
  videos: VideoItem[];
}) {
  if (!videos || videos.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(readConsent());
  }, []);

  const activeVideo = videos[activeIndex];
  const activeEmbed = getYouTubeEmbedUrl(activeVideo.url);
  const activeId = getYouTubeId(activeVideo.url);
  if (!activeEmbed) return null;

  const visibleVideos = showAll ? videos : videos.slice(0, INITIAL_SHOW);
  const hiddenCount = videos.length - INITIAL_SHOW;

  function handleConsentAndPlay() {
    document.cookie = "sqrz_cookie_consent=accepted; path=/; max-age=31536000; SameSite=Lax";
    setConsented(true);
  }

  return (
    <div>
      {/* ▶️ PLAYER */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          aspectRatio: "16 / 9",
          background: "#000000",
          position: "relative",
        }}
      >
        {consented ? (
          <iframe
            key={activeEmbed}
            src={activeEmbed}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={handleConsentAndPlay}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: "#000",
              display: "block",
            }}
            aria-label="Accept cookies to watch video"
          >
            {activeId && (
              <img
                src={`https://img.youtube.com/vi/${activeId}/hqdefault.jpg`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "2px solid rgba(255,255,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Accept cookies to watch
              </span>
            </div>
          </button>
        )}
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
