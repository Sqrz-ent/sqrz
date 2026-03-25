"use client";

import { useEffect, useState } from "react";
import type { Service } from "@/types/service";
import { getServicePriceLabel } from "@/utils/serviceLabel";
import { supabase } from "@/lib/supabase";

export default function BookingModal({
  open,
  onClose,
  username,
  services,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  services: Service[];
}) {
const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

const [selectedService, setSelectedService] = useState<Service | null>(null);

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

  // ✅ MUST be here — before any return
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // ✅ Safe now
  if (!open) return null;


  function nextFromStep1() {
    if (!name || !email) {
      setError("Please enter name and email.");
      return;
    }
    setError(null);
    setStep(2);
  }

function nextFromStep2() {
  if (!message) {
    setError("Please add a short description.");
    return;
  }

  setError(null);
  setStep(3); // date/time
}

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    const { data, error: rpcError } = await supabase.rpc("create_booking_request", {
      p_to_slug: username,
      p_from_name: name,
      p_from_email: email,
      p_message: message,
      p_service: selectedService?.title ?? null,
      p_budget_min: null,
      p_budget_max: null,
      p_currency: "eur",
      p_event_date: date || null,
      p_event_location: null,
      p_source: "profile_page",
    });

    if (rpcError) throw rpcError;

    if (data?.success) {
      setSuccess(true);
    } else {
      throw new Error("Booking request failed");
    }
  } catch (err) {
    console.error(err);
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

  if (success) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <button onClick={onClose} style={closeStyle}>✕</button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12, textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <h2>Request sent!</h2>
            <p style={{ opacity: 0.7 }}>You'll hear back soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeStyle}>
          ✕
        </button>

        <h2 style={{ marginBottom: 8 }}>Booking Request</h2>

<div
  style={{
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingBottom: 40, // space for step indicator
  }}
>
  <form onSubmit={handleSubmit}>
    {/* STEP 0 – Select Service */}
    {step === 0 && (
      <>
        <h3 style={{ marginBottom: 12 }}>Select a service</h3>

        {services.length === 0 ? (
          <p style={{ opacity: 0.6, fontSize: 14 }}>
            Currently no services available.
          </p>
        ) : (
          services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onClick={() => {
                setSelectedService(service);
                setStep(1);
              }}
            />
          ))
        )}
      </>
    )}


          {/* STEP 1 */}
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

              <button
                type="button"
                style={submitStyle}
                onClick={nextFromStep1}
              >
                Continue
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
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
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => setStep(1)}
                >
                  Back
                </button>

                <button
                  type="button"
                  style={submitStyle}
                  onClick={nextFromStep2}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* STEP 3 */}
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
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => setStep(2)}
                >
                  Back
                </button>

                <button
                type="button"
                style={submitStyle}
                 onClick={() => setStep(4)}
                  >
                   Continue
                  </button>

              </div>
            </>
          )}
          {/* STEP 4 */}
          {step === 4 && (
          <>
          <input
      type="text"
      placeholder="Street & number"
      value={street}
      onChange={(e) => setStreet(e.target.value)}
      style={inputStyle}
    />

    <input
      type="text"
      placeholder="City"
      value={city}
      onChange={(e) => setCity(e.target.value)}
      style={inputStyle}
    />

    <input
      type="text"
      placeholder="ZIP / Postal code"
      value={zip}
      onChange={(e) => setZip(e.target.value)}
      style={inputStyle}
    />

    <input
      type="text"
      placeholder="Country"
      value={country}
      onChange={(e) => setCountry(e.target.value)}
      style={inputStyle}
    />

    <div style={buttonRowStyle}>
      <button
        type="button"
        style={secondaryButtonStyle}
        onClick={() => setStep(3)}
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

{/* Step indicator (bottom of modal) */}
<p
  style={{
    position: "absolute",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    opacity: 0.5,
    fontSize: 13,
    whiteSpace: "nowrap",
  }}
>
  Step {step + 1} of 4
</p>

      </div>
    </div>
  );
}

// ─── Service card with hover ───────────────────────────────────────────────────

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
        background: "var(--surface-color, #242424)",
        border: hovered
          ? `1px solid var(--accent-color, #F3B130)`
          : `1px solid var(--border-color, rgba(255,255,255,0.08))`,
        transition: "border-color 0.15s",
      }}
    >
      <strong>{service.title}</strong>
      <div style={{ opacity: 0.7, fontSize: 13 }}>
        {getServicePriceLabel(service)}
      </div>
    </button>
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
  background: "var(--surface-color, #1a1a1a)",
  borderTop: "3px solid var(--accent-color, #F3B130)",
  padding: 24,
  borderRadius: 16,
  width: "100%",
  maxWidth: 420,
  minHeight: 520,
  color: "#fff",
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
  color: "var(--text-muted, rgba(255,255,255,0.6))",
  fontSize: 18,
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
  background: "rgba(0,0,0,0.3)",
  color: "#fff",
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
};

const secondaryButtonStyle = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
  background: "transparent",
  color: "var(--text-muted, rgba(255,255,255,0.6))",
  cursor: "pointer",
};

const buttonRowStyle = {
  display: "flex",
  gap: 8,
};

const errorStyle = {
  color: "#ff6b6b",
  marginBottom: 12,
};
