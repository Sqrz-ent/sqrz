"use client";

import { track } from "@/lib/tracking/track";

type DownloadCtaButtonProps = {
  href: string;
  accent: string;
  profileSlug: string;
  profileId: string;
  linkSlug: string;
  label: string;
};

export default function DownloadCtaButton({ href, accent, profileSlug, profileId, linkSlug, label }: DownloadCtaButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // Consolidated with the hero pill: both represent "left to an external URL".
        // destination:'external' distinguishes these from pill clicks that route to
        // the hosted /{slug} page (destination:'page').
        track("external_link_clicked", {
          profile_slug: profileSlug,
          profile_id: profileId,
          link_slug: linkSlug,
          destination: "external",
        });
      }}
      style={{
        display: "block",
        width: "100%",
        padding: "16px",
        background: accent,
        color: "#fff",
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 700,
        textAlign: "center",
        textDecoration: "none",
        boxSizing: "border-box",
      }}
    >
      {label}
    </a>
  );
}
