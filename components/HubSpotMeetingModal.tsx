"use client";

import { useEffect, useState } from "react";

// Iframe modal for scheduling providers with no popup JS SDK equivalent to
// react-calendly. HubSpot Meetings' native embed is script-tag markup meant
// for static pages, not a callable popup component — so instead of forcing
// that into CalendlyPopupButton's call pattern, this just loads the hosted
// meeting page directly in an iframe (it's self-contained and works standalone
// at that URL, same trust level as any other artist-supplied link field).
export default function HubSpotMeetingModal({
  url,
  open,
  onClose,
}: {
  url: string;
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Mirrors CalendlyPopupButton's SSR-safe mount-guard — avoid any DOM/body
  // access before the client has mounted.
  if (!mounted || !open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeStyle} aria-label="Close">✕</button>
        <iframe src={url} style={iframeStyle} title="Schedule a meeting" />
      </div>
    </div>
  );
}

/* styles */

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#ffffff",
  borderTop: "3px solid var(--accent-color, #F3B130)",
  borderRadius: 16,
  width: "100%",
  maxWidth: 720,
  height: "85vh",
  maxHeight: 820,
  position: "relative" as const,
  overflow: "hidden" as const,
};

const closeStyle = {
  position: "absolute" as const,
  top: 12,
  right: 12,
  background: "rgba(255,255,255,0.9)",
  border: "none",
  borderRadius: "50%",
  width: 32,
  height: 32,
  color: "#666666",
  fontSize: 16,
  cursor: "pointer",
  zIndex: 1,
};

const iframeStyle = {
  width: "100%",
  height: "100%",
  border: "none",
};
