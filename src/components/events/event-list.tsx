"use client";

import { useMemo } from "react";
import { EventCard } from "@/components/events/event-card";
import type { SerializedEvent } from "@/lib/events";

interface EventListProps {
  events: SerializedEvent[];
  category: string;
}

export function EventList({ events, category }: EventListProps) {
  const filteredEvents = useMemo(() => {
    const filtered =
      category === "all"
        ? events
        : events.filter(
            (event) => event.category?.toLowerCase() === category.toLowerCase()
          );

    return [...filtered].sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  }, [events, category]);

  if (filteredEvents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">
          No events found for this category. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
