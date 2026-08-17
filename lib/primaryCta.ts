// Resolves the single primary floating CTA on a public profile from the
// artist's explicit Action Button selection (profiles.action_button_source).
// SQRZ hands off pre-booking traffic and gets out of the way — once a
// visitor has a direct way to book, that's the one path, not a second
// competing lead-gen popup.
//
// Rewritten 2026-08-17: replaces the old priority-fallback chain (a starred
// private link always won if present, then scheduling activated automatically
// the moment provider+url were both set, with no way to have scheduling
// configured but NOT active). That chain is gone — action_button_source is
// now a direct, explicit single-select written by the artist (iOS: LinksView's
// per-link star + BusinessView's Scheduling/Shopping/External star, all four
// writing the same two profiles columns, action_button_source/_link_id, with
// DB-trigger-free exclusivity — there's only ever one value in one place).
// Filling in a section's fields no longer activates it on its own.

export type FeaturedLink = {
  id: string;
  linkSlug: string | null;
  title: string;
  externalUrl: string | null;
  ctaLabel: string | null;
};

export type PrimaryCtaAction =
  | { type: "featuredLink"; mode: "external"; url: string; label: string; linkId: string; linkSlug: string | null }
  | { type: "featuredLink"; mode: "page"; url: string; label: string; linkId: string; linkSlug: string | null }
  | { type: "scheduling"; provider: "calendly"; url: string; label: string }
  | { type: "scheduling"; provider: "hubspot"; url: string; label: string }
  | { type: "scheduling"; provider: "linkout"; url: string; label: string }
  | { type: "shop"; url: string; label: string }
  | { type: "external"; url: string; label: string }
  | { type: "leadForm"; label: string };

export type ProfileForPrimaryCta = {
  slug?: string | null;
  action_button_source?: string | null;
  scheduling_provider?: string | null;
  scheduling_url?: string | null;
  shop_store_url?: string | null;
  external_link_url?: string | null;
  external_link_label?: string | null;
  // Pre-resolved by the caller from action_button_link_id when
  // action_button_source === "private_link" — see app/page.tsx. Not queried
  // in here; this module stays a pure function of already-fetched data.
  featuredLink?: FeaturedLink | null;
};

// A bare "spotify.com" needs a protocol to resolve as an absolute link rather
// than a relative path. Mirrors web's normalizeExternalUrl() in _app.links.tsx.
function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function getPrimaryCTA(profile: ProfileForPrimaryCta): PrimaryCtaAction {
  if (profile.action_button_source === "private_link" && profile.featuredLink) {
    const link = profile.featuredLink;
    const label = link.ctaLabel || link.title;
    // No external_url → genuinely internal, routes to the link's own /{slug}
    // page (which renders its own CTA config independently — a different,
    // per-link concept from this account-level selection).
    if (link.externalUrl) {
      return {
        type: "featuredLink",
        mode: "external",
        url: withProtocol(link.externalUrl),
        label,
        linkId: link.id,
        linkSlug: link.linkSlug,
      };
    }
    const pageUrl = `https://${profile.slug}.sqrz.com/${link.linkSlug}`;
    return { type: "featuredLink", mode: "page", url: pageUrl, label, linkId: link.id, linkSlug: link.linkSlug };
  }

  if (profile.action_button_source === "scheduling" && profile.scheduling_provider && profile.scheduling_url) {
    if (profile.scheduling_provider === "calendly") {
      return { type: "scheduling", provider: "calendly", url: profile.scheduling_url, label: "Book a Call" };
    }
    if (profile.scheduling_provider === "hubspot") {
      return { type: "scheduling", provider: "hubspot", url: profile.scheduling_url, label: "Book a Call" };
    }
    // Catch-all for any other configured provider (OpenTable, Resy, Tock,
    // SevenRooms, Eventbrite, Dice, Ticket Tailor, …) — just open the link in
    // a new tab. Only Calendly/HubSpot need their own true integration.
    return { type: "scheduling", provider: "linkout", url: profile.scheduling_url, label: "Book a Call" };
  }

  if (profile.action_button_source === "shop" && profile.shop_store_url) {
    return { type: "shop", url: withProtocol(profile.shop_store_url), label: "Visit my Store" };
  }

  if (profile.action_button_source === "external" && profile.external_link_url) {
    return {
      type: "external",
      url: withProtocol(profile.external_link_url),
      label: profile.external_link_label || "Visit Link",
    };
  }

  // Selected-but-not-actually-configured (e.g. "scheduling" chosen with no
  // provider/url set yet, or a starred link that's since been deleted) falls
  // through to here too, same as no selection at all — never a broken button.
  return { type: "leadForm", label: "Book me" };
}
