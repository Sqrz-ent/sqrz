"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { track } from "@/lib/tracking/track";

// Derives a booking title from the first non-empty line of the inquiry message,
// falling back to a generic label when the message is a single line or empty.
function deriveTitle(message: string): string {
  const firstLine = message.split("\n")[0]?.trim();
  return firstLine || "New Inquiry";
}

export default function BookingModal({
  open,
  onClose,
  username,
  profileId,
  profileName = null,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  profileId: string;
  profileName?: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Reset form state each time the modal opens
    setName("");
    setEmail("");
    setMessage("");
    setError(null);
    setSuccess(false);
    track("booking_modal_open", {
      profile_slug: username,
      profile_id: profileId,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  // ─── Stored ref code ──────────────────────────────────────────────────────
  function getStoredRef(): string | null {
    const ref = localStorage.getItem("sqrz_booking_ref");
    const expires = localStorage.getItem("sqrz_booking_ref_expires");
    if (!ref || !expires) return null;
    if (new Date(expires) < new Date()) {
      localStorage.removeItem("sqrz_booking_ref");
      localStorage.removeItem("sqrz_booking_ref_expires");
      return null;
    }
    return ref;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    if (!message.trim()) {
      setError("Please tell us what you have in mind.");
      return;
    }
    setError(null);
    setLoading(true);

    let utmSource: string | null = null;
    let utmMedium: string | null = null;
    let utmCampaign: string | null = null;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      utmSource   = sessionStorage.getItem("utm_source")   ?? searchParams.get("utm_source");
      utmMedium   = sessionStorage.getItem("utm_medium")   ?? searchParams.get("utm_medium");
      utmCampaign = sessionStorage.getItem("utm_campaign") ?? searchParams.get("utm_campaign");
    } catch { /* sessionStorage unavailable — fail silently */ }

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_booking_request", {
        p_to_slug: username,
        p_from_name: name,
        p_from_email: email,
        p_title: deriveTitle(message),
        p_message: message,
        p_booking_ref_code: getStoredRef(),
        p_utm_source:   utmSource   ?? undefined,
        p_utm_medium:   utmMedium   ?? undefined,
        p_utm_campaign: utmCampaign ?? undefined,
      });

      if (rpcError) throw rpcError;

      // Normalise: handle string JSON, array-wrapped, or plain object
      let result: Record<string, unknown> = {};
      if (typeof rpcData === "string") {
        try { result = JSON.parse(rpcData); } catch { result = {}; }
      } else if (Array.isArray(rpcData)) {
        result = (rpcData[0] as Record<string, unknown>) ?? {};
      } else if (rpcData && typeof rpcData === "object") {
        result = rpcData as Record<string, unknown>;
      }

      if (result.error) throw new Error(String(result.error));

      // Always attempt the receipt email — let the route surface errors if fields missing.
      // The RPC creates a lead now (no booking), so there's no booking_id/invite_token
      // to send — the email is a plain "we got your message" receipt, no tracking link.
      try {
        const confirmRes = await fetch("/api/booking-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requester_name: name,
            requester_email: email,
            artist_name: username,
          }),
        });
        if (!confirmRes.ok) {
          const confirmJson = await confirmRes.json().catch(() => ({}));
          console.error("[BookingModal] booking-confirm error:", confirmRes.status, confirmJson);
        }
      } catch (emailErr) {
        console.error("[BookingModal] booking-confirm fetch threw:", emailErr);
      }

      track("booking_request_sent", {
        profile_slug: username,
        profile_id: profileId,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Success screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <button onClick={onClose} style={closeStyle}>✕</button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12, textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <h2>Your inquiry was sent</h2>
            <p style={{ opacity: 0.7, lineHeight: 1.6 }}>
              {profileName ? `${profileName} will get back to you shortly.` : "We'll get back to you shortly."}<br />
              Keep an eye on <strong>{email}</strong> for their response.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeStyle}>✕</button>

        <h2 style={{ marginBottom: 8 }}>Send an inquiry</h2>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
            <textarea
              placeholder={`Tell ${profileName || "us"} what you have in mind`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={textareaStyle}
              rows={5}
              required
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button type="submit" style={submitStyle} disabled={loading}>
              {loading ? "Sending…" : "Send Inquiry"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

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
  padding: 24,
  borderRadius: 16,
  width: "100%",
  maxWidth: 420,
  minHeight: 360,
  color: "#111111",
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
};

const closeStyle = {
  position: "absolute" as const,
  top: 12,
  right: 12,
  background: "transparent",
  border: "none",
  color: "#666666",
  fontSize: 18,
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #e0e0e0",
  background: "#f5f5f5",
  color: "#111111",
  boxSizing: "border-box" as const,
  fontSize: 14,
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical" as const,
};

const submitStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "none",
  background: "var(--accent-color, #F3B130)",
  color: "#000",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
};

const errorStyle = {
  color: "#ff6b6b",
  marginBottom: 12,
  fontSize: 13,
};
