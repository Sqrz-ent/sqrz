"use client";

export default function PartnerJoinBanner({
  refCode,
}: {
  refCode: string;
}) {
  const joinUrl = `https://dashboard.sqrz.com/join?ref=${encodeURIComponent(refCode)}`;

  return (
    <a
      href={joinUrl}
      aria-label="Get your SQRZ profile"
      style={{
        display: "block",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: "12px 14px",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.04)",
          boxShadow: "0 14px 34px rgba(0,0,0,0.12)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              marginBottom: 4,
              fontWeight: 700,
            }}
          >
            Verified Profile
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            Join SQRZ
          </div>
        </div>

        <div
          style={{
            flexShrink: 0,
            padding: "9px 14px",
            borderRadius: 999,
            background: "#F3B130",
            color: "#111",
            fontSize: 13,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          Get your SQRZ Profile
        </div>
      </div>
    </a>
  );
}
