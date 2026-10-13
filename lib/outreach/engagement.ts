"use client";

// Outreach engagement reporting (VenueFindr → https://[slug].sqrz.com?r=[token]).
// All state here is in-memory only — no cookies, no localStorage, no
// persisted visitor identifier. Set once by OutreachEngagementGate when ?r=
// is present on this page load; every other call site (MusicEmbeds' play
// handler, LinkClickTracker, BookMeButton, Services, BookingModal,
// DownloadCtaButton, PaymentGateCta) goes through
// recordOutreachEngagement()/recordOutreachEngagementOnHide()/
// recordOutreachEvent() below, which are safe no-ops whenever this hasn't
// been set — i.e. on the overwhelming majority of page loads, which never
// carry ?r=. "Without r present, nothing changes" holds because every one of
// these functions' first line is exactly that check.
let activeToken: string | null = null;
let activeSlug: string | null = null;
let sessionId: string | null = null;

export function initOutreachEngagement(token: string, slug: string): void {
  activeToken = token;
  activeSlug = slug;
  sessionId = crypto.randomUUID();
}

export function hasActiveOutreachSession(): boolean {
  return activeToken !== null;
}

type EngagementFlags = {
  scrollPct?: number;
  play?: boolean;
  linkTap?: boolean;
};

function buildPayload(flags: EngagementFlags) {
  // Rounded to the nearest 10, per spec — also means a burst of near-identical
  // scroll positions across calls doesn't create meaningfully different payloads.
  const scrollPct =
    flags.scrollPct != null
      ? Math.max(0, Math.min(100, Math.round(flags.scrollPct / 10) * 10))
      : 0;
  return {
    token: activeToken,
    session_id: sessionId,
    slug: activeSlug,
    scroll_pct: scrollPct,
    play: flags.play ?? false,
    link_tap: flags.linkTap ?? false,
  };
}

// Fire-and-forget — errors are swallowed, never surfaced to the caller and
// never visible on the page. A no-op whenever no ?r= was present on this load.
export function recordOutreachEngagement(flags: EngagementFlags = {}): void {
  if (!activeToken || !activeSlug || !sessionId) return;
  try {
    fetch("/api/outreach/engagement", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(flags)),
    }).catch(() => undefined);
  } catch {
    // never throw into the caller
  }
}

// Labeled, discrete events (cta_tap/service_tap/contact_open/contact_submit/
// download) — distinct from the scroll/play/link-tap counters above. Posts
// to its own sibling relay route (/api/outreach/event) rather than
// overloading /api/outreach/engagement's payload shape. Fire-and-forget, same
// as recordOutreachEngagement — never surfaced to the caller, a no-op
// whenever no ?r= was present on this load. `label` must never be/contain
// form field contents (e.g. a visitor's name/email/message) — callers pass a
// static or data-derived label only (CTA text, service name, file label).
export function recordOutreachEvent(
  eventType: "cta_tap" | "service_tap" | "contact_open" | "contact_submit" | "download",
  label?: string | null
): void {
  if (!activeToken || !activeSlug || !sessionId) return;
  try {
    fetch("/api/outreach/event", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: activeToken,
        session_id: sessionId,
        slug: activeSlug,
        event_type: eventType,
        label: label ?? null,
      }),
    }).catch(() => undefined);
  } catch {
    // never throw into the caller
  }
}

// The visibilitychange→hidden ping specifically — needs to survive the page
// potentially being torn down a moment later, so this prefers
// navigator.sendBeacon (built for exactly that) and falls back to a
// keepalive fetch wherever sendBeacon isn't available. Also a no-op
// whenever no ?r= was present on this load.
export function recordOutreachEngagementOnHide(scrollPct: number): void {
  if (!activeToken || !activeSlug || !sessionId) return;
  const body = JSON.stringify(buildPayload({ scrollPct }));
  try {
    const sent =
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(
        "/api/outreach/engagement",
        new Blob([body], { type: "application/json" })
      );
    if (!sent) {
      fetch("/api/outreach/engagement", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body,
      }).catch(() => undefined);
    }
  } catch {
    // never throw into the caller
  }
}
