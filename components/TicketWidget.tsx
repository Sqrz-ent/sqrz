import React from "react";

type TicketLink = {
  label?: string;      // e.g. "Eventim Tickets"
  provider?: string;   // e.g. "eventim"
  url: string;         // external ticket URL
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
        "inline-flex items-center justify-center gap-2",
        "rounded-xl px-4 py-3 font-medium",
        "bg-black text-white hover:opacity-90 transition",
        fullWidth ? "w-full" : "w-auto",
      ].join(" ")}
    >
      <span>🎟️</span>
      <span>{label}</span>
      {ticket.provider && (
        <span className="text-white/60 text-sm">({ticket.provider})</span>
      )}
    </a>
  );
}
