"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

type BookingEvent = {
  title: string;
  start: string;
  end?: string;
};

type AvailabilityBlock = {
  id: number;
  start_date: string;
  end_date: string;
  label: string | null;
};

export default function ProfileCalendar({
  bookingEvents = [],
  availabilityBlocks = [],
}: {
  bookingEvents?: BookingEvent[];
  availabilityBlocks?: AvailabilityBlock[];
}) {
  if (bookingEvents.length === 0 && availabilityBlocks.length === 0) return null;

  const blockEvents = availabilityBlocks.map((block) => ({
    title: block.label || "Unavailable",
    start: block.start_date,
    // FullCalendar all-day end dates are exclusive — add 1 day
    end: (() => {
      const d = new Date(block.end_date);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })(),
    display: "background" as const,
    color: "#666666",
  }));

  const allEvents = [...bookingEvents, ...blockEvents];

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
