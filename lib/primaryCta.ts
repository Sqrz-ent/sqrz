// Resolves the single primary floating CTA on a public profile from whatever
// booking/scheduling integrations the artist has configured. SQRZ hands off
// pre-booking traffic and gets out of the way — once a visitor has a direct
// way to book, that's the one path, not a second competing lead-gen popup.

export type PrimaryCtaAction =
  | { type: "scheduling"; provider: "calendly"; url: string; label: string }
  | { type: "scheduling"; provider: "hubspot"; url: string; label: string }
  | { type: "scheduling"; provider: "linkout"; url: string; label: string }
  | { type: "leadForm"; label: string };

export type ProfileForPrimaryCta = {
  scheduling_provider?: string | null;
  scheduling_url?: string | null;
};

// Ordered list of action-provider resolvers, first match wins. Adding a new
// provider (Cal.com, a merch link, a waitlist, "in person only", …) later is
// one more entry here — no changes to callers or to getPrimaryCTA itself.
const resolvers: Array<(profile: ProfileForPrimaryCta) => PrimaryCtaAction | null> = [
  (profile) => {
    if (profile.scheduling_provider === "calendly" && profile.scheduling_url) {
      return {
        type: "scheduling",
        provider: "calendly",
        url: profile.scheduling_url,
        label: "Check availability",
      };
    }
    return null;
  },
  (profile) => {
    if (profile.scheduling_provider === "hubspot" && profile.scheduling_url) {
      return {
        type: "scheduling",
        provider: "hubspot",
        url: profile.scheduling_url,
        // Same user-facing intent as Calendly — no per-provider label variance
        // unless there's a reason for one.
        label: "Check availability",
      };
    }
    return null;
  },
  // Catch-all for any other configured provider (OpenTable, Resy, Tock,
  // SevenRooms, Eventbrite, Dice, Ticket Tailor, …) — just open the link in a
  // new tab. Covers every current and future generic provider with one
  // branch; only Calendly/HubSpot need their own true integration.
  (profile) => {
    if (
      profile.scheduling_provider &&
      profile.scheduling_provider !== "calendly" &&
      profile.scheduling_provider !== "hubspot" &&
      profile.scheduling_url
    ) {
      return {
        type: "scheduling",
        provider: "linkout",
        url: profile.scheduling_url,
        label: "Check availability",
      };
    }
    return null;
  },
];

export function getPrimaryCTA(profile: ProfileForPrimaryCta): PrimaryCtaAction {
  for (const resolve of resolvers) {
    const action = resolve(profile);
    if (action) return action;
  }
  // Fallback: no scheduling integration configured — today's lead-gen form.
  return { type: "leadForm", label: "Book me" };
}
