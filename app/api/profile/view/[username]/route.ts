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
  await supabase.rpc("increment_profile_view_count", { p_slug: username }).catch(() => {
    // RPC may not exist yet — fail silently so the profile page never breaks
  });

  return NextResponse.json({ ok: true });
}
