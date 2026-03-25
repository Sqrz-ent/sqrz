import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { profile_id, visitor_name, visitor_email, message, budget } =
      await request.json();

    if (!profile_id || !visitor_name || !visitor_email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("bookings").insert({
      owner_id: profile_id,
      type: "lead",
      channel_auth: "public",
      status: "lead",
      guest_name: visitor_name,
      guest_email: visitor_email,
      description: message,
      budget_range: budget ?? null,
    });

    if (error) {
      console.error("[api/leads] insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/leads] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
