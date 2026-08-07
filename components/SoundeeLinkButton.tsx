"use client";

import LinkOutButton from "./LinkOutButton";

// Soundee storefront widget — plain per-profile URL field (profiles.soundee_url).
// Was an iframe embed (2026-08-08: replaced with a simple link-out button).
// Soundee's embed loads their entire storefront chrome (page-builder UI, their
// own cookie banner) with no lighter embed option, and there's no public
// catalog API to build a native replacement from — a plain "View my shop"
// button that opens the storefront in a new tab is the right fix. Applies
// everywhere Soundee renders (profile page + link pages, both via
// ShopSection) — this is the one place that renders it.
export default function SoundeeLinkButton({ url }: { url: string | null }) {
  if (!url) return null;

  return <LinkOutButton url={url} text="View my shop" style={buttonStyle} />;
}

const buttonStyle = {
  display: "block",
  width: "100%",
  padding: "16px",
  background: "var(--accent-color, #F5A623)",
  color: "#000",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 700,
  textAlign: "center",
  cursor: "pointer",
  boxSizing: "border-box",
} as const;
