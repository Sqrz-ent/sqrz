"use client";

import { useState } from "react";

type Props = {
  href: string;
  accent: string;
  label: string;
  linkId: string;
};

export default function LeadGateCta({ href, accent, label, linkId }: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/links/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_id: linkId, email }),
      });
    } catch {
      // Non-fatal — redirect regardless
    }
    window.location.href = href;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        style={{
          flex: 1,
          padding: "14px 16px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 12,
          fontSize: 16,
          color: "#fff",
          outline: "none",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      />
      <button
        type="submit"
        disabled={submitting || !email}
        style={{
          padding: "14px 20px",
          background: accent,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.7 : 1,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {submitting ? "…" : label || "Continue →"}
      </button>
    </form>
  );
}
