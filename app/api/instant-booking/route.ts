import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST!);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
  const { data, error: rpcError } = await supabase.rpc("create_booking_request", {
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

  console.log("[instant-booking] raw data:", JSON.stringify(data));

  const result = Array.isArray(data) ? data[0] : data;

  console.log("[instant-booking] result:", JSON.stringify(result));

  const bookingId = result?.booking_id as string | undefined;
  const inviteToken = result?.invite_token as string | undefined;

  console.log("[instant-booking] bookingId:", bookingId);
  console.log("[instant-booking] inviteToken:", inviteToken);

  if (!bookingId) {
    console.error("[instant-booking] no booking_id in RPC result");
    return NextResponse.json({ error: "Booking creation failed" }, { status: 500 });
  }

  // ── 2. Fetch member's Connect account + plan fee ───────────────────────────
  let connectId: string | null = null;
  let feePct = 8;

  if (profile_id) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("stripe_connect_id, plan_id, plans(booking_fee_pct)")
      .eq("id", profile_id)
      .single();

    connectId = ownerProfile?.stripe_connect_id ?? null;
    feePct = (ownerProfile?.plans as { booking_fee_pct?: number } | null)?.booking_fee_pct ?? 8;
  }

  // ── 3. Create Stripe Checkout Session ─────────────────────────────────────
  const currency = (instant_currency || "EUR").toLowerCase();
  const rate = Number(instant_price);
  const feeAmount = Math.round(rate * feePct / 100 * 100); // cents
  const totalAmount = Math.round(rate * 100) + feeAmount;  // cents

  console.log("[instant-booking] rate:", rate, "feePct:", feePct, "total:", totalAmount / 100, "connectId:", connectId);

  const successUrl = `https://${to_slug}.sqrz.com?payment=success&service=${encodeURIComponent(service_title ?? "")}`;

  const metadata: Record<string, string> = {
    booking_id: bookingId,
    booking_type: "instant",
    owner_profile_id: profile_id ?? "",
    rate: rate.toString(),
    fee_pct: feePct.toString(),
  };
  if (inviteToken) metadata.invite_token = inviteToken;

  console.log("[instant-booking] creating checkout with metadata:", JSON.stringify(metadata));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: from_email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: totalAmount,
          product_data: {
            name: service_title ?? "Booking",
            description: `Instant booking with ${to_slug}`,
          },
        },
      },
    ],
    payment_intent_data: connectId
      ? {
          application_fee_amount: feeAmount,
          transfer_data: { destination: connectId },
        }
      : undefined,
    metadata,
    success_url: successUrl,
    cancel_url: `https://${to_slug}.sqrz.com`,
  });

  console.log("[instant-booking] Stripe session created:", session.id, "url:", session.url);

  return NextResponse.json({ checkout_url: session.url });
}
