import { NextResponse } from "next/server";

import { sendInquiryPushNotification } from "@/lib/push-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const threadId = String(body?.threadId ?? "");
    const messageText = String(body?.messageText ?? "").trim();

    if (!threadId || !messageText) {
      return NextResponse.json({ error: "Missing threadId or messageText" }, { status: 400 });
    }

    const result = await sendInquiryPushNotification({
      threadId,
      messageText,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to notify inquiry owner" },
      { status: 500 }
    );
  }
}
