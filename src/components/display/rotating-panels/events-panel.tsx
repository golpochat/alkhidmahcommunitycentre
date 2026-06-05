import { format, parseISO } from "date-fns";
import type { SerializedEvent } from "@/lib/events";

interface EventsPanelProps {
  events: SerializedEvent[];
}

export function EventsPanel({ events }: EventsPanelProps) {
  if (!events.length) {
    return (
      <div className="display-rotating-panel display-rotating-panel-empty">
        <h3 className="display-rotating-panel-title">Upcoming Events</h3>
        <p className="display-rotating-panel-empty-text">No upcoming events</p>
      </div>
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
