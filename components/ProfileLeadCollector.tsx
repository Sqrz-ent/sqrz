"use client";

import { useState } from "react";

// A soft, non-obstructive email collector shown at the very bottom of the
// public profile — not a gate, not a primary CTA. Fully optional; if ignored
// it costs the visitor nothing.
export default function ProfileLeadCollector({ profileId }: { profileId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value || status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/profile/collect-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, email: value }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section style={{ padding: "8px 0 4px", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "20px 22px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {status === "success" ? (
          <p
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            You&apos;re in — thanks!
          </p>
        ) : (
          <>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 15,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Stay in the loop
            </p>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: 13,
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Drop your email for occasional updates. Optional, no spam.
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                disabled={status === "submitting"}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontSize: 16, // 16px avoids iOS Safari zoom-on-focus
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                style={{
                  flexShrink: 0,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent-color, #F3B130)",
                  color: "#111",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: status === "submitting" ? "default" : "pointer",
                  opacity: status === "submitting" ? 0.6 : 1,
                }}
              >
                {status === "submitting" ? "…" : "Notify me"}
              </button>
            </form>
            {status === "error" && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#ef9a9a" }}>
                Something went wrong — please try again.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
