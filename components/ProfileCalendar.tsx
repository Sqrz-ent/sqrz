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
          `https://xuwq-ib46-ag3b.f2.xano.io/api:ZUfHfBuE/calendar?username=${username}`
        );

        const data = await res.json();

        // Map Xano response → FullCalendar format
        const mappedEvents = data.map((item: any) => ({
          title: item.title || "Confirmed",
          start: item.start || item.date,
          end: item.end,
        }));

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
    return <p style={{ color: "#aaa" }}>Loading dates…</p>;
  }

  if (events.length === 0) {
    return <p style={{ color: "#666" }}>No confirmed dates yet</p>;
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
