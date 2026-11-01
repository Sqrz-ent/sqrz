"use client";

import { useEffect, useState } from "react";
import { PopupButton } from "react-calendly";
import type { CSSProperties } from "react";

// Shared Calendly integration, extracted so every CTA that opens the Calendly
// popup (the in-flow SchedulingWidget, the primary floating CTA) renders the
// same PopupButton/rootElement/mount-guard logic instead of duplicating it.
//
// NB: uses PopupButton, not PopupWidget — PopupWidget is a fixed, bottom-right
// floating badge that ignores caller-provided placement/styling, which can't
// satisfy either consumer's layout requirements.
export default function CalendlyPopupButton({
  url,
  text,
  style,
  onOpen,
}: {
  url: string;
  text: string;
  style: CSSProperties;
  // Optional, fired when the popup button is tapped (analytics). react-calendly's
  // PopupButton has no click callback, so it's caught on a wrapper below.
  onOpen?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // PopupButton portals its modal into `rootElement` (document.body), which
  // only exists on the client. Defer the first render until after mount to
  // avoid SSR access to `document` and any hydration mismatch.
  if (!mounted) return null;

  // display: contents keeps the wrapper out of layout, so the button still
  // positions exactly as before (it's fixed/floating via `style`).
  return (
    <span style={{ display: "contents" }} onClickCapture={onOpen}>
      <PopupButton
        url={url}
        rootElement={document.body}
        text={text}
        styles={style}
      />
    </span>
  );
}
