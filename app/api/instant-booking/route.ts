import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    to_slug,
    from_name,
    from_email,
    message,
    service_title,
    instant_price,
    instant_currency,
    profile_id,
  } = body;

  if (!to_slug || !from_name || !from_email || !instant_price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── 1. Create booking via RPC ──────────────────────────────────────────────
  const { data: rpcData, error: rpcError } = await supabase.rpc("create_booking_request", {
    p_to_slug: to_slug,
    p_from_name: from_name,
    p_from_email: from_email,
    p_service: service_title ?? null,
    p_message: message ?? "",
    p_event_date: null,
    p_event_location: null,
    p_budget_min: null,
    p_budget_max: null,
    p_currency: (instant_currency || "EUR").toUpperCase(),
    p_source: "instant",
    p_utm_source: null,
    p_utm_campaign: null,
  });

  if (rpcError) {
    console.error("[instant-booking] RPC error:", rpcError);
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  // Normalise RPC result
  let result: Record<string, unknown> = {};
  if (typeof rpcData === "string") {
    try { result = JSON.parse(rpcData); } catch { result = {}; }
  } else if (Array.isArray(rpcData)) {
    result = (rpcData[0] as Record<string, unknown>) ?? {};
  } else if (rpcData && typeof rpcData === "object") {
    result = rpcData as Record<string, unknown>;
  }

  const booking_id = result.booking_id as string | undefined;
  const invite_token = (result.invite_token ?? result.token) as string | undefined;

  console.log("[instant-booking] RPC result — booking_id:", booking_id, "invite_token:", invite_token);

  if (!booking_id) {
    console.error("[instant-booking] no booking_id in RPC result:", JSON.stringify(rpcData));
    return NextResponse.json({ error: "Booking creation failed" }, { status: 500 });
  }

  // ── 2. Create Stripe Checkout Session ─────────────────────────────────────
  const currency = (instant_currency || "EUR").toLowerCase();

  // Token in success_url so the guest lands on their booking after payment
  const successUrl = invite_token
    ? `https://dashboard.sqrz.com/booking/${booking_id}?token=${invite_token}&payment=success`
    : `https://dashboard.sqrz.com/booking/${booking_id}?payment=success`;

  const metadata = {
    booking_id,
    invite_token: invite_token ?? "",
    profile_id: profile_id ?? "",
    booking_type: "instant",
  };

  console.log("[instant-booking] creating checkout with metadata:", JSON.stringify(metadata));
  console.log("[instant-booking] success_url:", successUrl);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: from_email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(Number(instant_price) * 100),
          product_data: {
            name: service_title ?? "Booking",
            description: `Instant booking with ${to_slug}`,
          },
        },
      },
    ],
    metadata,
    success_url: successUrl,
    cancel_url: `https://${to_slug}.sqrz.com`,
  });

  console.log("[instant-booking] checkout session created:", session.id);

  return NextResponse.json({ checkout_url: session.url });
}
