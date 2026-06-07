import { notFound } from "next/navigation";
import { EventDetail } from "@/components/events/event-detail";
import { JsonLdScript } from "@/components/layout/json-ld-script";
import { getEventBySlug, getRelatedGalleryForEvent } from "@/lib/queries";
import { createPageMetadata } from "@/lib/metadata";
import { getSiteBranding } from "@/lib/site-branding";
import { buildEventJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

interface EventDetailPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const [event, branding] = await Promise.all([
    getEventBySlug(params.slug),
    getSiteBranding(),
  ]);
  if (!event) {
    return createPageMetadata("Event Not Found", "Event not found.", {
      siteName: branding.siteName,
    });
  }
  return createPageMetadata(event.title, event.description, {
    siteName: branding.siteName,
    image: event.imageUrl ?? undefined,
    canonical: `${branding.siteUrl}/events/${event.slug}`,
    type: "article",
  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const event = await getEventBySlug(params.slug);

  if (!event) {
    notFound();
  }

  const [branding, galleryItems] = await Promise.all([
    getSiteBranding(),
    getRelatedGalleryForEvent(event.category, 4),
  ]);

  const eventUrl = `${branding.siteUrl}/events/${event.slug}`;
  const jsonLd = buildEventJsonLd({
    title: event.title,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    location: event.location,
    url: eventUrl,
    siteName: branding.siteName,
  });

  return (
    <>
      <JsonLdScript id="event-jsonld" data={jsonLd} />
      <EventDetail
        event={event}
        galleryItems={galleryItems}
        siteName={branding.siteName}
      />
    </>
  );
}
