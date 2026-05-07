import { NextResponse } from "next/server";

import { bootstrapExistingInquirySession } from "@/lib/inquiry-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profileId = String(body?.profileId ?? "");
    const visitorToken = String(body?.visitorToken ?? "");

    if (!profileId || !visitorToken) {
      return NextResponse.json({ thread: null }, { status: 200 });
    }

    const session = await bootstrapExistingInquirySession({
      profileId,
      visitorToken,
    });

    return NextResponse.json(session ?? { thread: null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to bootstrap inquiry" },
      { status: 500 }
    );
  }
}
