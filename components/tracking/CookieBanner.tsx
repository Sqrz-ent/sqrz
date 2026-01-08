"use client";

import { useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(true);

  const setConsent = (consent: {
    analytics: boolean;
    marketing: boolean;
    timestamp: number;
  }) => {
    document.cookie = `sqrz_cookie_consent=${encodeURIComponent(
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
    <div>
      <p>We use cookies for analytics and marketing.</p>
      <button onClick={onAcceptAll}>Accept all</button>
      <button onClick={onRejectAll}>Reject</button>
    </div>
  );
}
