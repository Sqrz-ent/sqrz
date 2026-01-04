type Service = {
  name: string;
  price_from?: number;
  price_to?: number | null;
};

export default function Services({ services }: { services: Service[] }) {
  if (!services || services.length === 0) return null;

  return (
    <div>
      <h3 style={titleStyle}>Services</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {services.map((service, i) => (
          <div key={i} style={rowStyle}>
            <span>{service.name}</span>
            <span style={priceStyle}>
              {formatPrice(service)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatPrice(service: Service) {
  if (!service.price_from) return "On request";
  if (!service.price_to) return `from €${service.price_from}`;
  return `€${service.price_from} – €${service.price_to}`;
}

const titleStyle = {
  color: "#f3b130",
  marginBottom: 8,
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  background: "#111",
  padding: 12,
  borderRadius: 10,
  color: "#fff",
  fontSize: 14,
};

const priceStyle = {
  color: "#f3b130",
  whiteSpace: "nowrap" as const,
};
