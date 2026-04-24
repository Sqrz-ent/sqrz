"use client";

import { useEffect } from "react";

export default function RefCapture({ refCode }: { refCode?: string | null }) {
  useEffect(() => {
    if (!refCode) return;
    localStorage.setItem("sqrz_booking_ref", refCode);
    localStorage.setItem(
      "sqrz_booking_ref_expires",
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    );
  }, [refCode]);

  return null;
}
