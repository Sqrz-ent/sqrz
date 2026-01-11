import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;

  console.log("View API hit for:", username);

  const url = `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profileCounter/${username}`;

  console.log("Calling Xano:", url);

  const res = await fetch(url, { method: "POST" });

  console.log("Xano status:", res.status);

  const text = await res.text();

  console.log("Xano response:", text);

  return NextResponse.json({ ok: true });
}
