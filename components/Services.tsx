"use client";

import { useRef, useState, useEffect } from "react";
import type { Service } from "@/types/service";
import BookingModal from "./BookingModal";

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function safeCurrency(input?: string | null) {
  const c = (input || "EUR").toUpperCase().trim();
  return /^[A-Z]{3}$/.test(c) ? c : "EUR";
}

function getInstantTotal(s: Service, planId: number | null): string {
  if (s.instant_price == null) return "";
  const currency = safeCurrency(s.instant_currency);
  const sqrzFeeRate = planId === 5 ? 0.03 : planId === 1 ? 0.05 : 0.0;
  const taxRate = (s.instant_tax_rate ?? 0) / 100;
  const total = s.instant_price * (1 + taxRate + sqrzFeeRate);
  return formatMoney(total, currency);
}

function ServiceCard({
  s,
  planId,
  onBook,
}: {
  s: Service;
  planId: number | null;
  onBook: (service: Service) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    // Temporarily unclamped to measure full height vs clamped
    el.style.webkitLineClamp = "none";
    const fullHeight = el.scrollHeight;
    el.style.webkitLineClamp = "3";
    const clampedHeight = el.clientHeight;
    setOverflows(fullHeight > clampedHeight + 2);
    // Restore clamping if not expanded
    if (!expanded) {
      el.style.webkitLineClamp = "3";
    } else {
      el.style.webkitLineClamp = "none";
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.description]);

  const isInstant = s.booking_type === "instant";
  const total = isInstant ? getInstantTotal(s, planId) : null;

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
          <span style={serviceNameStyle}>{s.title}</span>
          {isInstant && (
            <span style={instantBadgeStyle}>Instant Booking</span>
          )}
        </div>

        {isInstant ? (
          <button
            onClick={() => onBook(s)}
            style={filledBtnStyle}
          >
            {total ? `Book Now · ${total}` : "Book Now"}
          </button>
        ) : (
          <button
            onClick={() => onBook(s)}
            style={outlineBtnStyle}
          >
            Request Price
          </button>
        )}
      </div>

      {s.description && (
        <div>
          <p
            ref={descRef}
            style={{
              ...descStyle,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
              WebkitLineClamp: expanded ? "none" : 3,
            }}
          >
            {s.description}
          </p>
          {overflows && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={toggleStyle}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Services({
  services,
  username,
  profileId,
  planId = null,
}: {
  services: Service[];
  username: string;
  profileId: string;
  planId?: number | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  if (!services || services.length === 0) return null;

  function handleBook(service: Service) {
    setSelectedService(service);
    setModalOpen(true);
  }

  return (
    <>
      <section style={{ marginTop: 40 }}>
        <h3 style={titleStyle}>Services & Pricing</h3>
        <div style={listStyle}>
          {services.map((s, i) => (
            <ServiceCard key={i} s={s} planId={planId} onBook={handleBook} />
          ))}
        </div>
      </section>

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        username={username}
        services={services}
        profileId={profileId}
        planId={planId}
        initialService={selectedService}
      />
    </>
  );
}

/* styles */

const titleStyle = {
  color: "text-accent",
  marginBottom: 12,
  fontSize: 18,
};

const listStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 16,
};

const cardStyle = {
  background: "#dedede19",
  border: "1px solid #dedede3e",
  borderRadius: 14,
  padding: 16,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 8,
};

const serviceNameStyle = {
  fontSize: 16,
  fontWeight: 600,
  color: "text-accent",
};

const instantBadgeStyle = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "var(--accent-color, #F5A623)",
  border: "1px solid var(--accent-color, #F5A623)",
  borderRadius: 20,
  padding: "1px 7px",
  opacity: 0.85,
  whiteSpace: "nowrap" as const,
  flexShrink: 0,
};

const filledBtnStyle = {
  flexShrink: 0,
  padding: "6px 14px",
  borderRadius: 20,
  border: "none",
  background: "var(--accent-color, #F5A623)",
  color: "#000",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const outlineBtnStyle = {
  flexShrink: 0,
  padding: "6px 14px",
  borderRadius: 20,
  border: "1px solid var(--accent-color, #F5A623)",
  background: "transparent",
  color: "var(--accent-color, #F5A623)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const descStyle = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "text-accent",
  margin: 0,
};

const toggleStyle = {
  marginTop: 4,
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontSize: 12,
  color: "var(--text-muted, #888)",
  textDecoration: "underline",
};
