import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  console.log("[booking-confirm] route called");
  console.log("[booking-confirm] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

  const body = await req.json();
  console.log("[booking-confirm] received body:", JSON.stringify(body));

  const { name, email, booking_id, invite_token } = body;

  if (!email || !booking_id || !invite_token) {
    console.log("[booking-confirm] missing fields — email:", !!email, "booking_id:", !!booking_id, "invite_token:", !!invite_token);
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Use URL API so token is always a proper encoded search param
  const bookingUrl = new URL(`https://dashboard.sqrz.com/booking/${booking_id}`);
  bookingUrl.searchParams.set("token", invite_token);
  const bookingUrlStr = bookingUrl.toString();
  console.log("[booking-confirm] sending to:", email, "url:", bookingUrlStr);

  const { data: resendData, error } = await resend.emails.send({
    from: "SQRZ <bookings@sqrz.com>",
    to: email,
    subject: "Your booking request has been received",
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #111111;">
        <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">Hi ${name || "there"},</p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #444444;">
          Your booking request has been received. You can track its status and communicate with the artist using the link below.
        </p>
        <a href="${bookingUrlStr}"
           style="display: inline-block; padding: 14px 24px; background: #F5A623; color: #111111; font-weight: 700; font-size: 15px; border-radius: 10px; text-decoration: none;">
          View your booking →
        </a>
        <p style="font-size: 13px; color: #888888; margin: 28px 0 0; line-height: 1.5;">
          Or copy this link:<br/><span style="word-break: break-all;">${bookingUrlStr}</span>
        </p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 28px 0;" />
        <p style="font-size: 12px; color: #aaaaaa; margin: 0;">SQRZ · sqrz.com</p>
      </div>
    `,
  });

  console.log("[booking-confirm] resend response — data:", resendData, "error:", error);

  if (error) {
    console.error("[booking-confirm] resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
