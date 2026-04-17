"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const ACCENT_COLORS: Record<string, string> = {
  midnight: "#F3B130",
  neon: "#A855F7",
  studio: "#38BDF8",
  "dancer-light": "#F3B130",
};

type BookingEvent = {
  title: string | null;
  start: string;
  end?: string;
};

type AvailabilityBlock = {
  id: number;
  start_date: string;
  end_date: string;
  label: string | null;
  show_label?: boolean | null;
};

export default function ProfileCalendar({
  bookingEvents = [],
  availabilityBlocks = [],
  templateId,
}: {
  bookingEvents?: BookingEvent[];
  availabilityBlocks?: AvailabilityBlock[];
  templateId?: string | null;
}) {
  if (bookingEvents.length === 0 && availabilityBlocks.length === 0) return null;

  const accentColor = ACCENT_COLORS[templateId ?? ""] ?? "#F3B130";
  const eventBg = `${accentColor}33`; // ~20% opacity
  const eventBorder = `${accentColor}59`; // ~35% opacity
  const eventText = `${accentColor}b3`; // ~70% opacity

  const mappedBookings = bookingEvents.map((b) => ({
    title: b.title || "Booked",
    start: b.start,
    end: b.end,
    backgroundColor: eventBg,
    borderColor: eventBorder,
    textColor: eventText,
  }));

  const blockEvents = availabilityBlocks.map((block) => ({
    title: block.show_label ? (block.label || "Unavailable") : "Unavailable",
    start: block.start_date,
    // FullCalendar all-day end dates are exclusive — add 1 day
    end: (() => {
      const d = new Date(block.end_date);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })(),
    backgroundColor: eventBg,
    borderColor: eventBorder,
    textColor: eventText,
  }));

  const allEvents = [...mappedBookings, ...blockEvents];

  return (
    <div className="profile-calendar" style={{ marginTop: 40 }}>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={allEvents}
        height="auto"
        headerToolbar={{
          left: "prev,next",
          center: "title",
          right: "",
        }}
      />
    </div>
  );
}
