"use client";

import { useRef, useState, useEffect } from "react";
import type { Service } from "@/types/service";
import BookingModal from "./BookingModal";
import { track } from "@/lib/tracking/track";

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

function unitLabel(unit?: string): string {
  if (unit === "hour") return " / hr";
  if (unit === "day") return " / day";
  if (unit === "unit") return " / unit";
  return ""; // flat = no label
}

function getPriceRangePill(s: Service): string | null {
  if (s.booking_type === "instant") return null;
  if (s.price_label === "Price on request") return null;
  if (s.price_min == null && s.price_max == null) return null;
  const currency = safeCurrency(s.currency);
  const suffix = unitLabel(s.price_unit);
  if (s.price_min != null && s.price_max != null) {
    return `${formatMoney(s.price_min, currency)} – ${formatMoney(s.price_max, currency)}${suffix}`;
  }
  if (s.price_min != null) return `${formatMoney(s.price_min, currency)}${suffix}`;
  if (s.price_max != null) return `${formatMoney(s.price_max, currency)}${suffix}`;
  return null;
}

function getInstantPricePill(s: Service, planId: number | null): string | null {
  if (s.instant_price == null) return null;
  const currency = safeCurrency(s.instant_currency);
  const sqrzFeeRate = planId === 5 ? 0.03 : planId === 1 ? 0.05 : 0.0;
  const taxRate = (s.instant_tax_rate ?? 0) / 100;
  const total = s.instant_price * (1 + taxRate + sqrzFeeRate);
  return `${formatMoney(total, currency)} · Instant Booking`;
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
  const pricePill = isInstant ? getInstantPricePill(s, planId) : getPriceRangePill(s);

  return (
    <div style={cardStyle}>
      <div className="sqrz-svc-header" style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1, flexWrap: "wrap" }}>
          <span style={serviceNameStyle}>{s.title}</span>
        </div>

        {isInstant ? (
          <button
            onClick={() => onBook(s)}
            style={filledBtnStyle}
          >
            Book Now
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

      {pricePill && (
        <div style={{ marginBottom: 8 }}>
          <span style={pricePillStyle}>{pricePill}</span>
        </div>
      )}

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
  profileName = null,
}: {
  services: Service[];
  username: string;
  profileId: string;
  planId?: number | null;
  profileName?: string | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  if (!services || services.length === 0) return null;

  function handleBook(service: Service) {
    track("service_click", {
      service_id: service.id,
      service_name: service.title,
      profile_slug: username,
      profile_id: profileId,
    });
    setSelectedService(service);
    setModalOpen(true);
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .sqrz-svc-header { flex-direction: column !important; align-items: flex-start !important; }
          .sqrz-svc-header > button { align-self: flex-end; }
        }
      `}</style>
      <section style={sectionStyle}>
        <div style={eyebrowStyle}>Book now</div>
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
        profileName={profileName}
      />
    </>
  );
}

/* styles */

const sectionStyle = {
  padding: 0,
  borderRadius: 0,
  border: "none",
  background: "transparent",
  boxShadow: "none",
};

const eyebrowStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "rgba(255,255,255,0.42)",
  marginBottom: 8,
};

const titleStyle = {
  color: "var(--accent-color, #F3B130)",
  margin: "0 0 10px",
  fontSize: 24,
  lineHeight: 1.15,
  fontWeight: 700,
};

const introStyle = {
  margin: "0 0 18px",
  color: "rgba(255,255,255,0.68)",
  fontSize: 14,
  lineHeight: 1.6,
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

const pricePillStyle = {
  display: "inline-block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--accent-color, #F5A623)",
  border: "1px solid var(--accent-color, #F5A623)",
  borderRadius: 20,
  padding: "1px 9px",
  opacity: 0.9,
};
