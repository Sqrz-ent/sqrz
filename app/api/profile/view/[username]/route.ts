import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { username: string } }
) {
  const res = await fetch(
    `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profileCounter/${params.username}`,
    {
      method: "POST",
    }
  );

  const data = await res.text();
  return NextResponse.json({ ok: true, data });
}
