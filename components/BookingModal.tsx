"use client";

import { useState } from "react";
import type { Service } from "@/types/service";

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
const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setStep(3);
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
          service_id: selectedService?.id || null,
          service_task: selectedService?.task || null,
          instant_booking: selectedService?.instant_booking || false,
          event_date: date || null,
          event_time: time || null,
          address: {
            street: street || null,
            city: city || null,
            zip: zip || null,
            country: country || null,
            full: [street, zip, city, country]
              .filter(Boolean)
              .join(", ") || null,
          },
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to send booking request");
    }

    // reset + close
    onClose();
    setStep(1);
    setName("");
    setEmail("");
    setMessage("");
    setDate("");
    setTime("");
    setStreet("");
    setCity("");
    setZip("");
    setCountry("");
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

        <h2 style={{ marginBottom: 8 }}>Booking Request</h2>


        <form onSubmit={handleSubmit}>
  {/* steps */}



          {/* STEP 0 – Select Service */}
{step === 0 && (
  <>
    <h3 style={{ marginBottom: 12 }}>Select a service</h3>

    {services.length === 0 ? (
      <p style={{ opacity: 0.6, fontSize: 14 }}>
        Currently unavailable.
      </p>
    ) : (
      services.map((service) => (
        <button
          key={service.id}
          type="button"
          onClick={() => {
            setSelectedService(service);
            setStep(1);
          }}
          style={{
            ...inputStyle,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <strong>{service.service}</strong>

          <div style={{ opacity: 0.7, fontSize: 13 }}>
            {service.priceFrom
              ? `from €${service.priceFrom}`
              : "Price on request"}
            {service.instant_booking && " • Instant booking"}
          </div>
        </button>
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

const buttonRowStyle = {
  display: "flex",
  gap: 8,
};

const errorStyle = {
  color: "#ff6b6b",
  marginBottom: 12,
};
