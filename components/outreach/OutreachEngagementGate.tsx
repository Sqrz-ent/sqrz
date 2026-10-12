"use client";

import { useEffect, useRef } from "react";
import {
  initOutreachEngagement,
  recordOutreachEngagement,
  recordOutreachEngagementOnHide,
} from "@/lib/outreach/engagement";

const REPORT_INTERVAL_MS = 15_000;

// Sibling to TrackingGate (same "do nothing, just run a hook" shape) — kept
// entirely separate rather than folded into useTracking, per the task this
// shipped for: useTracking's own behavior must not change. Active only when
// ?r= is present on this load; otherwise this mounts and does nothing at all
// (initOutreachEngagement never runs, so every lib/outreach/engagement.ts
// call from anywhere else on the page stays a no-op).
export default function OutreachEngagementGate({
  profileSlug,
}: {
  profileSlug: string | null;
}) {
  const maxScrollYRef = useRef(0);
  const hiddenFiredRef = useRef(false);

  useEffect(() => {
    if (!profileSlug) return;

    const url = new URL(window.location.href);
    const token = url.searchParams.get("r");
    if (!token) return;

    // Strip r from the visible URL immediately — sharing/bookmarking the
    // page should never propagate someone else's outreach token.
    url.searchParams.delete("r");
    window.history.replaceState({}, "", url.toString());

    initOutreachEngagement(token, profileSlug);

    const currentScrollPct = () => {
      if (window.scrollY > maxScrollYRef.current) maxScrollYRef.current = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      return scrollable > 0
        ? Math.min(100, (maxScrollYRef.current / scrollable) * 100)
        : 100;
    };

    // Confirms a real JS-rendered view (a bot/scanner that only fetches the
    // server-rendered HTML without executing JS never reaches this line).
    recordOutreachEngagement({ scrollPct: currentScrollPct() });

    const sample = () => {
      if (window.scrollY > maxScrollYRef.current) maxScrollYRef.current = window.scrollY;
    };
    window.addEventListener("scroll", sample, { passive: true });

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return; // paused while hidden
      recordOutreachEngagement({ scrollPct: currentScrollPct() });
    }, REPORT_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState !== "hidden" || hiddenFiredRef.current) return;
      hiddenFiredRef.current = true;
      recordOutreachEngagementOnHide(currentScrollPct());
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("scroll", sample);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [profileSlug]);

  return null;
}
