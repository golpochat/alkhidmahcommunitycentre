import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { EventCard } from "@/components/events/event-card";
import { getUpcomingEvents } from "@/lib/queries";

export async function EventsPreview() {
  const upcomingEvents = await getUpcomingEvents(3);

  if (upcomingEvents.length === 0) {
    return null;
  }

  return (
    <section className="section-padding">
      <div className="section-container">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="outline" className="mb-4 border-emerald text-emerald">
              Upcoming Events
            </Badge>
            <h2 className="heading-section">Community Events</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Join community gatherings, youth programmes, and special
              programmes at the centre.
            </p>
          </div>
          <ButtonLink
            href="/events"
            variant="outline"
            className="border-gold text-gold hover:bg-gold hover:text-mosque-black"
          >
            View All Events
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
