"use client";
import React from "react";

export type CtaLink = {
  id?: string | number;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  url: string;
  imageUrl?: string;
  provider?: string;
};

type Props = {
  link: CtaLink;
};

export default function CtaCard({ link }: Props) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "group block w-full overflow-hidden rounded-2xl",
        "border border-white/10 bg-zinc-950",
        "shadow-lg shadow-black/20 transition-all duration-200",
        "hover:-translate-y-[1px] hover:shadow-xl hover:shadow-black/30 hover:border-white/20",
      ].join(" ")}
    >
      {/* Image */}
      {link.imageUrl ? (
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={link.imageUrl}
            alt={link.title || "CTA image"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      ) : null}

      {/* Content */}
      <div className="p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">
              {link.title || "Featured"}
            </h3>

            {link.subtitle ? (
              <p className="mt-1 text-sm text-white/70">{link.subtitle}</p>
            ) : null}
          </div>

          {link.provider ? (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70">
              {link.provider}
            </span>
          ) : null}
        </div>

        {/* Button */}
        <div
  className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition group-hover:opacity-90"
  style={{
    backgroundColor:  "var(--accent-color)",
    color: "black",
  }}
>
  <span>{link.buttonLabel || "Open"}</span>
  <span aria-hidden>→</span>
</div>

      </div>
    </a>
  );
}
