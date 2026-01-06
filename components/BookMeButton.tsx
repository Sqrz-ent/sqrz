"use client";

import { useState } from "react";
import BookingModal from "./BookingModal";

export default function BookMeButton({ username }: { username: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
  onClick={() => setOpen(true)}
  style={floatingButtonStyle}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.boxShadow =
      "0 14px 40px var(--accent-color)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "none";
    e.currentTarget.style.boxShadow =
      "0 10px 30px var(--accent-color)";
  }}
>
  Book me
</button>

      <BookingModal
        open={open}
        onClose={() => setOpen(false)}
        username={username}
      />
    </>
  );
}

/* styles */

const floatingButtonStyle = {
  position: "fixed" as const,
  top: 20,
  right: 20,
  padding: "12px 18px",
  borderRadius: 999,
  border: "none",
  background: "var(--accent-color)",
  color: "#000",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 10px 30px var(--accent-color))",
  zIndex: 900,
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};
