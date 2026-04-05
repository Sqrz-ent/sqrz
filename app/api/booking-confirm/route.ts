import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  console.log("[booking-confirm] route called");
  console.log("[booking-confirm] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

  const body = await req.json();
  console.log("[booking-confirm] received body:", JSON.stringify(body));

  const { booking_id, invite_token, requester_name, requester_email, artist_name, service } = body;

  if (!requester_email || !booking_id || !invite_token) {
    console.error("[booking-confirm] missing required fields — requester_email:", !!requester_email, "booking_id:", !!booking_id, "invite_token:", !!invite_token);
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const bookingUrl = new URL(`https://dashboard.sqrz.com/booking/${booking_id}`);
  bookingUrl.searchParams.set("token", invite_token);
  const bookingUrlStr = bookingUrl.toString();
  console.log("[booking-confirm] sending to:", requester_email, "url:", bookingUrlStr);

  const artistLine = artist_name ? `with <strong>${artist_name}</strong>` : "";
  const serviceLine = service ? `<p style="font-size: 14px; color: #444444; margin: 0 0 24px;">Service: ${service}</p>` : "";

  const { data: resendData, error } = await resend.emails.send({
    from: "noreply@sqrz.com",
    to: requester_email,
    subject: "Your booking request was received",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #111111;">
        <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">Hi ${requester_name || "there"},</p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #444444;">
          Your booking request ${artistLine} has been received. Use the link below to track its status and message the artist directly.
        </p>
        ${serviceLine}
        <a href="${bookingUrlStr}"
           style="display: inline-block; padding: 14px 24px; background: #F5A623; color: #111111; font-weight: 700; font-size: 15px; border-radius: 10px; text-decoration: none;">
          View your booking →
        </a>
        <p style="font-size: 13px; color: #888888; margin: 28px 0 0; line-height: 1.5;">
          Or copy this link:<br/>
          <span style="word-break: break-all; color: #555555;">${bookingUrlStr}</span>
        </p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 28px 0;" />
        <p style="font-size: 12px; color: #aaaaaa; margin: 0;">SQRZ · sqrz.com</p>
      </div>
    `,
  });

  console.log("[booking-confirm] resend response — data:", JSON.stringify(resendData), "error:", JSON.stringify(error));

  if (error) {
    console.error("[booking-confirm] resend FULL error:", JSON.stringify(error));
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: resendData?.id });
}
