import { getConsentState } from "./getConsentState";

function getOrCreateSessionId(): string {
  const key = "sqrz_sid";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, id);
  return id;
}

export async function track(
  eventType: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    if (!getConsentState().analytics) return;

    const searchParams = new URLSearchParams(window.location.search);
    const utm_source   = searchParams.get("utm_source");
    const utm_medium   = searchParams.get("utm_medium");
    const utm_campaign = searchParams.get("utm_campaign");
    const utm_content  = searchParams.get("utm_content");

    await fetch("/api/track", {
      method: "POST",
      // keepalive lets the request survive the page navigation that follows a
      // click-then-navigate event (e.g. the hero pill / external CTAs opening a
      // link). Without it the browser tears down the in-flight fetch before it
      // flushes, so those events silently never land. Payload is tiny (<64KB).
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        session_id: getOrCreateSessionId(),
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        event_properties: properties ?? {},
      }),
    });
  } catch {
    // silent failure
  }
}
