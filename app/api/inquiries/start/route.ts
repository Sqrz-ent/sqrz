import { NextResponse } from "next/server";

import { startInquirySession } from "@/lib/inquiry-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profileId = String(body?.profileId ?? "");
    const visitorToken = body?.visitorToken ? String(body.visitorToken) : null;
    const visitorName = body?.visitorName ? String(body.visitorName).trim() : null;
    const visitorEmail = body?.visitorEmail ? String(body.visitorEmail).trim() : null;

    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    if (!visitorName || !visitorEmail) {
      return NextResponse.json({ error: "Missing visitor details" }, { status: 400 });
    }

    const session = await startInquirySession({
      profileId,
      visitorToken,
      visitorName,
      visitorEmail,
    });

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start inquiry" },
      { status: 500 }
    );
  }
}
