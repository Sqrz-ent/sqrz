import { supabaseServer } from "@/lib/supabase-server";

const RESERVED = new Set(["www", "sqrz", "app", "admin", "api", "dashboard"]);

export type ResolvedProfileSlug = {
  slug: string;
  host: string;
  isCustomDomain: boolean;
};

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "")
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .trim();
}

function getUsernameFromSqrzHost(host: string): string | null {
  if (!host.endsWith(".sqrz.com")) return null;

  const username = host.replace(".sqrz.com", "");
  if (!username || RESERVED.has(username)) return null;
  return username;
}

async function getVerifiedCustomDomainSlug(host: string): Promise<string | null> {
  const { data } = await supabaseServer
    .from("profiles")
    .select("slug")
    .eq("custom_domain", host)
    .eq("custom_domain_verified", true)
    .single();

  return data?.slug ?? null;
}

export async function resolveProfileSlug(input: {
  host?: string | null;
  forwardedSlug?: string | null;
  devUsername?: string | null;
}): Promise<ResolvedProfileSlug | null> {
  if (process.env.NODE_ENV === "development" && input.devUsername) {
    return {
      slug: input.devUsername,
      host: normalizeHost(input.host),
      isCustomDomain: false,
    };
  }

  const host = normalizeHost(input.host);
  if (!host) return null;

  if (input.forwardedSlug) {
    return {
      slug: input.forwardedSlug,
      host,
      isCustomDomain: true,
    };
  }

  const sqrzUsername = getUsernameFromSqrzHost(host);
  if (sqrzUsername) {
    return {
      slug: sqrzUsername,
      host,
      isCustomDomain: false,
    };
  }

  const customDomainSlug = await getVerifiedCustomDomainSlug(host);
  if (!customDomainSlug) return null;

  return {
    slug: customDomainSlug,
    host,
    isCustomDomain: true,
  };
}
