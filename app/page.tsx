import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";

import ImageGallery from "@/components/ImageGallery";
import { getSpotifyEmbedUrl } from "@/lib/spotify";
import YouTubeGallery from "@/components/YouTubeGallery";
import ProfileCalendar from "@/components/ProfileCalendar";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";
import BookMeButton from "@/components/BookMeButton";
import { getSoundCloudEmbedUrl } from "@/lib/soundcloud";
import Skills from "@/components/Skills";
import Services from "@/components/Services";
import Experience from "@/components/Experience";
import {
  PROFILE_TEMPLATES,
  DEFAULT_TEMPLATE,
  type TemplateKey,
} from "@/lib/profileTemplates";
import FloatingSQRZButton from "@/components/FloatingSQRZButton";
import AnalyticsGate from "@/components/tracking/AnalyticsGate";





/* =========================
   DATA FETCHING
========================= */


async function getProfileByUsername(username: string) {
  const res = await fetch(
    `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profile/${username}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

async function getProfileByDomain(domain: string) {
  const res = await fetch(
    `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/profile-by-domain/${domain}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

async function getProfileFromHost(host: string) {
  const cleanHost = host
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .trim();

  if (cleanHost.endsWith(".sqrz.com")) {
    const username = cleanHost.replace(".sqrz.com", "");
    if (!username || username === "www" || username === "sqrz") return null;
    return getProfileByUsername(username);
  }

  return getProfileByDomain(cleanHost);
}

/* =========================
   SEO METADATA
========================= */

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const rawHost = headersList.get("host");

  if (!rawHost) return {};

  const host = rawHost
    .toLowerCase()
    .replace(/:\d+$/, "") // strip :443 etc.
    .trim();

  if (!host) return {};

  const profile = await getProfileFromHost(host);
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
  };
}

/* =========================
   PAGE
========================= */

export default async function HomePage({
  searchParams,
}: {
  searchParams: { preview?: string };
}) {
  const headersList = await headers();
  const rawHost = headersList.get("host");
  if (!rawHost) notFound();

  const host = rawHost
    .toLowerCase()
    .replace(/:\d+$/, "")
    .trim();

    const isPreview = searchParams.preview === "true";


  // 🔥 IMPORTANT: ignore dashboard host
  if (host === "dashboard.sqrz.com") {
    notFound();
  }

  const profile = await getProfileFromHost(host);
  if (!profile) notFound();


  const rawTemplateKey = profile.template_key;

  const templateKey: TemplateKey =
    rawTemplateKey &&
    typeof rawTemplateKey === "string" &&
    rawTemplateKey in PROFILE_TEMPLATES
      ? (rawTemplateKey as TemplateKey)
      : DEFAULT_TEMPLATE;

  const template = PROFILE_TEMPLATES[templateKey];

  const soundcloudEmbed = profile.soundcloud_url
    ? getSoundCloudEmbedUrl(profile.soundcloud_url)
    : null;

  const spotifyEmbed = profile.spotify_url
    ? getSpotifyEmbedUrl(profile.spotify_url)
    : null;

  return (
    <main className={`profile-page ${template.bodyClass}`}>


    {/* 🔐 Analytics + tracking (consent-gated) */}
    <AnalyticsGate
      facebookPixelId={profile.facebook_pixel_id}
      googleAnalyticsId={profile.google_analytics_id}
      hubspotPortalId={profile.hubspot_portal_id}
      isPreview={isPreview}
    />

<BookMeButton
  username={profile.slug}
  services={profile.services}
/>
<FloatingSQRZButton />


      {/* 🖼️ Profile Hero */}
      <div
        style={{
          height: 480,
          backgroundImage: profile.profile_pic_img?.url
            ? `url(${profile.profile_pic_img.url})`
            : "linear-gradient(135deg, #111, #000)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9))",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            textAlign: "center",
            padding: "24px 20px",
            maxWidth: 520,
            margin: "0 auto",
          }}
        >
          <h1
            className="text-accent"
            style={{ fontSize: 42, fontWeight: 700, marginBottom: 8 }}
          >
            {profile.display_name || profile.name || profile.slug}
          </h1>

          <div
            className="social-bar"
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "center",
              gap: 16,
            }}
          >
            {profile.facebook && (
              <a href={profile.facebook} target="_blank" rel="noopener noreferrer">
                <Facebook size={20} />
              </a>
            )}
            {profile.instagram && (
              <a href={profile.instagram} target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin size={20} />
              </a>
            )}
            {profile.youtube_url && (
              <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer">
                <Youtube size={20} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Analytics */}

      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 45,
        }}
      >
        {profile.description && <p>{profile.description}</p>}

        {profile.skills?.length > 0 && <Skills skills={profile.skills} />}
        {profile.services?.length > 0 && <Services services={profile.services} />}
     

        {spotifyEmbed && (
          <iframe src={spotifyEmbed} width="100%" height="152" />
        )}

        {profile.pics?.length > 0 && <ImageGallery pics={profile.pics} />}
        {profile.video_gallery?.length > 0 && (
          <YouTubeGallery videos={profile.video_gallery} />
        )}

        {soundcloudEmbed && (
          <iframe src={soundcloudEmbed} width="100%" height="300" />
        )}

        {profile.slug && <ProfileCalendar username={profile.slug} />}


           {profile.references?.length > 0 && (
          <Experience jobs={profile.references} />
        )}


      </div>
    </main>
  );
}

