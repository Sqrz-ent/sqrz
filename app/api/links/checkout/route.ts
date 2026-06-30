import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  // Mirrors app/api/instant-booking/route.ts: live secret key + the live
  // stripe_connect_id column. (instant-booking has no live/test switching — it is
  // live-only — so there is nothing else to mirror.) The destination account in
  // transfer_data must therefore be a LIVE, fully-onboarded Connect account.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { link_id, amount, currency } = await req.json();
  if (!link_id) {
    console.error("[links/checkout] missing link_id in request body");
    return NextResponse.json({ error: "Missing link_id" }, { status: 400 });
  }

  // ── 1. Fetch the link (service role) + verify it is payment-gated ─────────
  const { data: link, error: linkError } = await supabase
    .from("private_booking_links")
    .select("id, payment_gate, price, currency, link_slug, title, profile_id")
    .eq("id", link_id)
    .single();

  if (linkError || !link) {
    console.error("[links/checkout] link not found:", { link_id, linkError });
    return NextResponse.json({ error: "Link not found" }, { status: 400 });
  }
  if (link.payment_gate !== true) {
    console.error("[links/checkout] link is not payment-gated:", { link_id, payment_gate: link.payment_gate });
    return NextResponse.json({ error: "Link is not payment-gated" }, { status: 400 });
  }

  // ── 2. Fetch the owner's Stripe Connect account (service role) ────────────
  const { data: ownerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_connect_id, stripe_connect_status, slug")
    .eq("id", link.profile_id)
    .single();

  const connectId = (ownerProfile?.stripe_connect_id as string | null) ?? null;
  const connectStatus = (ownerProfile?.stripe_connect_status as string | null) ?? null;

  // A destination charge needs a live, fully-onboarded Connect account. Require both
  // an account id and an 'active' status — a missing id or a non-active status
  // (e.g. 'pending') has no transfers capability, so Stripe would reject the session.
  // Block it here with a clear message instead of letting Stripe throw a generic error.
  if (profileError || !connectId || connectStatus !== "active") {
    console.error("[links/checkout] connect account not ready:", {
      profile_id: link.profile_id,
      profileError,
      connectId,
      stripe_connect_status: connectStatus,
    });
    return NextResponse.json(
      { error: "Payment not available" },
      { status: 400 }
    );
  }

  console.log("[links/checkout] using connect account:", {
    connectId,
    stripe_connect_status: connectStatus,
    mode: "live",
  });

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
  try {
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
  } catch (err) {
    // Surfaces the exact Stripe reason in the server logs (e.g. destination account
    // missing the transfers capability, or a test/live object-mode mismatch).
    console.error("[links/checkout] stripe session create failed:", {
      message: (err as Error)?.message,
      connectId,
      stripe_connect_status: ownerProfile?.stripe_connect_status ?? null,
      err,
    });
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Could not start checkout." },
      { status: 500 }
    );
  }
}
