"use client";

import { useEffect, useState } from "react";

const COOKIE_NAME = "sqrz_cookie_consent";

export default function CookieBanner() {
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

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        background: "#111",
        color: "#fff",
        padding: 16,
        borderRadius: 12,
        zIndex: 9999,
      }}
    >
      <p style={{ marginBottom: 12 }}>
        We use cookies for analytics and marketing to help you get booked.
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onAcceptAll}>Accept all</button>
        <button onClick={onRejectAll}>Reject</button>
      </div>
    </div>
  );
}
