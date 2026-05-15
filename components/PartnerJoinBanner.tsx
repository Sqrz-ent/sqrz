"use client";

export default function PartnerJoinBanner({
  refCode,
}: {
  refCode: string;
}) {
  const joinUrl = `https://sqrz.com?ref=${encodeURIComponent(refCode)}`;

  return (
    <a
      href={joinUrl}
      aria-label="Join SQRZ with partner referral"
      style={{
        position: "fixed",
        left: 16,
        right: 92,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
        zIndex: 1000,
        maxWidth: 420,
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
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(10,10,10,0.84)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
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
            Partner Profile
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
          Activate code
        </div>
      </div>
    </a>
  );
}
