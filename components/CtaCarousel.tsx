"use client";
import React, { useRef, useState, useEffect } from "react";
import CtaCard, { type CtaLink } from "@/components/CtaCard";

type Props = {
  links: CtaLink[];
  title?: string;
};

export default function CtaCarousel({ links, title = "Featured" }: Props) {
  const items = links?.slice(0, 3) ?? [];
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const showArrows = items.length > 1;

  const updateScrollButtons = () => {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;

    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 5);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = scrollerRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  const scrollByAmount = (direction: "left" | "right") => {
    if (!scrollerRef.current) return;

    // scroll by ~1 card width (smaller on mobile)
    const amount = window.innerWidth < 640 ? 340 : 440;

    scrollerRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>

        {/* Desktop arrows only if more than 1 item */}
        {showArrows && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByAmount("left")}
              disabled={!canScrollLeft}
              className="rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#f3b130", color: "black" }}
              aria-label="Scroll left"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => scrollByAmount("right")}
              disabled={!canScrollRight}
              className="rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#f3b130", color: "black" }}
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        )}
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

        {/* LEFT SPACER -> makes first card center */}
        <div className="shrink-0 w-[7.5%] sm:w-0" />

        {items.map((link, idx) => (
          <div
            key={link.id ?? idx}
            className="snap-center shrink-0 w-[85%] sm:w-[420px]"
          >
            <CtaCard link={link} />
          </div>
        ))}

        {/* RIGHT SPACER -> makes last card center */}
        <div className="shrink-0 w-[7.5%] sm:w-0" />
      </div>
    </div>
  );
}
