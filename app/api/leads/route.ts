import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[api/leads] Missing env vars:", {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const { profile_id, visitor_name, visitor_email, message } =
      await request.json();

    if (!profile_id || !visitor_name || !visitor_email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: booking, error } = await supabaseAdmin.from("bookings").insert({
      owner_id: profile_id,
      status: "lead",
      title: `Message from ${visitor_name}`,
      description: message,
    }).select("id").single();

    if (error) {
      console.error("[api/leads] insert error:", error.message, error.details, error.hint);
      return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
    }

    await supabaseAdmin.from("booking_participants").insert({
      booking_id: booking.id,
      email: visitor_email,
      name: visitor_name,
      role: "buyer",
      invite_token: crypto.randomBytes(32).toString("hex"),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/leads] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
