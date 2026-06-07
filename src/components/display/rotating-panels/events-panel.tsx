import { format, parseISO } from "date-fns";
import { DisplayLandscapePanelShell } from "@/components/display/display-landscape-panel-shell";
import type { SerializedEvent } from "@/lib/events";

interface EventsPanelProps {
  events: SerializedEvent[];
  variant?: "default" | "landscape";
}

export function EventsPanel({ events, variant = "default" }: EventsPanelProps) {
  if (!events.length) {
    return (
      <div className="display-rotating-panel display-rotating-panel-empty">
        <h3 className="display-rotating-panel-title">Upcoming Events</h3>
        <p className="display-rotating-panel-empty-text">No upcoming events</p>
      </div>
    );
  }

  if (variant === "landscape") {
    const event = events[0];

    return (
      <DisplayLandscapePanelShell kicker="Upcoming Events">
        <p className="display-landscape-panel-headline">
          <span className="display-landscape-panel-emphasis">{event.title}</span>
          <span className="display-landscape-panel-separator"> · </span>
          <span className="display-landscape-panel-detail">
            {format(parseISO(event.startAt), "EEE d MMM · HH:mm")}
            {event.location ? ` · ${event.location}` : ""}
          </span>
        </p>
      </DisplayLandscapePanelShell>
    );
  }

  return (
    <div className="display-rotating-panel">
      <h3 className="display-rotating-panel-title">Upcoming Events</h3>
      <ul className="display-events-list">
        {events.map((event) => (
          <li key={event.id} className="display-event-item">
            <p className="display-event-date">
              {format(parseISO(event.startAt), "EEE d MMM · HH:mm")}
            </p>
            <p className="display-event-title">{event.title}</p>
            {event.location && (
              <p className="display-event-location">{event.location}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
