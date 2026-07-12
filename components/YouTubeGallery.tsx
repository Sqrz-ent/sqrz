"use client";

import { useState, useEffect, useRef } from "react";
import { getYouTubeEmbedUrl, getYouTubeId } from "@/lib/youtube";
import { trackCookieless } from "@/lib/tracking/track";

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

// Load the YouTube IFrame Player API once and resolve when window.YT is ready.
// The API only calls the global onYouTubeIframeAPIReady once, so we chain any
// existing handler and resolve a shared promise.
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prev = (window as any).onYouTubeIframeAPIReady;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.body.appendChild(s);
    }
  });
  return ytApiPromise;
}

export default function YouTubeGallery({
  videos,
  profileId,
}: {
  videos: VideoItem[];
  profileId: string | null;
}) {
  if (!videos || videos.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [consented, setConsented] = useState(false);

  const hostRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const firedRef = useRef<Set<number>>(new Set());
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setConsented(readConsent());
  }, []);

  const activeVideo = videos[activeIndex];
  const activeEmbed = getYouTubeEmbedUrl(activeVideo.url);
  const activeId = getYouTubeId(activeVideo.url);

  // ── YouTube engagement tracking (cookieless, same shape as SoundCloud) ─────
  // Create the player once consent is given; YT builds the iframe inside the
  // host div, so React never fights YT over the same DOM node.
  useEffect(() => {
    if (!consented || !activeId || !hostRef.current) return;
    let cancelled = false;

    const stopProgress = () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
    const startProgress = () => {
      if (progressTimerRef.current) return;
      progressTimerRef.current = setInterval(() => {
        const p = playerRef.current;
        if (!p?.getDuration) return;
        const dur = p.getDuration();
        const cur = p.getCurrentTime?.() ?? 0;
        if (!dur) return;
        const pct = (cur / dur) * 100;
        for (const m of [25, 50, 75]) {
          if (pct >= m && !firedRef.current.has(m)) {
            firedRef.current.add(m);
            trackCookieless("widget_progress", {
              widget_type: "youtube",
              milestone_pct: m,
              profile_id: profileId,
            });
          }
        }
      }, 1000);
    };

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !hostRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const YT = (window as any).YT;
        if (!YT?.Player) return;
        playerRef.current = new YT.Player(hostRef.current, {
          width: "100%",
          height: "100%",
          videoId: activeId,
          host: "https://www.youtube-nocookie.com",
          playerVars: { rel: 0, playsinline: 1 },
          events: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onStateChange: (e: any) => {
              const s = e.data;
              if (s === YT.PlayerState.PLAYING) {
                trackCookieless("widget_play", { widget_type: "youtube", profile_id: profileId });
                startProgress();
              } else if (s === YT.PlayerState.PAUSED) {
                trackCookieless("widget_pause", { widget_type: "youtube", profile_id: profileId });
                stopProgress();
              } else if (s === YT.PlayerState.ENDED) {
                trackCookieless("widget_finish", { widget_type: "youtube", profile_id: profileId });
                stopProgress();
              }
            },
          },
        });
      })
      .catch(() => {
        // API blocked/unavailable — playback still works, just untracked.
      });

    return () => {
      cancelled = true;
      stopProgress();
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* YT may have already torn down the iframe */
      }
      playerRef.current = null;
    };
    // activeId intentionally omitted — video switches are handled by the effect
    // below via loadVideoById so the player isn't destroyed/recreated each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented, profileId]);

  // Switch video within the existing player and reset milestone flags.
  useEffect(() => {
    const p = playerRef.current;
    if (p?.loadVideoById && activeId) {
      firedRef.current = new Set();
      p.loadVideoById(activeId);
    }
  }, [activeId]);

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
          <div ref={hostRef} style={{ width: "100%", height: "100%" }} />
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
