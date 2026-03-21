"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Service {
  id: string;
  title: string;
  price_min?: number | null;
  price_max?: number | null;
  price_label?: string | null;
  currency?: string | null;
}

interface BookingLinkFormProps {
  username: string;
  accent: string;
  prefillService?: string | null;
  prefillEventDate?: string | null;
  prefillBudgetMin?: number | null;
  prefillBudgetMax?: number | null;
  prefillMessage?: string | null;
  prefillLocation?: string | null;
  services: Service[];
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.12)",
  fontSize: 15,
  fontFamily: "inherit",
  background: "#fff",
  color: "#111",
  boxSizing: "border-box",
  marginBottom: 10,
  outline: "none",
};

export default function BookingLinkForm({
  username,
  accent,
  prefillService,
  prefillEventDate,
  prefillBudgetMin,
  prefillBudgetMax,
  prefillMessage,
  prefillLocation,
  services,
}: BookingLinkFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState(prefillService ?? "");
  const [eventDate, setEventDate] = useState(prefillEventDate ?? "");
  const [budgetMin, setBudgetMin] = useState(prefillBudgetMin ? String(prefillBudgetMin) : "");
  const [budgetMax, setBudgetMax] = useState(prefillBudgetMax ? String(prefillBudgetMax) : "");
  const [message, setMessage] = useState(prefillMessage ?? "");
  const [location, setLocation] = useState(prefillLocation ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    if (!message.trim()) {
      setError("Please add a message.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc("create_booking_request", {
        p_to_slug: username,
        p_from_name: name,
        p_from_email: email,
        p_message: message,
        p_service: service || null,
        p_budget_min: budgetMin ? parseFloat(budgetMin) : null,
        p_budget_max: budgetMax ? parseFloat(budgetMax) : null,
        p_currency: "usd",
        p_event_date: eventDate || null,
        p_event_location: location || null,
        p_source: "private_link",
      });

      if (rpcError) throw rpcError;

      if (data?.success) {
        setSuccess(true);
      } else {
        throw new Error("Request failed");
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
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 48 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>
          Request sent!
        </h2>
        <p style={{ color: "#555", fontSize: 15, margin: 0 }}>
          You&apos;ll hear back soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Contact */}
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>
        Your Name
      </label>
      <input
        type="text"
        placeholder="Jane Smith"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
        required
      />

      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>
        Your Email
      </label>
      <input
        type="email"
        placeholder="jane@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
        required
      />

      {/* Service */}
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>
        Service
      </label>
      {services.length > 0 ? (
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={{ ...inputStyle }}
        >
          <option value="">Select a service…</option>
          {services.map((s) => (
            <option key={s.id} value={s.title}>
              {s.title}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          placeholder="e.g. DJ Set, Live Performance"
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={inputStyle}
        />
      )}

      {/* Event date */}
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>
        Event Date
      </label>
      <input
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        style={inputStyle}
      />

      {/* Location */}
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>
        Location
      </label>
      <input
        type="text"
        placeholder="City, Venue or Address"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        style={inputStyle}
      />

      {/* Budget */}
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>
        Budget (USD)
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <input
          type="number"
          placeholder="Min"
          value={budgetMin}
          onChange={(e) => setBudgetMin(e.target.value)}
          style={{ ...inputStyle, marginBottom: 0 }}
          min={0}
        />
        <input
          type="number"
          placeholder="Max"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
          style={{ ...inputStyle, marginBottom: 0 }}
          min={0}
        />
      </div>

      {/* Message */}
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888", marginBottom: 4 }}>
        Message
      </label>
      <textarea
        placeholder="Tell us about your event or project…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        required
      />

      {error && (
        <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 10, marginTop: -4 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          background: accent,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          fontFamily: "inherit",
          marginTop: 4,
        }}
      >
        {loading ? "Sending…" : "Send Request →"}
      </button>
    </form>
  );
}
