import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// Profile-level email lead collector (soft invite at the bottom of the public
// profile). Writes to link_leads with link_id = null to mark it as a
// profile-level lead. Service role — link_leads has no public insert policy.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { profile_id?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const profileId = typeof body.profile_id === "string" ? body.profile_id.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!profileId) {
    return NextResponse.json({ error: "Missing profile_id" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";
  const ipHash = ip ? createHash("sha256").update(ip).digest("hex") : null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("link_leads").insert({
    profile_id: profileId,
    email,
    link_id: null,
    ip_hash: ipHash,
    collected_at: new Date().toISOString(),
  });

  // Duplicate email (unique constraint 23505) is fine — treat as success.
  if (error && error.code !== "23505") {
    console.error("[collect-lead] insert failed:", error);
    return NextResponse.json({ error: "Could not save email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
