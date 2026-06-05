import { notFound } from "next/navigation";
import { EventDetail } from "@/components/events/event-detail";
import { getEventBySlug, getRelatedGalleryForEvent } from "@/lib/queries";
import { createPageMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const event = await getEventBySlug(params.slug);
  if (!event) {
    return createPageMetadata("Event Not Found", "Event not found.");
  }
  return createPageMetadata(event.title, event.description);
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const event = await getEventBySlug(params.slug);

  if (!event) {
    notFound();
  }

  const galleryItems = await getRelatedGalleryForEvent(event.category, 4);

  return <EventDetail event={event} galleryItems={galleryItems} />;
}
