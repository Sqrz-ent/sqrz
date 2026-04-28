"use client";

import { useState } from "react";
import { track } from "@/lib/tracking/track";

export default function ChatBubble({
  profileId,
  profileSlug,
  profileName,
}: {
  profileId: string;
  profileSlug: string;
  profileName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: profileId,
          visitor_name: name.trim(),
          visitor_email: email.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    borderRadius: 8,
    border: "1px solid #e0e0e0",
    background: "#f5f5f5",
    color: "#111111",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <>
      {/* ── Panel ────────────────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            right: 20,
            width: 320,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
            zIndex: 9999,
            overflow: "hidden",
            animation: "chatPanelIn 0.2s ease",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px 12px",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#111111", fontSize: 14, fontWeight: 700 }}>
              Message {profileName}
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#888888",
                fontSize: 20,
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "16px" }}>
            {status === "success" ? (
              <div
                style={{
                  padding: "24px 0",
                  textAlign: "center",
                  color: "#111111",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
                <strong>Message sent!</strong>
                <br />
                <span style={{ color: "#666666" }}>
                  {profileName} will be in touch.
                </span>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
                <textarea
                  placeholder="What are you looking for?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    lineHeight: 1.5,
                  }}
                />
          
                {status === "error" && (
                  <p style={{ color: "#f87171", fontSize: 12, margin: 0 }}>
                    Something went wrong — please try again.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  style={{
                    marginTop: 4,
                    padding: "11px",
                    background: "var(--accent-color, #F3B130)",
                    color: "#111111",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: status === "loading" ? 0.7 : 1,
                  }}
                >
                  {status === "loading" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Bubble button ─────────────────────────────────────────────────── */}
      <button
        onClick={() => {
          const opening = !open;
          setOpen(opening);
          if (opening) track("chat_opened", { profile_slug: profileSlug, profile_id: profileId });
        }}
        aria-label="Message this creator"
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--accent-color, #F3B130)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(243,177,48,0.45)",
          zIndex: 9999,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="#111"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes chatPanelIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
