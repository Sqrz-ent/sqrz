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

  const scrollByCard = (direction: "left" | "right") => {
    if (!scrollerRef.current) return;

    const container = scrollerRef.current;
    const card = container.querySelector<HTMLElement>("[data-cta-card]");
    if (!card) return;

    const gap = 16; // gap-4
    const scrollAmount = card.offsetWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>

        {/* Desktop arrows */}
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scrollByCard("left")}
            className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            onClick={() => scrollByCard("right")}
            className="rounded-full border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      {/* Carousel */}
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
            data-cta-card
            className="snap-start shrink-0 w-[85%] sm:w-[420px]"
          >
            <CtaCard link={link} />
          </div>
        ))}
      </div>
    </div>
  );
}
