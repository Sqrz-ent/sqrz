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
import MusoWidget from "@/components/MusoWidget";
import ViewTracker from "@/components/ViewTracker";
import LeadCapture from "@/components/LeadCapture";
import TicketLinkButton from "@/components/TicketLinkButton";
import CtaCarousel from "@/components/CtaCarousel";
import BandsintownWidget from "@/components/BandsintownWidget";







/* =========================
   DATA FETCHING
========================= */


import { supabase } from "@/lib/supabase";

async function getProfileByUsername(username: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*, profile_skills(skill_id, skills(name, category)), profile_videos(*), profile_services(*), profile_references(*)")
    .eq("slug", username)
    .single();

  return data ?? null;
}

async function getProfileByDomain(domain: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*, profile_skills(skill_id, skills(name, category)), profile_videos(*), profile_services(*), profile_references(*)")
    .eq("custom_domain", domain)
    .single();

  return data ?? null;
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
    (profile.avatar_url && !String(profile.avatar_url).includes("placeholder.") ? profile.avatar_url : null) ||
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
  searchParams: Promise<{ preview?: string; username?: string; claim?: string }>;
}) {
  const params = await searchParams;

  console.log("[HomePage] params:", params);
  console.log("[HomePage] NODE_ENV:", process.env.NODE_ENV);

  const isPreview = params.preview === "true";
  let profile: Record<string, any> | null = null;

  // Dev shortcut: ?username=willvilla bypasses host-based routing (dev only)
  if (process.env.NODE_ENV === "development" && params.username) {
    profile = await getProfileByUsername(params.username);
    console.log("[HomePage] getProfileByUsername result:", profile);
  } else {
    const headersList = await headers();
    const rawHost = headersList.get("host");
    if (!rawHost) notFound();

    const host = rawHost.toLowerCase().replace(/:\d+$/, "").trim();

    // 🔥 IMPORTANT: ignore dashboard host
    if (host === "dashboard.sqrz.com") notFound();

    profile = await getProfileFromHost(host);
  }

  if (!profile) notFound();

  // Claim banner — verify token matches this profile and hasn't been claimed yet
  let showClaimBanner = false;
  const claimParam = params.claim;
  if (claimParam && profile.slug) {
    const { data: claimValid } = await supabase
      .from("profiles")
      .select("id, slug, claim_token, is_claimed")
      .eq("slug", profile.slug as string)
      .eq("claim_token", claimParam)
      .eq("is_claimed", false)
      .maybeSingle();
    if (claimValid) showClaimBanner = true;
  }


  const rawTemplateKey = profile.template_id;

  const templateKey: TemplateKey =
    rawTemplateKey &&
    typeof rawTemplateKey === "string" &&
    rawTemplateKey in PROFILE_TEMPLATES
      ? (rawTemplateKey as TemplateKey)
      : DEFAULT_TEMPLATE;

  const template = PROFILE_TEMPLATES[templateKey];

  const soundcloudEmbed = profile.widget_soundcloud
    ? getSoundCloudEmbedUrl(profile.widget_soundcloud)
    : null;

  const spotifyEmbed = profile.widget_spotify
    ? getSpotifyEmbedUrl(profile.widget_spotify)
    : null;

  const servicesActive =
    profile.services_active === true && (profile.profile_services?.length ?? 0) > 0;

const ticket = {
    label: "Tickets on Eventim",
    provider: "eventim",
    url: "https://www.eventim.de/event/...",
  };

  const claimUrl = `https://dashboard.sqrz.com/claim?token=${encodeURIComponent(claimParam ?? "")}&slug=${encodeURIComponent(profile.slug as string ?? "")}`;

  const hasRealAvatar =
    profile.avatar_url &&
    !String(profile.avatar_url).includes("placeholder.sqrz.com") &&
    !String(profile.avatar_url).includes("placeholder.");

  const avatarSrc = hasRealAvatar
    ? (profile.avatar_url as string)
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent((profile.name || profile.slug || "") as string)}&backgroundColor=F5A623&textColor=ffffff&fontSize=38`;

  return (
    <>
    {showClaimBanner && (
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#F5A623",
        color: "#fff",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        boxShadow: "0 2px 12px rgba(245,166,35,0.4)",
        flexWrap: "wrap",
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
      }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>
          Is this you? Claim this profile and take full control.
        </span>
        <a
          href={claimUrl}
          style={{
            background: "#fff",
            color: "#F5A623",
            fontWeight: 800,
            fontSize: 14,
            padding: "8px 18px",
            borderRadius: 20,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Claim Profile →
        </a>
      </div>
    )}
    <main className={`profile-page ${template.bodyClass}`}>


    {/* 🔐 Analytics + tracking (consent-gated) */}
    <AnalyticsGate
      googleAnalyticsId={profile.pixel_google}
      facebookPixelId={profile.pixel_facebook}
      hubspotPortalId={profile.hubspot_portal_id}
      hubspotEnabled={!!profile.hubspot_portal_id}
      linkedinPartnerId={profile.pixel_linkedin}
      isPreview={isPreview}
    />

{servicesActive && (
  <BookMeButton username={profile.slug} services={profile.profile_services} />
)}
<FloatingSQRZButton />
<ViewTracker username={profile.slug} />



      {/* 🖼️ Profile Hero */}
      <div
        style={{
          height: 480,
          backgroundImage: hasRealAvatar
            ? `url(${avatarSrc})`
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
            {profile.social_facebook && (
              <a href={profile.social_facebook} target="_blank" rel="noopener noreferrer">
                <Facebook size={20} />
              </a>
            )}
            {profile.social_instagram && (
              <a href={profile.social_instagram} target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
            )}
            {profile.social_linkedin && (
              <a href={profile.social_linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin size={20} />
              </a>
            )}
            {profile.social_youtube && (
              <a href={profile.social_youtube} target="_blank" rel="noopener noreferrer">
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
          gap: 64,
        }}
      >
        {profile.bio && <p>{profile.bio}</p>}

        {profile.links?.length > 0 && <CtaCarousel links={profile.links} />}


        {profile.profile_skills?.length > 0 && <Skills skills={profile.profile_skills} />}
        {servicesActive && <Services services={profile.profile_services} />}


         {spotifyEmbed && (
          <iframe src={spotifyEmbed} width="100%" height="152" />
        )}

        {profile.widget_bandsintown ? (
        <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Tour Dates</h2>
        <BandsintownWidget bandsintownUrl={profile.widget_bandsintown} />
        </div>
        ) : null}


        {profile.pics?.length > 0 && <ImageGallery pics={profile.pics} />}


        {profile.profile_videos?.length > 0 && (
          <YouTubeGallery videos={profile.profile_videos} />
        )}

        {soundcloudEmbed && (
          <iframe src={soundcloudEmbed} width="100%" height="300" />
        )}

       {profile.muso?.profile_url && (
        <MusoWidget profile={profile.muso} />
        )}

        {profile.profile_references?.length > 0 && (
          <Experience jobs={profile.profile_references} />
        )}

        {profile.slug && <ProfileCalendar username={profile.slug} />}



       <LeadCapture
        profileId={profile.id}
        username={profile.slug}
        title="Book with a first-time discount"
        subline="Share your email to receive a special offer and connect directly with this creator"
        />

         




      </div>
    </main>
    </>
  );
}

