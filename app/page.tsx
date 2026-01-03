import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSpotifyEmbedUrl } from "@/lib/spotify";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

/* =========================
   DATA FETCHING
========================= */
async function getProfile(username: string) {
  const res = await fetch(
    `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profile/${username}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  return res.json();
}

/* =========================
   SEO METADATA
========================= */
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) return {};

  const username = host.split(".")[0];

  if (!username || username === "www" || username === "sqrz") {
    return {
      title: "SQRZ",
      description: "Book freelancers with SQRZ",
      metadataBase: new URL("https://sqrz.com"),
    };
  }

  const profile = await getProfile(username);
  if (!profile) return {};

  const baseUrl = `https://${host}`;
  const title = profile.display_name || profile.slug;
  const description =
    profile.description || `View ${title}'s profile on SQRZ`;

  const imageUrl =
    profile.og_image?.url ||
    profile.profile_pic_img?.url ||
    `${baseUrl}/og/default.png`;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,

    openGraph: {
      type: "profile",
      title,
      description,
      url: baseUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },

    icons: profile.favicon?.url
      ? {
          icon: profile.favicon.url,
          apple: profile.favicon.url,
        }
      : undefined,
  };
}

/* =========================
   PAGE
========================= */
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

  /* =========================
     MEDIA EMBEDS (⬅️ THIS IS THE IMPORTANT PART)
  ========================= */
  const spotifyEmbed = profile.spotify_url
    ? getSpotifyEmbedUrl(profile.spotify_url)
    : null;

  const youtubeEmbed = profile.youtube_url
    ? getYouTubeEmbedUrl(profile.youtube_url)
    : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        padding: "48px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          background: "#000",
          borderRadius: 16,
          padding: 32,
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
            color: "#fff",
          }}
        >
          {profile.display_name || profile.slug}
        </h1>

        {profile.description && (
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              opacity: 0.8,
              whiteSpace: "pre-line",
              color: "#fff",
            }}
          >
            {profile.description}
          </p>
        )}

        {/* 🎧 SPOTIFY PLAYER */}
        {spotifyEmbed && (
          <div
            style={{
              marginTop: 32,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <iframe
              src={spotifyEmbed}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        )}

        {/* ▶️ YOUTUBE PLAYER */}
        {youtubeEmbed && (
          <div
            style={{
              marginTop: 32,
              borderRadius: 16,
              overflow: "hidden",
              aspectRatio: "16 / 9",
              background: "#000",
            }}
          >
            <iframe
              src={youtubeEmbed}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
      </div>
    </main>
  );
}
