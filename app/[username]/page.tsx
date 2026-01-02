

import { headers } from "next/headers";
import { notFound } from "next/navigation";

async function getProfile(username: string) {
  const res = await fetch(
    `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profile/${username}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function HomePage() {
  const headersList = headers();
  const host = headersList.get("host");

  if (!host) notFound();

  // Handle localhost & root domain
  const isLocalhost = host.includes("localhost");
  const parts = host.split(".");

  // Example: willvilla.sqrz.com
  const username = !isLocalhost && parts.length > 2 ? parts[0] : null;

  // Block sqrz.com and www.sqrz.com
  if (!username || username === "www" || username === "sqrz") {
    return (
      <main style={{ padding: 40 }}>
        <h1>SQRZ</h1>
        <p>Main website</p>
      </main>
    );
  }

  const profile = await getProfile(username);

  if (!profile) notFound();

  return (
    <main style={{ padding: 40 }}>
      <h1>{profile.display_name}</h1>
      <p>@{profile.username}</p>
      <p>{profile.bio}</p>
    </main>
  );
}
