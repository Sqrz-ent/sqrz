"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "sqrz_cookie_consent";

const THEMES: Record<string, { bg: string; text: string; accent: string; border: string }> = {
  midnight: { bg: "#0a0a0a", text: "#ffffff", accent: "#F3B130", border: "rgba(255,255,255,0.12)" },
  neon:     { bg: "#0d0d1a", text: "#ffffff", accent: "#A855F7", border: "rgba(255,255,255,0.12)" },
  studio:   { bg: "#080f1a", text: "#ffffff", accent: "#38BDF8", border: "rgba(255,255,255,0.12)" },
};
const DEFAULT = THEMES["midnight"];

export default function CookieBanner({ templateId }: { templateId?: string | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(COOKIE_NAME + "="));

    if (!cookie) {
      setVisible(true);
    }
  }, []);

  const setConsent = (consent: {
    analytics: boolean;
    marketing: boolean;
    timestamp: number;
  }) => {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify(consent)
    )}; path=/; max-age=${60 * 60 * 24 * 180}`;

    setVisible(false);
  };

  const onAcceptAll = () => {
    setConsent({
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  };

  const onRejectAll = () => {
    setConsent({
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  };

  if (!visible) return null;

  const theme = (templateId && THEMES[templateId]) ? THEMES[templateId] : DEFAULT;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        background: theme.bg,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        padding: 16,
        borderRadius: 12,
        zIndex: 9999,
      }}
    >
      <p style={{ marginBottom: 12, fontSize: 13, lineHeight: 1.5, margin: "0 0 12px" }}>
        We use cookies for analytics and marketing to help you get booked.
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onAcceptAll}
          style={{
            padding: "8px 16px",
            background: theme.accent,
            color: "#111",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Accept all
        </button>
        <button
          onClick={onRejectAll}
          style={{
            padding: "8px 16px",
            background: "transparent",
            color: theme.text,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
