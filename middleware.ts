import { NextRequest, NextResponse } from "next/server";

const RESERVED = ["www", "sqrz", "app", "admin", "api"];

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const subdomain = host.split(".")[0];

  // Block root domain or reserved names
  if (!subdomain || RESERVED.includes(subdomain)) {
    return NextResponse.next();
  }

  // Let the request through untouched
  // app/page.tsx will read the host and render the profile
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
