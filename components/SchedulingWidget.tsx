"use client";

import { useState } from "react";
import CalendlyPopupButton from "./CalendlyPopupButton";
import HubSpotMeetingModal from "./HubSpotMeetingModal";
import LinkOutButton from "./LinkOutButton";

type Props = {
  // From profiles.scheduling_provider / scheduling_url. Generic on purpose:
  // provider-specific rendering is keyed off `provider` here, so cal_com /
  // savvycal slot in later with no rename and no consumer-side changes.
  provider: string | null;
  url: string | null;
};

// In-flow scheduling CTA — full-width accent block, matching the in-flow CTA
// convention on the profile page (DownloadCtaButton et al). Same three
// provider branches as BookMeButton's primary floating CTA (Calendly popup /
// HubSpot iframe modal / generic link-out catch-all), reusing the exact same
// components (CalendlyPopupButton, HubSpotMeetingModal, LinkOutButton) so the
// scheduling integration itself is never duplicated — only the container
// (floating pill vs. in-flow block) differs between the two call sites.
export default function SchedulingWidget({ provider, url }: Props) {
  const [open, setOpen] = useState(false);

  // Unset/no URL → render nothing (no throw, no empty state) — exactly like
  // the social/music embeds when their field is unset.
  if (!provider || !url) return null;

  if (provider === "calendly") {
    return <CalendlyPopupButton url={url} text="Check availability" style={blockButtonStyle} />;
  }

  if (provider === "hubspot") {
    return (
      <>
        <button onClick={() => setOpen(true)} style={blockButtonStyle}>
          Check availability
        </button>
        <HubSpotMeetingModal url={url} open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  // Any other configured provider (OpenTable, Resy, Tock, SevenRooms,
  // Eventbrite, Dice, Ticket Tailor, …) — same catch-all as the primary CTA.
  return <LinkOutButton url={url} text="Check availability" style={blockButtonStyle} />;
}

const blockButtonStyle = {
  display: "block",
  width: "100%",
  padding: "16px",
  background: "var(--accent-color, #F3B130)",
  color: "#000",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 700,
  textAlign: "center",
  cursor: "pointer",
  boxSizing: "border-box",
} as const;
