export function getConsentState(): { analytics: boolean; marketing: boolean } {
  try {
    const raw = document.cookie
      .split("; ")
      .find((r) => r.startsWith("sqrz_cookie_consent="));
    if (!raw) return { analytics: false, marketing: false };
    const consent = JSON.parse(decodeURIComponent(raw.split("=")[1]));
    return {
      analytics: consent.analytics === true,
      marketing: consent.marketing === true,
    };
  } catch {
    return { analytics: false, marketing: false };
  }
}
