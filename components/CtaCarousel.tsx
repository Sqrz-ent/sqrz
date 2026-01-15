"use client";
import React, { useRef } from "react";
import CtaCard, { type CtaLink } from "@/components/CtaCard";

type Props = {
  links: CtaLink[];
  title?: string;
};

export default function CtaCarousel({ links, title = "Featured" }: Props) {
  const items = links?.slice(0, 3) ?? [];
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (items.length === 0) return null;

  const scrollByAmount = (direction: "left" | "right") => {
    if (!scrollerRef.current) return;

    // scroll by ~1 card (card width + gap)
    const amount = 440;
    scrollerRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>

        {/* Desktop arrows */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10 transition"
            aria-label="Scroll left"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10 transition"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className={[
          "flex gap-4 overflow-x-auto pb-2",
          "snap-x snap-mandatory",
          "[-ms-overflow-style:none] [scrollbar-width:none]",
        ].join(" ")}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* hide scrollbar (webkit) */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {items.map((link, idx) => (
          <div
            key={link.id ?? idx}
            className="snap-start shrink-0 w-[85%] sm:w-[420px]"
          >
            <CtaCard link={link} />
          </div>
        ))}
      </div>
    </div>
  );
}
