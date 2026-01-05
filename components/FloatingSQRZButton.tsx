import Link from "next/link";

export default function FloatingSQRZButton() {
  return (
    <Link
      href="https://sqrz.com"
      aria-label="Go to SQRZ home"
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        width: 56,
        height: 56,
        borderRadius: "0%",
        background: "rgba(0,0,0,0.85)",
        border: "1px solid rgba(255, 255, 255, 0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        boxShadow: "0 0px 0px rgba(0,0,0,0.4)",
        backdropFilter: "blur(0px)",
      }}
    >
      <img
        src="/brand/sqrz_logo.png"
        alt="SQRZ"
        style={{
          width: 32,
          height: 32,
          objectFit: "contain",
          cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
      />
    </Link>
  );
}
