"use client";
import { useEffect, useState } from "react";

const COOKIE_NAME = "sqrz_cookie_consent";

const THEMES: Record<string, { bg: string; text: string; accent: string; border: string }> = {
  "midnight": { bg: "#0a0a0a", text: "#ffffff", accent: "#F3B130", border: "rgba(255,255,255,0.12)" },
  "neon":     { bg: "#0d0d1a", text: "#ffffff", accent: "#A855F7", border: "rgba(255,255,255,0.12)" },
  "studio":   { bg: "#080f1a", text: "#ffffff", accent: "#38BDF8", border: "rgba(255,255,255,0.12)" },
};
const DEFAULT = THEMES["midnight"];

type Props = { templateId?: string | null };

export default function CookieBanner({ templateId }: Props) {
  const [visible, setVisible] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const t = THEMES[templateId ?? ""] ?? DEFAULT;

  useEffect(() => {
    const cookie = document.cookie.split("; ").find(r => r.startsWith(COOKIE_NAME + "="));
    if (cookie) {
      setHasConsent(true);
    } else {
      setVisible(true);
    }
  }, []);

  const setConsent = (analytics: boolean, marketing: boolean) => {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify({ analytics, marketing, timestamp: Date.now() })
    )}; path=/; max-age=${60 * 60 * 24 * 180}`;
    setVisible(false);
    setHasConsent(true);
    // Notify AnalyticsGate immediately
    window.dispatchEvent(new Event("sqrz_consent_updated"));
    // Log to Supabase
    fetch('/api/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: analytics ? 'accepted' : 'declined',
        domain: window.location.hostname
      })
    }).catch(() => {}); // fire and forget
  };

  return (
    <>
      {/* Persistent trigger button — always visible after consent */}
      {hasConsent && !visible && (
        <button
          onClick={() => setVisible(true)}
          title="Cookie settings"
          style={{
            position: "fixed",
            bottom: "1rem",
            left: "1rem",
            zIndex: 9998,
            background: t.bg,
            border: `1px solid ${t.border}`,
            borderRadius: "8px",
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: "11px",
            color: t.text,
            opacity: 0.5,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
        >
          🍪
        </button>
      )}

      {/* Banner */}
      {visible && (
        <div style={{
          position: "fixed",
          bottom: "1rem",
          left: "1rem",
          right: "1rem",
          maxWidth: "400px",
          margin: "0 auto",
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: t.text, opacity: 0.85 }}>
              We use cookies for analytics and marketing to help you get booked.{" "}
              <a href="/cookies" style={{ color: t.accent, textDecoration: "underline" }}>Learn more</a>
            </p>
            {hasConsent && (
              <button onClick={() => setVisible(false)} style={{
                background: "none", border: "none", color: t.text,
                cursor: "pointer", opacity: 0.5, fontSize: "16px",
                padding: "0 0 0 8px", flexShrink: 0,
              }}>✕</button>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setConsent(true, true)} style={{
              flex: 1, background: t.accent, color: "#000", border: "none",
              borderRadius: "8px", padding: "0.5rem", fontSize: "13px",
              fontWeight: 700, cursor: "pointer",
            }}>Accept all</button>
            <button onClick={() => setConsent(false, false)} style={{
              flex: 1, background: "transparent", color: t.text,
              border: `1px solid ${t.border}`, borderRadius: "8px",
              padding: "0.5rem", fontSize: "13px", cursor: "pointer", opacity: 0.7,
            }}>Decline</button>
          </div>
        </div>
      )}
    </>
  );
}
