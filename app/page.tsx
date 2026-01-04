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

const rawTemplateKey = profile.template_key;

const templateKey: TemplateKey =
  rawTemplateKey &&
  typeof rawTemplateKey === "string" &&
  rawTemplateKey in PROFILE_TEMPLATES
    ? (rawTemplateKey as TemplateKey)
    : DEFAULT_TEMPLATE;

const template = PROFILE_TEMPLATES[templateKey];






  // ✅ SAFE DEBUG LOG (inside scope)
  const soundcloudEmbed = profile.soundcloud_url
    ? getSoundCloudEmbedUrl(profile.soundcloud_url)
    : null;

  const spotifyEmbed = profile.spotify_url
    ? getSpotifyEmbedUrl(profile.spotify_url)
    : null;





return (
<main className={`profile-page ${template.bodyClass}`}>


  <BookMeButton />

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
  {/* Dark overlay */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9))",
    }}
  />

  {/* Hero content */}
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
      style={{
        fontSize: 42,
        fontWeight: 700,
        color: "#f3b130",
        marginBottom: 8,
      }}
    >
      {profile.display_name || profile.name}
      {/* 🔗 Social Media Bar */}
<div
  style={{
    marginTop: 12,
    display: "flex",
    justifyContent: "center",
    gap: 16,
  }}
>
  {profile.facebook && (
    <a href={profile.facebook} target="_blank" style={iconStyle}>
      <Facebook size={20} />
    </a>
  )}

  {profile.instagram && (
    <a href={profile.instagram} target="_blank" style={iconStyle}>
      <Instagram size={20} />
    </a>
  )}

  {profile.linkedin && (
    <a href={profile.linkedin} target="_blank" style={iconStyle}>
      <Linkedin size={20} />
    </a>
  )}

  {profile.youtube_url && (
    <a href={profile.youtube_url} target="_blank" style={iconStyle}>
      <Youtube size={20} />
    </a>
  )}

</div>
    </h1>
  </div>
</div>

    {profile.facebook_pixel_id && (
      <>
        {/* Facebook Pixel */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${profile.facebook_pixel_id}');
            fbq('track', 'PageView');
          `}
        </Script>
      </>
    )}
{profile.google_analytics_id && (
  <>
    {/* Google Analytics (GA4) */}
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${profile.google_analytics_id}`}
      strategy="afterInteractive"
    />
    <Script id="ga-init" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${profile.google_analytics_id}', {
          anonymize_ip: true,
        });
      `}
    </Script>
  </>
)}


    
     <div
  style={{
    maxWidth: 520,
    margin: "0 auto",
    borderRadius: 16,
    padding: 32,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 45, // 👈 THIS IS THE MAGIC LINE
  }}
>



        {profile.description && (
          <p style={{ color: "text-muted"}}>
            {profile.description}
          </p>
        )}




{profile.skills?.length > 0 && <Skills skills={profile.skills} />}

{profile.services?.length > 0 && (
  <Services services={profile.services} />
)}

{profile.past_employments?.length > 0 && (
  <Experience jobs={profile.past_employments} />
)}



        {/* 🎧 Spotify */}
        {spotifyEmbed && (
          <div style={{ marginTop: 32 }}>
            <iframe
              src={spotifyEmbed}
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; encrypted-media"
            />
          </div>
        )}



     {profile.pics?.length > 0 && (
  <ImageGallery pics={profile.pics} />
)}



        {/* ▶️ YouTube Gallery */}
        {profile.video_gallery?.length > 0 && (
          <YouTubeGallery videos={profile.video_gallery} />
        )}

        {/* 🎧 SoundCloud */}
{soundcloudEmbed && (
  <div
    style={{
      marginTop: 32,
      borderRadius: 16,
      overflow: "hidden",
    }}
  >
    <iframe
      width="100%"
      height="300"
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={soundcloudEmbed}
    />
  </div>
)}


        {/* 📅 Calendar */}
        {profile.slug && (
          <ProfileCalendar username={profile.slug} />
        )}

      </div>
    </main>
  );
}



const iconStyle = {
  color: "text-accent",
  display: "inline-flex",
  alignItems: "center",
};

