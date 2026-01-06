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
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function nextStep() {
    if (!name || !email) {
      setError("Please enter name and email.");
      return;
    }
    setError(null);
    setStep(2);
  }

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
            message,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to send booking request");
      }

      onClose();
      setStep(1);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
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

        <h2 style={{ marginBottom: 16 }}>
          Booking Request
        </h2>

        {/* STEP INDICATOR */}
        <p style={{ opacity: 0.6, marginBottom: 16 }}>
          Step {step} of 2
        </p>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
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
                <p style={errorStyle}>{error}</p>
              )}

              <button
                type="button"
                style={submitStyle}
                onClick={nextStep}
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <textarea
                placeholder="Tell us about your event, date, location, requirements…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={textareaStyle}
                rows={5}
                required
              />

              {error && (
                <p style={errorStyle}>{error}</p>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => setStep(1)}
                >
                  Back
                </button>

                <button
                  type="submit"
                  style={submitStyle}
                  disabled={loading}
                >
                  {loading ? "Sending…" : "Send request"}
                </button>
              </div>
            </>
          )}
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
  maxWidth: 420,
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

const textareaStyle = {
  ...inputStyle,
  resize: "vertical" as const,
};

const submitStyle = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: 10,
  border: "none",
  background: "var(--accent-color)",
  color: "#000",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #333",
  background: "#000",
  color: "#fff",
  cursor: "pointer",
};

const errorStyle = {
  color: "#ff6b6b",
  marginBottom: 12,
};
