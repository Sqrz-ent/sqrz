import type { Service } from "@/types/service";
import { getServicePriceLabel } from "@/utils/serviceLabel";

export default function Services({ services }: { services: Service[] }) {
  if (!services || services.length === 0) return null;

  return (
    <section style={{ marginTop: 40 }}>
      <h3 style={titleStyle}>Services & Pricing</h3>

      <div style={listStyle}>
        {services.map((s, i) => (
          <div key={i} style={cardStyle}>
            <div style={headerStyle}>
              <span style={serviceName}>{s.service}</span>

              {/* ✅ THIS must be here */}
              <span style={priceStyle}>{getServicePriceLabel(s)}</span>
            </div>

            {s.terms && <p style={termsStyle}>{s.terms}</p>}
          </div>
        ))}
      </div>
    </section>
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
  marginBottom: 8,
};

const serviceName = {
  fontSize: 16,
  fontWeight: 600,
  color: "text-accent",
};

const priceStyle = {
  fontSize: 14,
  fontWeight: 500,
  color: "text-accent",
  whiteSpace: "nowrap" as const,
};

const termsStyle = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "text-accent",
};
