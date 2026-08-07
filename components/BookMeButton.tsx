"use client";

import { useState } from "react";
import BookingModal from "./BookingModal";
import CalendlyPopupButton from "./CalendlyPopupButton";
import HubSpotMeetingModal from "./HubSpotMeetingModal";
import LinkOutButton from "./LinkOutButton";
import { getPrimaryCTA, type FeaturedLink } from "@/lib/primaryCta";
import { track, trackCtaClick } from "@/lib/tracking/track";
import { floatingButtonStyle } from "@/lib/floatingCta";

export default function BookMeButton({
  username,
  profileId,
  profileName = null,
  schedulingProvider = null,
  schedulingUrl = null,
  featuredLink = null,
}: {
  username: string;
  profileId: string;
  profileName?: string | null;
  schedulingProvider?: string | null;
  schedulingUrl?: string | null;
  featuredLink?: FeaturedLink | null;
}) {
  const [open, setOpen] = useState(false);

  const cta = getPrimaryCTA({
    slug: username,
    scheduling_provider: schedulingProvider,
    scheduling_url: schedulingUrl,
    featuredLink,
  });

  if (cta.type === "featuredLink" && cta.mode === "external") {
    return <LinkOutButton url={cta.url} text={cta.label} style={floatingButtonStyle} />;
  }

  if (cta.type === "featuredLink" && cta.mode === "page") {
    // Standard navigation (same tab, plain link) — not a popup/modal like the
    // scheduling providers above. Carries the same click tracking the retired
    // hero pill had, so promoting this to the primary CTA doesn't silently
    // drop featured-link analytics.
    return (
      <a
        href={cta.url}
        style={featuredLinkAnchorStyle}
        onClick={() => {
          track("external_link_clicked", {
            profile_id: profileId,
            link_id: cta.linkId,
            link_slug: cta.linkSlug,
            destination: "page",
          });
          trackCtaClick({ link_url: cta.url, link_label: cta.label, profile_id: profileId });
        }}
      >
        {cta.label}
      </a>
    );
  }

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

// Same look as floatingButtonStyle, plus the declarations an <a> needs that a
// <button> gets for free (no default text-decoration, no default centering).
const featuredLinkAnchorStyle = {
  ...floatingButtonStyle,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};
