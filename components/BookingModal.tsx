"use client";

import { useEffect, useState } from "react";
import type { Service } from "@/types/service";
import { getServicePriceLabel } from "@/utils/serviceLabel";
import { supabase } from "@/lib/supabase";

type Step = 0 | 1 | 2 | 3 | 4;

export default function BookingModal({
  open,
  onClose,
  username,
  services,
  profileId,
  initialService = null,
  simplified = false,
  prefilledTitle = null,
  prefilledDescription = null,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  services: Service[];
  profileId: string;
  initialService?: Service | null;
  simplified?: boolean;
  prefilledTitle?: string | null;
  prefilledDescription?: string | null;
}) {
  // simplified: start at step 1 (skip service selection)
  // normal with initialService: start at step 1
  // normal without: start at step 0
  const initialStep: Step = simplified || initialService ? 1 : 0;

  const [step, setStep] = useState<Step>(initialStep);
  const [selectedService, setSelectedService] = useState<Service | null>(initialService ?? null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  // ─── Step navigation ──────────────────────────────────────────────────────

  function nextFromStep1() {
    if (!name || !email) {
      setError("Please enter your name and email.");
      return;
    }
    setError(null);
    // simplified: skip step 2 (project/description), go straight to date
    setStep(simplified ? 3 : 2);
  }

  function nextFromStep2() {
    if (!message) {
      setError("Please add a short description.");
      return;
    }
    setError(null);
    setStep(3);
  }

  // ─── Final submit ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_booking_request", {
        p_to_slug: username,
        p_from_name: name,
        p_from_email: email,
        p_service: selectedService?.title ?? null,
        // simplified: use link description as message; normal: use what user typed
        p_message: simplified
          ? (prefilledDescription ?? prefilledTitle ?? "")
          : message,
        p_event_date: date || null,
        p_event_location: [city, country].filter(Boolean).join(", ") || null,
        p_budget_min: null,
        p_budget_max: null,
        p_currency: "EUR",
        p_source: "private_link",
        p_utm_source: null,
        p_utm_campaign: null,
      });

      if (rpcError) throw rpcError;

      const { booking_id, invite_token } = rpcData as { success: boolean; booking_id: string; invite_token: string };

      // Send confirmation email with guest access link
      await fetch("/api/booking-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, booking_id, invite_token }),
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
            <h2>Your request has been sent!</h2>
            <p style={{ opacity: 0.7 }}>Check your email to confirm your booking request.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step indicator ───────────────────────────────────────────────────────
  // simplified: steps 1,3,4 → display 1,2,3 of 3
  // normal:     steps 0-4   → display 1-5 of 5
  const totalSteps = simplified ? 3 : 5;
  const stepNumber = simplified
    ? (step === 1 ? 1 : step === 3 ? 2 : 3)
    : step + 1;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeStyle}>✕</button>

        <h2 style={{ marginBottom: 8 }}>
          {simplified ? (prefilledTitle ?? "Booking Request") : "Booking Request"}
        </h2>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 40 }}>
          <form onSubmit={handleSubmit}>

            {/* STEP 0 — Select service (normal mode only) */}
            {step === 0 && !simplified && (
              <>
                <h3 style={{ marginBottom: 12 }}>Select a service</h3>
                {services.length === 0 ? (
                  <p style={{ opacity: 0.6, fontSize: 14 }}>Currently no services available.</p>
                ) : (
                  services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onClick={() => { setSelectedService(service); setStep(1); }}
                    />
                  ))
                )}
              </>
            )}

            {/* STEP 1 — Name + email */}
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
                {error && <p style={errorStyle}>{error}</p>}
                <button type="button" style={submitStyle} onClick={nextFromStep1} disabled={loading}>
                  Continue
                </button>
              </>
            )}

            {/* STEP 2 — Project + description (normal mode only) */}
            {step === 2 && !simplified && (
              <>
                <input
                  type="text"
                  placeholder="Project name"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  style={inputStyle}
                />
                <textarea
                  placeholder="Tell us about your event, location, requirements…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={textareaStyle}
                  rows={5}
                  required
                />
                {error && <p style={errorStyle}>{error}</p>}
                <div style={buttonRowStyle}>
                  <button type="button" style={secondaryButtonStyle} onClick={() => setStep(1)}>Back</button>
                  <button type="button" style={submitStyle} onClick={nextFromStep2}>Continue</button>
                </div>
              </>
            )}

            {/* STEP 3 — Date + time */}
            {step === 3 && (
              <>
                <label style={labelStyle}>Event date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                  required
                />
                <label style={labelStyle}>Event time (optional)</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={inputStyle}
                />
                {error && <p style={errorStyle}>{error}</p>}
                <div style={buttonRowStyle}>
                  {/* Back goes to step 1 in simplified, step 2 in normal */}
                  <button type="button" style={secondaryButtonStyle} onClick={() => setStep(simplified ? 1 : 2)}>Back</button>
                  <button type="button" style={submitStyle} onClick={() => setStep(4)}>Continue</button>
                </div>
              </>
            )}

            {/* STEP 4 — Address + submit */}
            {step === 4 && (
              <>
                <input type="text" placeholder="Street & number" value={street} onChange={(e) => setStreet(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="ZIP / Postal code" value={zip} onChange={(e) => setZip(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle} />
                {error && <p style={errorStyle}>{error}</p>}
                <div style={buttonRowStyle}>
                  <button type="button" style={secondaryButtonStyle} onClick={() => setStep(3)}>Back</button>
                  <button type="submit" style={submitStyle} disabled={loading}>
                    {loading ? "Sending…" : "Send request"}
                  </button>
                </div>
              </>
            )}

          </form>
        </div>

        {/* Step indicator */}
        <p style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", opacity: 0.5, fontSize: 13, whiteSpace: "nowrap" }}>
          Step {stepNumber} of {totalSteps}
        </p>
      </div>
    </div>
  );
}

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...inputStyle,
        textAlign: "left",
        cursor: "pointer",
        background: "#f5f5f5",
        border: hovered ? "1px solid var(--accent-color, #F3B130)" : "1px solid #e0e0e0",
        transition: "border-color 0.15s",
      }}
    >
      <strong>{service.title}</strong>
      <div style={{ opacity: 0.7, fontSize: 13 }}>{getServicePriceLabel(service)}</div>
    </button>
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
  minHeight: 520,
  color: "#111111",
  position: "relative" as const,
  transition: "min-height 0.2s ease",
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

const labelStyle = {
  fontSize: 13,
  opacity: 0.7,
  marginBottom: 6,
  display: "block",
};

const submitStyle = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: 10,
  border: "none",
  background: "var(--accent-color, #F3B130)",
  color: "#000",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
};

const secondaryButtonStyle = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #e0e0e0",
  background: "transparent",
  color: "#666666",
  cursor: "pointer",
  fontSize: 14,
};

const buttonRowStyle = {
  display: "flex",
  gap: 8,
};

const errorStyle = {
  color: "#ff6b6b",
  marginBottom: 12,
  fontSize: 13,
};
