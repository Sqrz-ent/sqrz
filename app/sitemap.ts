import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { resolveProfileSlug } from "@/lib/profile-resolver";
import { supabaseServer } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const resolved = await resolveProfileSlug({
    host: headersList.get("host"),
    forwardedSlug: headersList.get("x-profile-slug"),
  });

  if (!resolved) return [];

  const baseUrl = `https://${resolved.host}`;

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("id, updated_at")
    .eq("slug", resolved.slug)
    .single();

  if (!profile) return [];

  const { data: privateLinks } = await supabaseServer
    .from("private_booking_links")
    .select("link_slug, updated_at")
    .eq("profile_id", profile.id)
    .eq("is_active", true);

  const homepageUpdatedAt = profile.updated_at
    ? new Date(profile.updated_at)
    : new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: homepageUpdatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const link of privateLinks ?? []) {
    if (!link.link_slug) continue;

    entries.push({
      url: `${baseUrl}/${link.link_slug}`,
      lastModified: link.updated_at ? new Date(link.updated_at) : homepageUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
