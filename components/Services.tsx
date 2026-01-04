export default function Services({ services }: { services: any[] }) {
  if (!Array.isArray(services) || services.length === 0) return null;

  return (
    <div>
      <h3 style={titleStyle}>Services</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {services.map((item, i) => {
          // handle common Xano relation shapes
          const service =
            item?.services.service ||
            item?.services ||
            item?.services_id ||
            item;

          if (!service) return null;

          const name = service.name;
          const from = service.price_from;
          const to = service.price_to;

          return (
            <div key={i} style={rowStyle}>
              <span>{name || "Service"}</span>
              <span style={priceStyle}>
                {formatPrice(from, to)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatPrice(from?: number, to?: number | null) {
  if (!from) return "On request";
  if (!to) return `from €${from}`;
  return `€${from} – €${to}`;
}

/* styles */
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
