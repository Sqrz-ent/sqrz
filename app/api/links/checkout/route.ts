import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { link_id, amount, currency } = await req.json();
  if (!link_id) {
    return NextResponse.json({ error: "Missing link_id" }, { status: 400 });
  }

  // ── 1. Fetch the link (service role) + verify it is payment-gated ─────────
  const { data: link } = await supabase
    .from("private_booking_links")
    .select("id, payment_gate, price, currency, link_slug, title, profile_id")
    .eq("id", link_id)
    .single();

  if (!link || link.payment_gate !== true) {
    return NextResponse.json({ error: "Link is not payment-gated" }, { status: 400 });
  }

  // ── 2. Fetch the owner's Stripe Connect account ───────────────────────────
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("stripe_connect_id, slug")
    .eq("id", link.profile_id)
    .single();

  const connectId = (ownerProfile?.stripe_connect_id as string | null) ?? null;
  if (!connectId) {
    return NextResponse.json(
      { error: "This creator can't accept payments yet." },
      { status: 400 }
    );
  }

  // ── 3. Resolve the current page URL for success/cancel redirects ──────────
  const referer = req.headers.get("referer") || "";
  let pageUrl: string;
  try {
    const u = new URL(referer);
    u.search = "";
    u.hash = "";
    pageUrl = u.toString();
  } catch {
    pageUrl = `https://${ownerProfile?.slug ?? ""}.sqrz.com/${link.link_slug}`;
  }
  const successUrl = `${pageUrl}?paid=true`;
  const cancelUrl = pageUrl;

  // ── 4. Price: fixed when link.price is set, else pay-what-you-want ─────────
  const cur = (currency || link.currency || "EUR").toLowerCase();
  const hasFixedPrice = link.price != null && Number(link.price) > 0;
  const presetAmount = amount != null && Number(amount) > 0 ? Math.round(Number(amount) * 100) : undefined;

  const priceData = hasFixedPrice
    ? {
        currency: cur,
        unit_amount: Math.round(Number(link.price) * 100),
        product_data: { name: (link.title as string) ?? "Payment" },
      }
    : {
        currency: cur,
        custom_unit_amount: {
          enabled: true as const,
          minimum: 50,
          ...(presetAmount ? { preset: presetAmount } : {}),
        },
        product_data: { name: (link.title as string) ?? "Payment" },
      };

  // ── 5. Create the Stripe Checkout Session (destination charge) ────────────
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ quantity: 1, price_data: priceData }],
    payment_intent_data: {
      transfer_data: { destination: connectId },
    },
    metadata: {
      link_id: link.id as string,
      type: "link_payment",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ url: session.url });
}
