"use client";

import { useState } from "react";
import BookingModal from "./BookingModal";

export default function BookMeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={buttonStyle}>
        Book Me
      </button>

      <BookingModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const buttonStyle = {
  position: "fixed" as const,
  top: 20,
  right: 20,
  zIndex: 1000,
  padding: "12px 18px",
  borderRadius: 999,
  border: "none",
  background: "#f3b130",
  color: "#000",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
};
