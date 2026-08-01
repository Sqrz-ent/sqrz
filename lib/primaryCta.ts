// Resolves the single primary floating CTA on a public profile from whatever
// booking/scheduling integrations the artist has configured. SQRZ hands off
// pre-booking traffic and gets out of the way — once a visitor has a direct
// way to book, that's the one path, not a second competing lead-gen popup.

export type FeaturedLink = {
  id: string;
  linkSlug: string | null;
  title: string;
  externalUrl: string | null;
  paymentGate: boolean;
  ctaLabel: string | null;
};

export type PrimaryCtaAction =
  | { type: "featuredLink"; mode: "external"; url: string; label: string; linkId: string; linkSlug: string | null }
  | { type: "featuredLink"; mode: "page"; url: string; label: string; linkId: string; linkSlug: string | null }
  | { type: "scheduling"; provider: "calendly"; url: string; label: string }
  | { type: "scheduling"; provider: "hubspot"; url: string; label: string }
  | { type: "scheduling"; provider: "linkout"; url: string; label: string }
  | { type: "leadForm"; label: string };

export type ProfileForPrimaryCta = {
  slug?: string | null;
  scheduling_provider?: string | null;
  scheduling_url?: string | null;
  featuredLink?: FeaturedLink | null;
};

// Ordered list of action-provider resolvers, first match wins. Adding a new
// provider (Cal.com, a merch link, a waitlist, "in person only", …) later is
// one more entry here — no changes to callers or to getPrimaryCTA itself.
const resolvers: Array<(profile: ProfileForPrimaryCta) => PrimaryCtaAction | null> = [
  // Top priority: a Private Link toggled "featured" (profiles.private_booking_
  // links.show_on_profile — exclusive one-at-a-time via a DB trigger, same
  // field the retired hero pill read). Wins over any scheduling provider,
  // since the artist explicitly chose this as their one thing to push.
  (profile) => {
    const link = profile.featuredLink;
    if (!link) return null;
    const label = link.ctaLabel || link.title;
    // Skip straight to the destination only when external + no payment gate;
    // a payment-gated link (regardless of connect-to) always routes through
    // its own /{slug} page — mirrors the retired hero pill's skipToUrl logic.
    const skipToUrl = !link.paymentGate && !!link.externalUrl;
    if (skipToUrl) {
      const url = /^https?:\/\//i.test(link.externalUrl!) ? link.externalUrl! : `https://${link.externalUrl}`;
      return { type: "featuredLink", mode: "external", url, label, linkId: link.id, linkSlug: link.linkSlug };
    }
    const pageUrl = `https://${profile.slug}.sqrz.com/${link.linkSlug}`;
    return { type: "featuredLink", mode: "page", url: pageUrl, label, linkId: link.id, linkSlug: link.linkSlug };
  },
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
  // Fallback: no featured link, no scheduling integration — the lead-gen
  // form. On by default now, independent of hasActiveServices; only the two
  // higher-priority tiers above supersede it.
  return { type: "leadForm", label: "Book me" };
}
