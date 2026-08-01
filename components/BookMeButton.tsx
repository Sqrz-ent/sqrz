"use client";

import { useState } from "react";
import BookingModal from "./BookingModal";
import CalendlyPopupButton from "./CalendlyPopupButton";
import HubSpotMeetingModal from "./HubSpotMeetingModal";
import LinkOutButton from "./LinkOutButton";
import { getPrimaryCTA } from "@/lib/primaryCta";

export default function BookMeButton({
  username,
  profileId,
  profileName = null,
  schedulingProvider = null,
  schedulingUrl = null,
}: {
  username: string;
  profileId: string;
  profileName?: string | null;
  schedulingProvider?: string | null;
  schedulingUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const cta = getPrimaryCTA({
    scheduling_provider: schedulingProvider,
    scheduling_url: schedulingUrl,
  });

  if (cta.type === "scheduling" && cta.provider === "calendly") {
    return <CalendlyPopupButton url={cta.url} text={cta.label} style={floatingButtonStyle} />;
  }

  if (cta.type === "scheduling" && cta.provider === "hubspot") {
    return (
      <>
        <button onClick={() => setOpen(true)} style={floatingButtonStyle}>
          {cta.label}
        </button>
        <HubSpotMeetingModal url={cta.url} open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  if (cta.type === "scheduling" && cta.provider === "linkout") {
    return <LinkOutButton url={cta.url} text={cta.label} style={floatingButtonStyle} />;
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={floatingButtonStyle}>
        {cta.label}
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

/* styles */

const floatingButtonStyle = {
  position: "fixed" as const,
  top: 20,
  right: 20,
  padding: "12px 12px",
  borderRadius: 24,
  border: "none",
  background: "var(--accent-color)",
  color: "#000",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  zIndex: 900,
};
