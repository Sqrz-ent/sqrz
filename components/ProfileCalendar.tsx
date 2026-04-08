"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const EVENT_BG = "rgba(243, 177, 48, 0.2)";
const EVENT_BORDER = "rgba(243, 177, 48, 0.35)";
const EVENT_TEXT = "rgba(243, 177, 48, 0.7)";

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
}: {
  bookingEvents?: BookingEvent[];
  availabilityBlocks?: AvailabilityBlock[];
}) {
  if (bookingEvents.length === 0 && availabilityBlocks.length === 0) return null;

  const mappedBookings = bookingEvents.map((b) => ({
    title: b.title || "Booked",
    start: b.start,
    end: b.end,
    backgroundColor: EVENT_BG,
    borderColor: EVENT_BORDER,
    textColor: EVENT_TEXT,
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
    backgroundColor: EVENT_BG,
    borderColor: EVENT_BORDER,
    textColor: EVENT_TEXT,
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
