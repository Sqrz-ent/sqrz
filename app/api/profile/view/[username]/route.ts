import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function POST(
  req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;

  // Increment view_count on the profile row
  const { error } = await supabase.rpc("increment_profile_view_count", { p_slug: username });
  if (error) {
    // fail silently — profile page never breaks
    console.log("[view] increment failed:", error.message);
  }

  return NextResponse.json({ ok: true });
}
