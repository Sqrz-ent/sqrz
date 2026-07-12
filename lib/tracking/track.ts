import { getConsentState } from "./getConsentState";

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

// Consent-free, identifier-free page view. Sends NO session_id and never
// touches sessionStorage/cookies, so no client identifier is stored — this is
// an aggregate first-party count that does not require analytics consent under
// ePrivacy/GDPR. Used to recover ad traffic (esp. Meta in-app browser) that
// bounces before ever accepting the cookie banner. Fires at most once per load;
// when consent IS present the identified track() runs instead, so there is no
// double count.
export async function trackPageViewCookieless(
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await post({
      event_type: "page_view",
      session_id: null,
      ...getAttribution(),
      event_properties: { ...(properties ?? {}), cookieless: true },
    });
  } catch {
    // silent failure
  }
}

// Consent-free, identifier-free page-exit engagement ping. Same rules as the
// page_view ping: NO session_id, no client storage. Carries time-on-page (from
// the module-level pageLoadTime) and the max scroll depth reached, so we can see
// engagement quality for ad traffic that never accepts the cookie banner.
// keepalive lets it flush during visibilitychange/unload as Meta's in-app
// browser tears the WebView down.
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
