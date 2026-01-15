"use client";
import React from "react";

type TicketLink = {
  label?: string; // e.g. "Eventim Tickets"
  provider?: string; // e.g. "eventim"
  url: string; // external ticket URL
};

type Props = {
  ticket: TicketLink;
  fullWidth?: boolean;
};

export default function TicketLinkButton({ ticket, fullWidth = true }: Props) {
  const label = ticket.label || "Get Tickets";

  return (
    <a
      href={ticket.url}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "group relative inline-flex items-center justify-center gap-3",
        "rounded-2xl px-5 py-3.5 font-semibold",
        "bg-gradient-to-b from-zinc-900 to-black text-white",
        "border border-white/10 shadow-lg shadow-black/20",
        "transition-all duration-200",
        "hover:-translate-y-[1px] hover:shadow-xl hover:shadow-black/30 hover:border-white/20",
        "active:translate-y-0 active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        fullWidth ? "w-full" : "w-auto",
      ].join(" ")}
    >
      {/* Icon */}
      <span className="text-lg leading-none">🎟️</span>

      {/* Label */}
      <span className="text-base">{label}</span>

      {/* Provider badge (optional) */}
      {ticket.provider ? (
        <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 border border-white/10 group-hover:bg-white/15 transition">
          {ticket.provider}
        </span>
      ) : null}

      {/* Subtle shine */}
      <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition">
        <span className="absolute -top-10 left-1/3 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      </span>
    </a>
  );
}
