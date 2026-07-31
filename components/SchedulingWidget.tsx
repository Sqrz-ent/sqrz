"use client";

import { useEffect, useState } from "react";
import { PopupButton } from "react-calendly";

type Props = {
  // From profiles.scheduling_provider / scheduling_url. Generic on purpose:
  // provider-specific rendering is keyed off `provider` here, so cal_com /
  // savvycal slot in later with no rename and no consumer-side changes.
  provider: string | null;
  url: string | null;
};

// Scheduling link-out widget for public profiles. Mirrors the music/video embeds:
// no custom calendar logic, renders only when the artist has set a link, no
// tier/plan gate. Renders a POPUP BUTTON (opens Calendly in a modal) rather than
// an inline embed, to keep the page stack compact.
//
// NB: the spec named `PopupWidget`, but that react-calendly export is a fixed,
// bottom-right floating badge — it ignores where it's placed in the layout and
// carries no inter-block spacing, so it can't sit "after the music/video stack"
// as required. `PopupButton` is the in-flow button that opens the same modal,
// which is what every behavioural requirement here describes. Using that.
export default function SchedulingWidget({ provider, url }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Only Calendly is implemented today. Unset or any future/unsupported provider,
  // or a missing URL → render nothing (no throw, no empty state) — exactly like
  // the social/music embeds when their field is unset.
  if (provider !== "calendly" || !url) return null;

  // PopupButton portals its modal into `rootElement` (document.body), which only
  // exists on the client. Defer the first render until after mount to avoid SSR
  // access to `document` and any hydration mismatch.
  if (!mounted) return null;

  return (
    <PopupButton
      url={url}
      rootElement={document.body}
      text="Check availability"
      // Match the in-flow CTA convention on the profile page (see
      // DownloadCtaButton / BookMeButton): full-width accent block, dark text.
      styles={{
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
      }}
    />
  );
}
