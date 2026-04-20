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
  planId = null,
  initialService = null,
  simplified = false,
  prefilledTitle = null,
  prefilledDescription = null,
  profileName = null,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  services: Service[];
  profileId: string;
  planId?: number | null;
  initialService?: Service | null;
  simplified?: boolean;
  prefilledTitle?: string | null;
  prefilledDescription?: string | null;
  profileName?: string | null;
}) {
  // simplified: start at step 1 (skip service selection)
  // normal with initialService: start at step 1
  // normal without: start at step 0
  const initialStep: Step = simplified || initialService ? 1 : 0;

  const [step, setStep] = useState<Step>(initialStep);
  const [selectedService, setSelectedService] = useState<Service | null>(initialService ?? null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [multiDay, setMultiDay] = useState(false);
  const [dateEnd, setDateEnd] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isInstant = selectedService?.booking_type === "instant";

  useEffect(() => {
    if (!open) return;
    // Reset to correct starting state each time modal opens
    setStep(simplified || initialService ? 1 : 0);
    setSelectedService(initialService ?? null);
    setError(null);
    setSuccess(false);
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

  // ─── Step navigation ──────────────────────────────────────────────────────

  function nextFromStep1() {
    if (!name || !email) {
      setError("Please enter your name and email.");
      return;
    }
    setError(null);
    setStep(2);
  }

  // ─── Instant booking pay ──────────────────────────────────────────────────
  async function handleInstantPay() {
    if (!name || !email) {
      setError("Please enter your name and email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/instant-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_slug: username,
          from_name: name,
          from_email: email,
          message,
          service_title: selectedService?.title ?? null,
          instant_price: selectedService?.instant_price ?? 0,
          instant_currency: selectedService?.instant_currency ?? "EUR",
          profile_id: profileId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Payment setup failed");
      window.location.href = json.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  // ─── Final submit ─────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!simplified) {
      if (!projectTitle) { setError("Please enter a project name."); return; }
      if (!message) { setError("Please add a short description."); return; }
    }
    setError(null);
    setLoading(true);

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_booking_request", {
        p_to_slug: username,
        p_from_name: name,
        p_from_email: email,
        p_service: selectedService?.title ?? null,
        p_title: projectTitle || null,
        p_message: message || (simplified ? (prefilledDescription ?? prefilledTitle ?? "") : ""),
        p_event_date: date ? `${date}T${time || "00:00"}:00` : null,
        p_event_location: [city, country].filter(Boolean).join(", ") || null,
        p_venue_address: street || null,
        p_venue_city: city || null,
        p_venue_zip: zip || null,
        p_venue_country: country || null,
        p_phone: phone.trim() || null,
        p_date_end: (multiDay && dateEnd) ? `${dateEnd}T${timeEnd || "00:00"}:00` : null,
      });

      if (rpcError) throw rpcError;

      console.log("[BookingModal] rpcData raw:", JSON.stringify(rpcData));

      // Normalise: handle string JSON, array-wrapped, or plain object
      let result: Record<string, unknown> = {};
      if (typeof rpcData === "string") {
        try { result = JSON.parse(rpcData); } catch { result = {}; }
      } else if (Array.isArray(rpcData)) {
        result = (rpcData[0] as Record<string, unknown>) ?? {};
      } else if (rpcData && typeof rpcData === "object") {
        result = rpcData as Record<string, unknown>;
      }

      const booking_id = result.booking_id as string | undefined;
      const invite_token = (result.invite_token ?? result.token) as string | undefined;

      console.log("[BookingModal] extracted — booking_id:", booking_id, "invite_token:", invite_token);

      // Always attempt email — let the route surface errors if fields missing
      try {
        const confirmRes = await fetch("/api/booking-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id,
            invite_token,
            requester_name: name,
            requester_email: email,
            artist_name: username,
            service: selectedService?.title ?? null,
          }),
        });
        const confirmJson = await confirmRes.json().catch(() => ({}));
        if (!confirmRes.ok) {
          console.error("[BookingModal] booking-confirm error:", confirmRes.status, confirmJson);
        } else {
          console.log("[BookingModal] booking-confirm ok:", confirmJson);
        }
      } catch (emailErr) {
        console.error("[BookingModal] booking-confirm fetch threw:", emailErr);
      }

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
            <p style={{ opacity: 0.7, lineHeight: 1.6 }}>
              {profileName ? `${profileName} will get back to you shortly.` : "We'll get back to you shortly."}<br />
              Keep an eye on <strong>{email}</strong> for their response.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step indicator ───────────────────────────────────────────────────────
  // simplified: steps 1-4 → display 1-4 of 4
  // normal:     steps 0-4 → display 1-5 of 5
  const totalSteps = simplified ? 4 : 5;
  const stepNumber = simplified ? step : step + 1;

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

            {/* STEP 1 — Name + email (+ project details if instant) */}
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
                <input
                  type="tel"
                  placeholder="Phone number (optional — for a callback)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
                {isInstant && (
                  <textarea
                    placeholder="Project details (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={textareaStyle}
                    rows={4}
                  />
                )}
                {error && <p style={errorStyle}>{error}</p>}
                {isInstant ? (
                  <>
                    <button type="button" style={submitStyle} onClick={handleInstantPay} disabled={loading}>
                      {loading ? "Redirecting…" : `Book Now — ${formatInstantPrice(selectedService, planId)}`}
                    </button>
                    {selectedService?.instant_price && (
                      <InstantPriceBreakdown service={selectedService} planId={planId} />
                    )}
                  </>
                ) : (
                  <button type="button" style={submitStyle} onClick={nextFromStep1} disabled={loading}>
                    Request Quote
                  </button>
                )}
              </>
            )}

            {/* STEP 2 — Date + time (optional) */}
            {step === 2 && (
              <>
                <label style={labelStyle}>Event date (optional)</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="time"
                  placeholder="Start time (optional)"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={inputStyle}
                />
                <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", opacity: 1, marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={multiDay}
                    onChange={(e) => { setMultiDay(e.target.checked); if (!e.target.checked) { setDateEnd(""); setTimeEnd(""); } }}
                    style={{ width: "auto", marginBottom: 0 }}
                  />
                  Multi-day booking
                </label>
                {multiDay && (
                  <>
                    <label style={{ ...labelStyle, marginTop: 12 }}>End date</label>
                    <input
                      type="date"
                      value={dateEnd}
                      min={date || undefined}
                      onChange={(e) => setDateEnd(e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="time"
                      placeholder="End time (optional)"
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      style={inputStyle}
                    />
                  </>
                )}
                {error && <p style={errorStyle}>{error}</p>}
                <div style={{ ...buttonRowStyle, marginTop: 16 }}>
                  <button type="button" style={secondaryButtonStyle} onClick={() => setStep(1)}>Back</button>
                  <button type="button" style={submitStyle} onClick={() => { setError(null); setStep(3); }}>Continue</button>
                </div>
              </>
            )}

            {/* STEP 3 — Address (optional) */}
            {step === 3 && (
              <>
                <input type="text" placeholder="Street & number" value={street} onChange={(e) => setStreet(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="ZIP / Postal code" value={zip} onChange={(e) => setZip(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle} />
                {error && <p style={errorStyle}>{error}</p>}
                <div style={buttonRowStyle}>
                  <button type="button" style={secondaryButtonStyle} onClick={() => setStep(2)}>Back</button>
                  <button type="button" style={submitStyle} onClick={() => { setError(null); setStep(4); }}>Continue</button>
                </div>
              </>
            )}

            {/* STEP 4 — Project + description + submit */}
            {step === 4 && (
              <>
                <label style={labelStyle}>Project name{!simplified && " *"}</label>
                <input
                  type="text"
                  placeholder="e.g. Club Night Berlin, Wedding Reception, Album Mix..."
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  style={inputStyle}
                />
                <label style={labelStyle}>Tell us more</label>
                <textarea
                  placeholder="Event details, location, special requirements…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={textareaStyle}
                  rows={4}
                />
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

        {/* Step indicator — hidden for instant bookings */}
        {!isInstant && (
          <p style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", opacity: 0.5, fontSize: 13, whiteSpace: "nowrap" }}>
            Step {stepNumber} of {totalSteps}
          </p>
        )}
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
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <strong>{service.title}</strong>
        {service.booking_type === "instant" && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--accent-color, #F5A623)",
            border: "1px solid var(--accent-color, #F5A623)",
            borderRadius: 20,
            padding: "1px 7px",
            opacity: 0.85,
            whiteSpace: "nowrap",
          }}>
            Instant Booking
          </span>
        )}
      </div>
      <div style={{ opacity: 0.7, fontSize: 13 }}>{getServicePriceLabel(service)}</div>
    </button>
  );
}

// ─── Instant booking price breakdown ─────────────────────────────────────────

function InstantPriceBreakdown({
  service,
  planId,
}: {
  service: Service;
  planId: number | null;
}) {
  const net = service.instant_price ?? 0;
  const taxRate = service.instant_tax_rate ?? 0;
  const sqrzFeeRate = planId === 5 ? 0.03 : planId === 1 ? 0.05 : 0.00;
  const taxAmount = net * (taxRate / 100);
  const sqrzFee = net * sqrzFeeRate;
  const total = net + taxAmount + sqrzFee;
  const currency = (service.instant_currency || "EUR").toUpperCase();

  function fmt(amount: number) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  const rowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#888",
    lineHeight: 1.6,
  };

  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={rowStyle}>
        <span>Net</span>
        <span>{fmt(net)}</span>
      </div>
      {taxRate > 0 && (
        <div style={rowStyle}>
          <span>Tax ({taxRate}%)</span>
          <span>{fmt(taxAmount)}</span>
        </div>
      )}
      <div style={rowStyle}>
        <span>SQRZ fee ({(sqrzFeeRate * 100).toFixed(0)}%)</span>
        <span>{fmt(sqrzFee)}</span>
      </div>
      <div style={{ borderTop: "1px solid #e5e5e5", marginTop: 4, paddingTop: 4, ...rowStyle, fontWeight: 600, color: "#555" }}>
        <span>Total</span>
        <span>{fmt(total)}</span>
      </div>
      <p style={{ fontSize: 11, color: "#aaa", margin: "6px 0 0", lineHeight: 1.5 }}>
        Incl. tax where applicable. VAT-registered buyers may reclaim tax.
      </p>
    </div>
  );
}

// ─── Instant price formatter ──────────────────────────────────────────────────

function formatInstantPrice(service: Service | null, planId: number | null = null): string {
  if (!service?.instant_price) return "";
  const net = service.instant_price;
  const taxRate = service.instant_tax_rate ?? 0;
  const sqrzFeeRate = planId === 5 ? 0.03 : planId === 1 ? 0.05 : 0.00;
  const total = net + net * (taxRate / 100) + net * sqrzFeeRate;
  const currency = (service.instant_currency || "EUR").toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(total);
  } catch {
    return `${total.toFixed(2)} ${currency}`;
  }
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
