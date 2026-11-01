"use client";

import { useEffect, useRef, useState } from "react";
import { trackCookieless } from "@/lib/tracking/track";
import { recordOutreachEngagement } from "@/lib/outreach/engagement";
import { getSpotifyUri } from "@/lib/spotify";

// Spotify embed driven by Spotify's official iFrame API
// (https://open.spotify.com/embed/iframe-api/v1), so plays are measurable the
// same way SoundCloud's and YouTube's are. The plain <iframe> embed this
// replaces has no way to report playback.
//
// Events recorded (cookieless pings, widget_type "spotify"):
//   widget_visible  — ≥50% scrolled into view, once per load
//   widget_play     — playback started (preview: true when it's Spotify's
//                     30-second preview, i.e. the visitor isn't logged in)
//   widget_pause    — playing → paused
//   widget_progress — 25 / 50 / 75 % of the current track, once each
//   widget_finish   — reached the end of the current track
//
// Robustness: plays come from `playback_started`, with `playback_update`
// (paused → playing) as a backup since developers have reported Spotify
// occasionally not firing events; the two are de-duplicated. If the API script
// can't load or never calls back within API_TIMEOUT_MS, the plain embed
// renders exactly as before, so the player itself can never disappear.

const API_SRC = "https://open.spotify.com/embed/iframe-api/v1";
const API_TIMEOUT_MS = 8000;
const HEIGHT = 352;
const PREVIEW_MAX_MS = 31_000; // Spotify previews are 30s clips
const PLAY_DEDUPE_MS = 2_000;
// playback_started can arrive before the first playback_update tells us the
// track length, so the play ping waits briefly to know whether it's a preview.
const PLAY_EMIT_DELAY_MS = 1_200;

type PlaybackUpdate = {
  data: { isPaused: boolean; isBuffering?: boolean; duration: number; position: number; playingURI?: string };
};
type EmbedController = {
  addListener: (event: string, cb: (e: PlaybackUpdate) => void) => void;
  destroy?: () => void;
};
type IFrameAPI = {
  createController: (
    el: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    cb: (controller: EmbedController) => void
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
  }
}

// One script load per page, shared by every SpotifyEmbed instance. Chains any
// onSpotifyIframeApiReady another script may have set instead of clobbering it.
let apiPromise: Promise<IFrameAPI> | null = null;
function loadSpotifyApi(): Promise<IFrameAPI> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<IFrameAPI>((resolve, reject) => {
    const previous = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (api) => {
      previous?.(api);
      resolve(api);
    };
    const s = document.createElement("script");
    s.src = API_SRC;
    s.async = true;
    s.addEventListener("error", () => reject(new Error("spotify iframe api failed to load")), { once: true });
    document.body.appendChild(s);
  });
  // A failed load shouldn't poison later mounts on the same page.
  apiPromise.catch(() => {
    apiPromise = null;
  });
  return apiPromise;
}

export default function SpotifyEmbed({
  embedUrl,
  profileId,
}: {
  embedUrl: string;
  profileId: string | null;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Mounted imperatively inside wrapperRef: createController replaces its
  // target element with an iframe, which React must never try to reconcile.
  const [fallback, setFallback] = useState(false);
  const visibleSentRef = useRef(false);
  const uri = getSpotifyUri(embedUrl);

  // ── Visibility: widget_visible once per load ───────────────────────────────
  // Re-attached when the player falls back (new element), but fires once.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || visibleSentRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (visibleSentRef.current || !entries.some((e) => e.isIntersecting)) return;
        visibleSentRef.current = true;
        trackCookieless("widget_visible", { widget_type: "spotify", profile_id: profileId });
        observer.disconnect();
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [profileId, fallback]);

  // ── iFrame API player + playback tracking ──────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !uri || fallback) return;

    let cancelled = false;
    let controller: EmbedController | null = null;
    const mount = document.createElement("div");
    wrapper.appendChild(mount);

    const timeout = window.setTimeout(() => {
      if (!controller && !cancelled) setFallback(true);
    }, API_TIMEOUT_MS);

    // Per-track playback state, reset whenever playingURI changes.
    let currentUri: string | null = null;
    let playing = false;
    let lastPlayAt = 0;
    let finished = false;
    let isPreview = false;
    let playTimer: number | null = null;
    const milestones = new Set<number>();

    const resetTrack = (trackUri: string | null) => {
      currentUri = trackUri;
      finished = false;
      milestones.clear();
    };

    const emitPlay = () => {
      const now = Date.now();
      if (now - lastPlayAt < PLAY_DEDUPE_MS) return;
      lastPlayAt = now;
      playTimer = window.setTimeout(() => {
        playTimer = null;
        if (cancelled) return;
        trackCookieless("widget_play", {
          widget_type: "spotify",
          profile_id: profileId,
          ...(currentUri ? { playing_uri: currentUri } : {}),
          ...(isPreview ? { preview: true } : {}),
        });
        // Additive — outreach engagement is a no-op unless a ?r= token is active.
        recordOutreachEngagement({ play: true });
      }, PLAY_EMIT_DELAY_MS);
    };

    loadSpotifyApi()
      .then((api) => {
        if (cancelled) return;
        api.createController(mount, { uri, width: "100%", height: HEIGHT }, (c) => {
          if (cancelled) {
            c.destroy?.();
            return;
          }
          controller = c;
          window.clearTimeout(timeout);

          c.addListener("playback_started", (e) => {
            const playingUri = e?.data?.playingURI ?? null;
            if (playingUri !== currentUri) resetTrack(playingUri);
            playing = true;
            emitPlay();
          });

          c.addListener("playback_update", (e) => {
            const d = e?.data;
            if (!d) return;
            if (d.playingURI && d.playingURI !== currentUri) resetTrack(d.playingURI);
            if (d.duration > 0) isPreview = d.duration <= PREVIEW_MAX_MS;

            const nowPlaying = !d.isPaused && !d.isBuffering;
            if (nowPlaying && !playing) {
              playing = true;
              emitPlay(); // backup if playback_started didn't fire (de-duplicated)
            } else if (d.isPaused && playing) {
              playing = false;
              trackCookieless("widget_pause", { widget_type: "spotify", profile_id: profileId });
            }

            if (d.duration > 0) {
              const pct = (d.position / d.duration) * 100;
              for (const m of [25, 50, 75]) {
                if (pct >= m && !milestones.has(m)) {
                  milestones.add(m);
                  trackCookieless("widget_progress", {
                    widget_type: "spotify",
                    milestone_pct: m,
                    profile_id: profileId,
                    ...(isPreview ? { preview: true } : {}),
                  });
                }
              }
              if (!finished && d.position >= d.duration - 1500) {
                finished = true;
                trackCookieless("widget_finish", {
                  widget_type: "spotify",
                  profile_id: profileId,
                  ...(isPreview ? { preview: true } : {}),
                });
              }
            }
          });
        });
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (playTimer) window.clearTimeout(playTimer);
      controller?.destroy?.();
      mount.remove();
      wrapper.replaceChildren();
    };
  }, [uri, profileId, fallback]);

  // Unparseable link, or the API couldn't load: plain embed, same as before.
  if (!uri || fallback) {
    return (
      <div ref={wrapperRef} key="fallback">
        <iframe src={embedUrl} width="100%" height={HEIGHT} loading="lazy" style={{ border: 0 }} />
      </div>
    );
  }

  // No React children: the iFrame API owns this element's contents.
  return <div ref={wrapperRef} key="api" style={{ minHeight: HEIGHT }} />;
}
