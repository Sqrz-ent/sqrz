import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { normalizeHost, resolveProfileSlug } from "@/lib/profile-resolver";

function toBaseUrl(host: string): string {
  return `https://${host}`;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = normalizeHost(headersList.get("host"));
  const resolved = await resolveProfileSlug({
    host,
    forwardedSlug: headersList.get("x-profile-slug"),
  });

  const baseUrl = host ? toBaseUrl(host) : undefined;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard"],
    },
    sitemap: resolved && baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
    host: resolved && baseUrl ? baseUrl : undefined,
  };
}
