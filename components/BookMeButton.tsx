"use client";

import { useState } from "react";
import BookingModal from "./BookingModal";

export default function BookMeButton({ username }: { username: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>
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
