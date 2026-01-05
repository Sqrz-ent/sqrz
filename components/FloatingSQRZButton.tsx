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
        borderRadius: "50%",
        background: "rgba(0,0,0,0.85)",
        border: "1px solid rgba(255,255,255,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        backdropFilter: "blur(6px)",
      }}
    >
      <img
        src="/brand/sqrz-logo.png"
        alt="SQRZ"
        style={{
          width: 28,
          height: 28,
          objectFit: "contain",
        }}
      />
    </Link>
  );
}
