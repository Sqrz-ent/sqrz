import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

async function getProfile(username: string) {
  const res = await fetch(
    `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profile/${username}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  return res.json();
}

/* =========================
   SEO METADATA (IMPORTANT)
========================= */
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) return {};

  const parts = host.split(".");
  const username = parts.length > 2 ? parts[0] : null;

  if (!username || username === "www" || username === "sqrz") {
    return {
      title: "SQRZ",
      description: "Book freelancers with SQRZ",
    };
  }

  const profile = await getProfile(username);
  if (!profile) return {};

  return {
  title: profile.slug,
  description: profile.description,

  icons: {
    icon: [
      {
        url: profile.profile_pic_img?.url,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: profile.profile_pic_img?.url,
        sizes: "16x16",
        type: "image/png",
      },
    ],
    shortcut: profile.profile_pic_img?.url,
    apple: profile.profile_pic_img?.url,
  },

  openGraph: {
    title: profile.slug,
    description: profile.description,
    images: profile.profile_pic_img?.url
      ? [{ url: profile.profile_pic_img.url }]
      : [],
  },
};

}

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) notFound();

  const parts = host.split(".");
  const username = parts.length > 2 ? parts[0] : null;

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
    <main
      style={{
        minHeight: "100vh",
        background: "#000000ff",
        padding: "48px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background: "#000000ff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        {profile.profile_pic_img?.url && (
          <img
            src={profile.profile_pic_img.url}
            alt={profile.slug}
            style={{
              width: 140,
              height: 140,
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: 24,
            }}
          />
        )}

        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          {profile.slug}
        </h1>

        {profile.description && (
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              opacity: 0.8,
              whiteSpace: "pre-line",
            }}
          >
            {profile.description}
          </p>
        )}
      </div>
    </main>
  );
}
