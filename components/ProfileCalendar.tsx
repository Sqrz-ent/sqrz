"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { supabase } from "@/lib/supabase";

type CalendarEvent = {
  title: string;
  start: string;
  end?: string;
  color?: string;
  textColor?: string;
};

type AvailabilityBlock = {
  id: number;
  start_date: string;
  end_date: string;
  label: string | null;
};

export default function ProfileCalendar({
  username,
  availabilityBlocks = [],
}: {
  username: string;
  availabilityBlocks?: AvailabilityBlock[];
}) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        // Resolve profile id from slug
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("slug", username)
          .single();

        if (!profile) return;

        // Fetch confirmed bookings for this profile
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id, title, event_date, event_date_end, status")
          .eq("owner_id", profile.id)
          .eq("status", "confirmed");

        const mapped: CalendarEvent[] = (bookings ?? [])
          .filter((b) => b.event_date)
          .map((b) => ({
            title: b.title || "Confirmed booking",
            start: b.event_date,
            end: b.event_date_end ?? undefined,
          }));

        // Add availability blocks as grey background events
        const blockEvents: CalendarEvent[] = availabilityBlocks.map((block) => ({
          title: block.label || "Unavailable",
          start: block.start_date,
          // FullCalendar end dates for all-day events are exclusive, add 1 day
          end: (() => {
            const d = new Date(block.end_date);
            d.setDate(d.getDate() + 1);
            return d.toISOString().slice(0, 10);
          })(),
          color: "#555555",
          textColor: "#aaaaaa",
        }));

        setEvents([...mapped, ...blockEvents]);
      } catch (err) {
        console.error("Calendar fetch failed", err);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  if (loading) return <p className="text-muted mt-6">Loading dates…</p>;
  if (events.length === 0) return null;

  return (
    <div className="profile-calendar" style={{ marginTop: 40 }}>
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
