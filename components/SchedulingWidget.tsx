"use client";

import { useState } from "react";
import CalendlyPopupButton from "./CalendlyPopupButton";
import HubSpotMeetingModal from "./HubSpotMeetingModal";
import LinkOutButton from "./LinkOutButton";
import { floatingButtonStyle } from "@/lib/floatingCta";

type Props = {
  // From profiles.scheduling_provider / scheduling_url. Generic on purpose:
  // provider-specific rendering is keyed off `provider` here, so cal_com /
  // savvycal slot in later with no rename and no consumer-side changes.
  provider: string | null;
  url: string | null;
};

// Floating scheduling CTA for a private link page (private_booking_links.
// show_scheduling_cta) — same fixed top-right placement/style as the profile
// page's primary CTA (BookMeButton), via the same shared floatingButtonStyle.
// Same three provider branches as BookMeButton too (Calendly popup / HubSpot
// iframe modal / generic link-out catch-all), reusing the exact same
// components (CalendlyPopupButton, HubSpotMeetingModal, LinkOutButton) so the
// scheduling integration itself is never duplicated between the two call
// sites — only BookMeButton's extra featuredLink/lead-form fallback tiers
// (link pages have none of that; a link page either shows this or nothing).
export default function SchedulingWidget({ provider, url }: Props) {
  const [open, setOpen] = useState(false);

  // Unset/no URL → render nothing (no throw, no empty state) — exactly like
  // the social/music embeds when their field is unset.
  if (!provider || !url) return null;

  if (provider === "calendly") {
    return <CalendlyPopupButton url={url} text="Check availability" style={floatingButtonStyle} />;
  }

  if (provider === "hubspot") {
    return (
      <>
        <button onClick={() => setOpen(true)} style={floatingButtonStyle}>
          Check availability
        </button>
        <HubSpotMeetingModal url={url} open={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  // Any other configured provider (OpenTable, Resy, Tock, SevenRooms,
  // Eventbrite, Dice, Ticket Tailor, …) — same catch-all as the primary CTA.
  return <LinkOutButton url={url} text="Check availability" style={floatingButtonStyle} />;
}
