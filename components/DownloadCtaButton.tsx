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
        track("download_clicked", { profile_slug: profileSlug, profile_id: profileId, link_slug: linkSlug });
      }}
      style={{
        display: "block",
        width: "100%",
        padding: "16px 32px",
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
