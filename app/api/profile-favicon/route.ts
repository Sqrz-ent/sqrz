import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getProfileIconUrl } from "@/lib/profile-icons";
import { resolveProfileSlug } from "@/lib/profile-resolver";

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileSlug({
    host: request.headers.get("host"),
    forwardedSlug: request.headers.get("x-profile-slug"),
    devUsername:
      process.env.NODE_ENV === "development"
        ? request.nextUrl.searchParams.get("username")
        : null,
  });

  if (!resolved) {
    return NextResponse.redirect(new URL("/brand/sqrz_logo.png", request.url));
  }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("avatar_url")
    .eq("slug", resolved.slug)
    .maybeSingle();

  const iconUrl = getProfileIconUrl(profile?.avatar_url as string | null | undefined);
  const targetUrl = iconUrl.startsWith("http")
    ? iconUrl
    : new URL(iconUrl, request.url).toString();

  return NextResponse.redirect(targetUrl, {
    headers: {
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
