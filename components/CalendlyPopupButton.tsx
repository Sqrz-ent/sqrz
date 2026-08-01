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
}: {
  url: string;
  text: string;
  style: CSSProperties;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // PopupButton portals its modal into `rootElement` (document.body), which
  // only exists on the client. Defer the first render until after mount to
  // avoid SSR access to `document` and any hydration mismatch.
  if (!mounted) return null;

  return (
    <PopupButton
      url={url}
      rootElement={document.body}
      text={text}
      styles={style}
    />
  );
}
