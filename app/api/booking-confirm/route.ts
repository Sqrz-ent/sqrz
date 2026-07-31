import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  console.log("[booking-confirm] route called");
  console.log("[booking-confirm] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);

  const body = await req.json();
  console.log("[booking-confirm] received body:", JSON.stringify(body));

  const { requester_name, requester_email, artist_name, service } = body;

  if (!requester_email) {
    console.error("[booking-confirm] missing required field — requester_email:", !!requester_email);
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  console.log("[booking-confirm] sending receipt to:", requester_email);

  // No bookings, only leads — this is a plain receipt (no tracking link; the artist
  // now sees this as a lead in their Office, not a booking with its own view/URL).
  const artistLine = artist_name ? `with <strong>${artist_name}</strong>` : "";
  const serviceLine = service ? `<p style="font-size: 14px; color: #444444; margin: 0 0 24px;">Service: ${service}</p>` : "";

  const { data: resendData, error } = await resend.emails.send({
    from: "noreply@sqrz.com",
    to: requester_email,
    subject: "Your inquiry was received",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #111111;">
        <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">Hi ${requester_name || "there"},</p>
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #444444;">
          Your inquiry ${artistLine} has been received. They'll get back to you directly at this email address.
        </p>
        ${serviceLine}
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
