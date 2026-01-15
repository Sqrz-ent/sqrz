"use client";
import React, { useRef, useState } from "react";
import CtaCard, { type CtaLink } from "@/components/CtaCard";

type Props = {
  links: CtaLink[];
  title?: string;
};

export default function CtaCarousel({ links, title = "Featured" }: Props) {
  const items = links?.slice(0, 3) ?? [];
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    startX: 0,
    scrollLeft: 0,
  });

  if (items.length === 0) return null;

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollerRef.current) return;
    setIsDragging(true);
    dragState.current.startX = e.pageX;
    dragState.current.scrollLeft = scrollerRef.current.scrollLeft;
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    if (!scrollerRef.current) return;

    e.preventDefault();
    const dx = e.pageX - dragState.current.startX;
    scrollerRef.current.scrollLeft = dragState.current.scrollLeft - dx;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-white/50 hidden sm:inline">
          Drag → or scroll
        </span>
      </div>

      <div
        ref={scrollerRef}
        className={[
          "flex gap-4 overflow-x-auto pb-2",
          "snap-x snap-mandatory",
          "cursor-grab active:cursor-grabbing",
          "select-none",
          "[-ms-overflow-style:none] [scrollbar-width:none]",
        ].join(" ")}
        style={{
          WebkitOverflowScrolling: "touch",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
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
