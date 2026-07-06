"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/tracking/track";

type Props = {
  linkId: string;
  price: number | null;
  currency: string | null;
  externalUrl: string;
  label: string;
  profileId?: string | null;
  profileSlug?: string | null;
  linkSlug?: string | null;
};

const ACCENT = "#F5A623";

function currencySymbol(currency: string | null): string {
  const c = (currency || "EUR").toUpperCase();
  return c === "EUR" ? "€" : c === "GBP" ? "£" : "$";
}

export default function PaymentGateCta({ linkId, price, currency, externalUrl, label, profileId, profileSlug, linkSlug }: Props) {
  const [paid, setPaid] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reveal the link after returning from a successful Stripe payment.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "true") {
      setPaid(true);
      track("payment_gate_unlocked", {
        profile_slug: profileSlug ?? null,
        profile_id: profileId ?? null,
        link_id: linkId,
        link_slug: linkSlug ?? null,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sym = currencySymbol(currency);
  const hasFixedPrice = price != null && price > 0;

  async function handlePay() {
    if (submitting) return;
    const numericAmount = hasFixedPrice ? price! : (parseFloat(amount) || 0);
    track("payment_gate_clicked", {
      profile_slug: profileSlug ?? null,
      profile_id: profileId ?? null,
      link_id: linkId,
      link_slug: linkSlug ?? null,
      amount: numericAmount,
      currency: currency || "EUR",
    });
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/links/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link_id: linkId,
          amount: numericAmount,
          currency: currency || "EUR",
        }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setError(json.error || "Could not start checkout. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Could not start checkout. Please try again.");
      setSubmitting(false);
    }
  }

  const buttonStyle: React.CSSProperties = {
    padding: "16px 20px",
    background: ACCENT,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: submitting ? "not-allowed" : "pointer",
    opacity: submitting ? 0.7 : 1,
    whiteSpace: "nowrap",
  };

  // ── After payment — reveal the actual link ────────────────────────────────
  if (paid) {
    return (
      <a
        href={externalUrl}
        style={{
          display: "block",
          textAlign: "center",
          padding: "16px 20px",
          background: ACCENT,
          color: "#fff",
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {label || "Continue →"}
      </a>
    );
  }

  // ── Fixed price ───────────────────────────────────────────────────────────
  if (hasFixedPrice) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" onClick={handlePay} disabled={submitting} style={{ ...buttonStyle, width: "100%" }}>
          {submitting ? "…" : `Pay ${sym}${price}`}
        </button>
        {error && <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>}
      </div>
    );
  }

  // ── Pay what you want (null price) ────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            paddingLeft: 16,
            minWidth: 0,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>{sym}</span>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            style={{
              flex: 1,
              padding: "16px 16px 16px 6px",
              background: "transparent",
              border: "none",
              fontSize: 16,
              color: "#fff",
              outline: "none",
              minWidth: 0,
            }}
          />
        </div>
        <button type="button" onClick={handlePay} disabled={submitting} style={buttonStyle}>
          {submitting ? "…" : "Pay"}
        </button>
      </div>
      {error && <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>}
    </div>
  );
}
