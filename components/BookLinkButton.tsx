"use client";

import { useState } from "react";
import type { Service } from "@/types/service";
import BookingModal from "./BookingModal";

export default function BookLinkButton({
  username,
  services,
  profileId,
  planId = null,
  accent,
  prefillService,
  prefilledTitle,
  prefilledDescription,
  profileName = null,
}: {
  username: string;
  services: Service[];
  profileId: string;
  planId?: number | null;
  accent: string;
  prefillService?: string | null;
  prefilledTitle?: string | null;
  prefilledDescription?: string | null;
  profileName?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const initialService = prefillService
    ? (services.find((s) => s.title === prefillService) ?? null)
    : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "block",
          width: "100%",
          padding: "16px 32px",
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
        Book
      </button>
      <BookingModal
        open={open}
        onClose={() => setOpen(false)}
        username={username}
        services={services}
        profileId={profileId}
        planId={planId}
        initialService={initialService}
        simplified={true}
        prefilledTitle={prefilledTitle}
        prefilledDescription={prefilledDescription}
        profileName={profileName}
      />
    </>
  );
}
