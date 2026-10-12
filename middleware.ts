import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RESERVED = ["www", "sqrz", "app", "admin", "api"];

export async function middleware(req: NextRequest, event: NextFetchEvent) {
  const host = (req.headers.get("host") || "").replace(/:\d+$/, "");
  const subdomain = host.split(".")[0];

  // Outreach click logging (VenueFindr → https://[slug].sqrz.com?r=[token]) —
  // deliberately runs before the .sqrz.com early return just below, since
  // that's exactly the host shape this traffic always has; slug is read
  // straight off the subdomain, no DB lookup needed for that part. Never
  // awaited in the response path — event.waitUntil keeps the RPC call alive
  // after the response is sent without delaying it — and every error is
  // swallowed here: log_outreach_click is already a silent no-op for an
  // unknown/mismatched token, and a network/RPC failure on top of that must
  // never be able to affect the page response.
  const outreachToken = req.nextUrl.searchParams.get("r");
  if (outreachToken) {
    const outreachSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    event.waitUntil(
      Promise.resolve(
        outreachSupabase.rpc("log_outreach_click", {
          p_token: outreachToken,
          p_slug: subdomain,
          p_user_agent: req.headers.get("user-agent"),
          p_is_head: req.method === "HEAD",
        })
      ).then(
        () => undefined,
        () => undefined
      )
    );
  }

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
