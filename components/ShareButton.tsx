"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    // Native share (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this profile",
          url,
        });
        return;
      } catch (err) {
        // user canceled → fallback
      }
    }

    // Fallback: copy link
    await navigator.clipboard.writeText(url);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleShare} style={buttonStyle}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}

/* styles */

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #333",
  background: "#000",
  color: "#f3b130",
  fontSize: 14,
  cursor: "pointer",
};
