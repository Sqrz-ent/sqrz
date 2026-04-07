import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

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

  console.log("[instant-booking] raw RPC data:", JSON.stringify(data));

  const bookingId = data?.booking_id as string | undefined;
  const inviteToken = data?.invite_token as string | undefined;

  console.log("[instant-booking] bookingId:", bookingId);
  console.log("[instant-booking] inviteToken:", inviteToken);

  if (!bookingId) {
    console.error("[instant-booking] no booking_id in RPC result");
    return NextResponse.json({ error: "Booking creation failed" }, { status: 500 });
  }

  // ── 2. Create Stripe Checkout Session ─────────────────────────────────────
  const currency = (instant_currency || "EUR").toLowerCase();

  const successUrl = inviteToken
    ? `https://dashboard.sqrz.com/booking/${bookingId}?token=${inviteToken}&payment=success`
    : `https://dashboard.sqrz.com/booking/${bookingId}?payment=success`;

  console.log("[instant-booking] successUrl:", successUrl);

  const metadata: Record<string, string> = {
    booking_id: bookingId,
    booking_type: "instant",
    owner_profile_id: profile_id ?? "",
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

  console.log("[instant-booking] Stripe session created:", session.id, "url:", session.url);

  // ── 3. Send confirmation email via Resend ─────────────────────────────────
  try {
    await resend.emails.send({
      from: "SQRZ <noreply@sqrz.com>",
      to: from_email,
      subject: `Your ${service_title ?? "booking"} is being processed`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #111111;">
          <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">Hi ${from_name},</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #444444;">
            Thanks for your order! Once payment is complete your booking will be confirmed.
          </p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #444444;">
            You can track your booking here:
          </p>
          <a href="${successUrl}"
             style="display: inline-block; padding: 14px 24px; background: #F5A623; color: #111111; font-weight: 700; font-size: 15px; border-radius: 10px; text-decoration: none;">
            View your booking →
          </a>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 28px 0;" />
          <p style="font-size: 12px; color: #aaaaaa; margin: 0;">SQRZ · sqrz.com</p>
        </div>
      `,
    });
    console.log("[instant-booking] confirmation email sent to:", from_email);
  } catch (emailErr) {
    console.error("[instant-booking] confirmation email failed:", emailErr);
    // Non-fatal — Stripe session was already created
  }

  return NextResponse.json({ checkout_url: session.url });
}
