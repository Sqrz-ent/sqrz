"use client";

import { useEffect, useRef } from "react";
import { trackCookieless } from "@/lib/tracking/track";

type Props = {
  spotifyEmbed: string | null;
  soundcloudEmbed: string | null;
  mixcloudEmbedUrl: string | null;
};

const SC_API_SRC = "https://w.soundcloud.com/player/api.js";

// Load the SoundCloud Widget API once and resolve when window.SC is ready.
function loadSoundCloudApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).SC?.Widget) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SC_API_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const s = document.createElement("script");
    s.src = SC_API_SRC;
    s.async = true;
    s.addEventListener("load", () => resolve(), { once: true });
    s.addEventListener("error", () => reject(), { once: true });
    document.body.appendChild(s);
  });
}

export default function MusicEmbeds({
  spotifyEmbed,
  soundcloudEmbed,
  mixcloudEmbedUrl,
}: Props) {
  const spotifyRef = useRef<HTMLIFrameElement>(null);
  const soundcloudRef = useRef<HTMLIFrameElement>(null);

  // ── Visibility tracking: fire widget_visible once per embed at ~50% ────────
  useEffect(() => {
    const targets: Array<{ el: HTMLIFrameElement | null; type: string }> = [
      { el: spotifyRef.current, type: "spotify" },
      { el: soundcloudRef.current, type: "soundcloud" },
    ];
    const seen = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const type = (entry.target as HTMLElement).dataset.widgetType;
          if (!type || seen.has(type)) continue;
          seen.add(type);
          trackCookieless("widget_visible", { widget_type: type });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    for (const { el } of targets) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // ── SoundCloud Widget API: play / pause / finish / progress milestones ─────
  useEffect(() => {
    if (!soundcloudEmbed || !soundcloudRef.current) return;
    let cancelled = false;

    loadSoundCloudApi()
      .then(() => {
        if (cancelled || !soundcloudRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SC = (window as any).SC;
        if (!SC?.Widget) return;

        const widget = SC.Widget(soundcloudRef.current);
        const firedMilestones = new Set<number>();

        widget.bind(SC.Widget.Events.PLAY, () => {
          trackCookieless("widget_play", { widget_type: "soundcloud" });
        });
        widget.bind(SC.Widget.Events.PAUSE, () => {
          trackCookieless("widget_pause", { widget_type: "soundcloud" });
        });
        widget.bind(SC.Widget.Events.FINISH, () => {
          trackCookieless("widget_finish", { widget_type: "soundcloud" });
        });
        widget.bind(
          SC.Widget.Events.PLAY_PROGRESS,
          (e: { relativePosition: number }) => {
            const pct = (e?.relativePosition ?? 0) * 100;
            for (const milestone of [25, 50, 75]) {
              if (pct >= milestone && !firedMilestones.has(milestone)) {
                firedMilestones.add(milestone);
                trackCookieless("widget_progress", {
                  widget_type: "soundcloud",
                  milestone_pct: milestone,
                });
              }
            }
          }
        );
      })
      .catch(() => {
        // Widget API blocked/unavailable — visibility tracking still works.
      });

    return () => {
      cancelled = true;
    };
  }, [soundcloudEmbed]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {spotifyEmbed && (
        <iframe
          ref={spotifyRef}
          data-widget-type="spotify"
          src={spotifyEmbed}
          width="100%"
          height="152"
        />
      )}

      {soundcloudEmbed && (
        <iframe
          ref={soundcloudRef}
          data-widget-type="soundcloud"
          src={soundcloudEmbed}
          width="100%"
          height="300"
        />
      )}

      {mixcloudEmbedUrl && (
        <iframe
          src={mixcloudEmbedUrl}
          width="100%"
          height="120"
          frameBorder="0"
          allow="autoplay"
          style={{ borderRadius: 8 }}
        />
      )}
    </div>
  );
}
