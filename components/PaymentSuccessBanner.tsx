"use client";

import { useState } from "react";

export default function PaymentSuccessBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1001,
        background: "#F5A623",
        color: "#fff",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        boxShadow: "0 2px 12px rgba(245,166,35,0.4)",
        flexWrap: "wrap",
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600 }}>
        Your booking is confirmed! Check your email for details.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          background: "rgba(255,255,255,0.25)",
          border: "none",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          width: 28,
          height: 28,
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
