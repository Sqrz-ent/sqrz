import type { CSSProperties } from "react";

// Shared by the profile page's primary CTA (BookMeButton) and a private link
// page's floating scheduling CTA (SchedulingWidget, show_scheduling_cta) —
// same placement/behavior everywhere a floating CTA renders, one definition.
export const floatingButtonStyle: CSSProperties = {
  position: "fixed",
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
