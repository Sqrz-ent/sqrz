import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RESERVED = ["www", "sqrz", "app", "admin", "api"];

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").replace(/:\d+$/, "");
  const subdomain = host.split(".")[0];

  // Sqrz subdomains, root domain, reserved names, and localhost — pass through
  if (
    host.endsWith(".sqrz.com") ||
    host === "sqrz.com" ||
    host.startsWith("localhost") ||
    RESERVED.includes(subdomain)
  ) {
    return NextResponse.next();
  }

  // Custom domain — look up verified profile in Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data } = await supabase
    .from("profiles")
    .select("slug")
    .eq("custom_domain", host)
    .eq("custom_domain_verified", true)
    .single();

  if (!data?.slug) return NextResponse.next();

  if (process.env.NODE_ENV === "development") {
    // Dev: rewrite to /?username={slug} — picked up by page.tsx dev shortcut
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("username", data.slug);
    return NextResponse.rewrite(url);
  }

  // Prod: pass slug via header — page.tsx resolves via getProfileByDomain fallback
  const res = NextResponse.next();
  res.headers.set("x-profile-slug", data.slug);
  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
