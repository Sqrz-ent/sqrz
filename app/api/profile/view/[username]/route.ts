import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;

  const res = await fetch(
    `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profileCounter/${username}`,
    {
      method: "POST",
    }
  );

  const text = await res.text();

  return NextResponse.json({ ok: true, data: text });
}
