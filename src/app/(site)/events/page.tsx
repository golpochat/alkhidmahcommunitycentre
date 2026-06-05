import { EventsPageContent } from "@/components/events/events-page-content";
import { getAllEvents } from "@/lib/queries";
import { createPageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata(
  "Events",
  `View upcoming community, youth, sisters, and Ramadan events at ${SITE_NAME}.`
);

export default async function EventsPage() {
  const events = await getAllEvents(true);
  return <EventsPageContent events={events} />;
}
