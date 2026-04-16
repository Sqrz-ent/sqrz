import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
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
    p_message: message ?? null,
    p_event_date: null,
    p_event_location: null,
    p_title: null,
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

  // ── 2. Fetch member's Connect account, plan_id, and service tax rate ────────
  let connectId: string | null = null;
  let planId: number | null = null;
  let instantTaxRate = 0;

  if (profile_id) {
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("stripe_connect_id, plan_id")
      .eq("id", profile_id)
      .single();

    connectId = ownerProfile?.stripe_connect_id ?? null;
    planId = (ownerProfile?.plan_id as number | null) ?? null;

    if (service_title) {
      const { data: svc } = await supabase
        .from("profile_services")
        .select("instant_tax_rate")
        .eq("profile_id", profile_id)
        .eq("title", service_title)
        .single();
      instantTaxRate = (svc?.instant_tax_rate as number | null) ?? 0;
    }
  }

  // ── 3. Create Stripe Checkout Session ─────────────────────────────────────
  const currency = (instant_currency || "EUR").toLowerCase();
  const net = Number(instant_price);
  const sqrzFeeRate = planId === 5 ? 0.03 : planId === 1 ? 0.05 : 0.00;
  const tax = net * (instantTaxRate / 100);
  const sqrzFee = net * sqrzFeeRate;
  const total = net + tax + sqrzFee;

  const feeAmount = Math.round(sqrzFee * 100);   // cents
  const totalAmount = Math.round(total * 100);    // cents

  console.log("[instant-booking] net:", net, "taxRate:", instantTaxRate, "sqrzFeeRate:", sqrzFeeRate, "total:", total, "connectId:", connectId);

  const successUrl = `https://${to_slug}.sqrz.com?payment=success&service=${encodeURIComponent(service_title ?? "")}`;

  const metadata: Record<string, string> = {
    booking_id: bookingId,
    booking_type: "instant",
    owner_profile_id: profile_id ?? "",
    rate: net.toString(),
    fee_pct: (sqrzFeeRate * 100).toString(),
    tax_pct: instantTaxRate.toString(),
    tax_amount: tax.toFixed(2),
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

  // ── 4. Mark booking as pending_payment ────────────────────────────────────
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  await supabase
    .from("bookings")
    .update({
      status: "pending_payment",
      payment_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
    })
    .eq("id", bookingId);

  return NextResponse.json({ checkout_url: session.url });
}
