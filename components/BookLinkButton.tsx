"use client";

import { useState } from "react";
import BookingModal from "./BookingModal";

export default function BookLinkButton({
  username,
  profileId,
  accent,
  profileName = null,
  label,
}: {
  username: string;
  profileId: string;
  accent: string;
  profileName?: string | null;
  label?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "block",
          width: "100%",
          padding: "16px",
          background: accent,
          color: "#fff",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          textAlign: "center",
          border: "none",
          cursor: "pointer",
          fontFamily: "'DM Sans', ui-sans-serif, sans-serif",
          boxSizing: "border-box",
        }}
      >
        {label || "Book"}
      </button>
      <BookingModal
        open={open}
        onClose={() => setOpen(false)}
        username={username}
        profileId={profileId}
        profileName={profileName}
      />
    </>
  );
}
