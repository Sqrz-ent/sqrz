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
    event_date,
    event_location,
    title,
    booking_ref_code,
  } = body;

  if (!to_slug || !from_name || !from_email || !instant_price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── 1. Fetch plan_id, connect account, and tax rate ───────────────────────
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

  // ── 2. Calculate total ────────────────────────────────────────────────────
  const currency = (instant_currency || "EUR").toLowerCase();
  const net = Number(instant_price);
  const sqrzFeeRate = planId === 5 ? 0.03 : planId === 1 ? 0.05 : 0.00;
  const tax = net * (instantTaxRate / 100);
  const sqrzFee = net * sqrzFeeRate;
  const total = net + tax + sqrzFee;

  const feeAmount = Math.round(sqrzFee * 100);
  const totalAmount = Math.round(total * 100);

  console.log("[instant-booking] net:", net, "taxRate:", instantTaxRate, "sqrzFeeRate:", sqrzFeeRate, "total:", total, "connectId:", connectId);

  // ── 3. Create Stripe Checkout Session ─────────────────────────────────────
  const metadata: Record<string, string> = {
    type: "instant_booking",
    to_slug,
    from_name,
    from_email,
    service: service_title ?? "",
    message: message ?? "",
    title: title ?? "",
    event_date: event_date ?? "",
    event_location: event_location ?? "",
    rate: net.toString(),
    fee_pct: (sqrzFeeRate * 100).toString(),
    tax_pct: instantTaxRate.toString(),
    tax_amount: tax.toFixed(2),
    owner_profile_id: profile_id ?? "",
    booking_ref_code: booking_ref_code ?? "",
  };

  const successUrl = `https://${to_slug}.sqrz.com?payment=success&service=${encodeURIComponent(service_title ?? "")}`;

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
      ? { application_fee_amount: feeAmount, transfer_data: { destination: connectId } }
      : undefined,
    metadata,
    success_url: successUrl,
    cancel_url: `https://${to_slug}.sqrz.com`,
  });

  console.log("[instant-booking] session created:", session.id);

  return NextResponse.json({ url: session.url });
}
