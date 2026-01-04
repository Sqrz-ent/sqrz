"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

type CalendarEvent = {
  title: string;
  start: string;
  end?: string;
};

export default function ProfileCalendar({
  username,
}: {
username: string;
}) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(
`https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/calendar?username=${encodeURIComponent(username)}`
        );

        const data = await res.json();

        const mappedEvents: CalendarEvent[] = data
          // ✅ only confirmed bookings
          .filter((item: any) => item.status === "confirmed")
          // ✅ extract nested job object under key "0"
          .map((item: any) => {
            const job = item["0"];
            if (!job || !job.start) return null;

            const startDate = new Date(job.start);
            const endDate =
              job.end && job.end > 0 ? new Date(job.end) : null;

            return {
              title: job.name || "Confirmed booking",
              start: startDate.toISOString(),
              // FullCalendar expects end to be exclusive
              end: endDate
                ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString()
                : undefined,
            };
          })
          .filter(Boolean); // remove nulls

        setEvents(mappedEvents);
      } catch (err) {
        console.error("Calendar fetch failed", err);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [username]);

  if (loading) {
    return <p style={{ color: "#aaa", marginTop: 24 }}>Loading dates…</p>;
  }

  if (events.length === 0) {
    return (
      <p style={{ color: "#666", marginTop: 24 }}>
        No dates booked via SQRZ
      </p>
    );
  }

  return (
    <div style={{ marginTop: 40 }}>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
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
