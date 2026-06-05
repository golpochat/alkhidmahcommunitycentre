"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminEventsTable } from "@/components/admin/admin-events-table";
import type { SerializedEvent } from "@/lib/events";

export function AdminEventsManager() {
  const [events, setEvents] = useState<SerializedEvent[]>([]);
  const [canDelete, setCanDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const [eventsResponse, sessionResponse] = await Promise.all([
          fetch("/api/events?includePast=true"),
          fetch("/api/auth/session"),
        ]);

        if (eventsResponse.ok) {
          const data = await eventsResponse.json();
          setEvents(Array.isArray(data) ? data : []);
        }

        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          setCanDelete(Boolean(session.canDeleteEvents));
        }
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return <AdminEventsTable events={events} canDelete={canDelete} />;
}
