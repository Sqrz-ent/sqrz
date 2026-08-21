import { getConsentState } from "./getConsentState";

// Meta/TikTok pixel globals — only ever present on window once AnalyticsGate's
// consent-gated <Script> blocks have actually run for a configured pixel ID.
// That's exactly the guard fireLeadConversionPixels() below relies on: no
// separate "is a pixel configured / was consent given" check needed here,
// since an absent global already means one of those wasn't true.
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void };
  }
}

// Timestamp of first module use in this page load — the basis for time-on-page.
// Module-level (not sessionStorage), so it carries no identifier and resets on
// every fresh load, exactly like the cookieless pings that consume it.
const pageLoadTime = Date.now();

function getOrCreateSessionId(): string {
  const key = "sqrz_sid";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  fbclid: string | null;
  gclid: string | null;
  referrer: string | null;
};

let cachedAttribution: Attribution | null = null;

// Reads campaign/ad attribution straight off the current URL and document, then
// caches it so both the page_view and page_exit pings share identical values
// derived once at page load. These are request-scoped values (not stored client
// identifiers), so reading them requires no cookie consent — safe on the
// cookieless pings too. Capturing at load also guards against the URL being
// rewritten (Meta's in-app browser strips fbclid/UTMs after landing).
function getAttribution(): Attribution {
  if (cachedAttribution) return cachedAttribution;
  const searchParams = new URLSearchParams(window.location.search);
  cachedAttribution = {
    utm_source:   searchParams.get("utm_source"),
    utm_medium:   searchParams.get("utm_medium"),
    utm_campaign: searchParams.get("utm_campaign"),
    utm_content:  searchParams.get("utm_content"),
    fbclid:       searchParams.get("fbclid"),
    gclid:        searchParams.get("gclid"),
    referrer:     document.referrer || null,
  };
  return cachedAttribution;
}

function post(body: Record<string, unknown>): Promise<unknown> {
  return fetch("/api/track", {
    method: "POST",
    // keepalive lets the request survive the page navigation that follows a
    // click-then-navigate event (e.g. the hero pill / external CTAs opening a
    // link), and — crucially for ad traffic — survive Meta's in-app browser
    // tearing the WebView down on a fast bounce. Payload is tiny (<64KB).
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function track(
  eventType: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    if (!getConsentState().analytics) return;

    await post({
      event_type: eventType,
      session_id: getOrCreateSessionId(),
      ...getAttribution(),
      event_properties: properties ?? {},
    });
  } catch {
    // silent failure
  }
}

// Generic consent-free, identifier-free event. Sends NO session_id and never
// touches sessionStorage/cookies, so no client identifier is stored — an
// aggregate first-party signal that does not require analytics consent under
// ePrivacy/GDPR. Shares getAttribution() so every cookieless event (page_view,
// page_exit, widget_*, cta_click) carries identical ad_source/fbclid/UTM tags.
export async function trackCookieless(
  eventType: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await post({
      event_type: eventType,
      session_id: null,
      ...getAttribution(),
      event_properties: { ...(properties ?? {}), cookieless: true },
    });
  } catch {
    // silent failure
  }
}

// Consent-free, identifier-free page view. Used to recover ad traffic (esp.
// Meta in-app browser) that bounces before ever accepting the cookie banner.
// Fires at most once per load; when consent IS present the identified track()
// runs instead, so there is no double count.
export async function trackPageViewCookieless(
  properties?: Record<string, unknown>
): Promise<void> {
  await trackCookieless("page_view", properties);
}

// Per-URL debounce for cta_click. The delegated LinkClickTracker and the
// primary CTA's featured-link branch (BookMeButton) both route through here,
// so this map is shared across every CTA source on the page. Guards against
// bursts of duplicate clicks on the same link — e.g.
// the synthetic/prefetch clicks the Meta in-app browser dispatches — that would
// otherwise inflate "CTA click" (a conversion-intent signal) beyond real taps.
const CTA_DEDUPE_MS = 1500;
const lastCtaByUrl = new Map<string, number>();

// Single entry point for cta_click. Scope it to intentional CTAs at the call
// site; this function only handles the shared shape + dedupe.
export async function trackCtaClick(
  properties: { link_url?: string | null; link_label?: string | null; profile_id?: string | null }
): Promise<void> {
  const key = properties.link_url ?? properties.link_label ?? "";
  const now = Date.now();
  const last = lastCtaByUrl.get(key);
  if (last != null && now - last < CTA_DEDUPE_MS) return; // duplicate within window
  lastCtaByUrl.set(key, now);
  await trackCookieless("cta_click", properties);
}

// Consent-free, identifier-free page-exit engagement ping. Same rules as the
// page_view ping: NO session_id, no client storage. Carries time-on-page (from
// the module-level pageLoadTime) and the max scroll depth reached, so we can see
// engagement quality for ad traffic that never accepts the cookie banner.
// keepalive lets it flush during visibilitychange/unload as Meta's in-app
// browser tears the WebView down.
// Fires the standard "lead captured" conversion event on every configured
// vendor pixel — call this at the ONE moment a visitor's inquiry actually
// becomes a lead (currently: BookingModal's successful create_booking_request
// submission). Meta's own standard event for this is 'Lead'; TikTok has no
// literal "Lead" event in its taxonomy — 'SubmitForm' is the closest, precise
// match (a visitor submitted a data-collection form), not 'Contact' (TikTok's
// docs frame that one around phone/chat contact initiation, not form data).
// No pixel-ID/consent check needed here — see the declare global comment
// above for why an absent fbq/ttq already implies one of those wasn't true.
export function fireLeadConversionPixels(): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq === "function") {
    window.fbq("track", "Lead");
  }
  if (typeof window.ttq?.track === "function") {
    window.ttq.track("SubmitForm");
  }
}

export async function trackPageExitCookieless(
  maxScrollDepthPct: number,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    const time_on_page_seconds = Math.round((Date.now() - pageLoadTime) / 1000);
    const max_scroll_depth_pct = Math.max(0, Math.min(100, Math.round(maxScrollDepthPct)));

    await post({
      event_type: "page_exit",
      session_id: null,
      ...getAttribution(),
      event_properties: {
        ...(properties ?? {}),
        cookieless: true,
        time_on_page_seconds,
        max_scroll_depth_pct,
      },
    });
  } catch {
    // silent failure
  }
}
