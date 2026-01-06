"use client";

import { useState } from "react";

export default function BookingModal({
  open,
  onClose,
  username,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/submitInquiry/${username}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to send booking request");
      }

      // optional: await res.json();
      onClose(); // close modal on success
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeStyle}>
          ✕
        </button>

        <h2 style={{ marginBottom: 16 }}>Booking Request</h2>

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

          {error && (
            <p style={{ color: "#ff6b6b", marginBottom: 12 }}>
              {error}
            </p>
          )}

          <button type="submit" style={submitStyle} disabled={loading}>
            {loading ? "Sending..." : "Continue"}
          </button>
        </form>
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
  background: "#111",
  padding: 24,
  borderRadius: 16,
  width: "100%",
  maxWidth: 400,
  color: "#fff",
  position: "relative" as const,
};

const closeStyle = {
  position: "absolute" as const,
  top: 12,
  right: 12,
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: 18,
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #333",
  background: "#000",
  color: "#fff",
};

const submitStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "none",
  background: "var(--accent-color)",
  color: "#000",
  fontWeight: 600,
  cursor: "pointer",
};
