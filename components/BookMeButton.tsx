"use client";
import type { Service } from "@/types/service";

export default function BookingModal({
  open,
  onClose,
  username,
  services,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  services: Service[];
}) {



import { useState } from "react";
import BookingModal from "./BookingModal";

export default function BookMeButton({ username }: { username: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
  onClick={() => setOpen(true)}
  style={floatingButtonStyle}
>
  Book me
</button>

      <BookingModal
        open={open}
        onClose={() => setOpen(false)}
        username={username}
        services={services} 
      />
    </>
  );
}

/* styles */

const floatingButtonStyle = {
  position: "fixed" as const,
  top: 20,
  right: 20,
  padding: "12px 12px",
  borderRadius: 999,
  border: "none",
  background: "var(--accent-color)",
  color: "#000",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 10px 10px var(--accent-color))",
  zIndex: 900,
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};
