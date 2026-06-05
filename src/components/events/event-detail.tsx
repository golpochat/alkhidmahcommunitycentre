import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { SerializedEvent } from "@/lib/events";
import { getGalleryCategoryLabel } from "@/lib/gallery";
import { SITE_NAME } from "@/lib/constants";

interface GalleryStripItem {
  id: string;
  title: string | null;
  imageUrl: string;
  category?: string | null;
}

interface EventDetailProps {
  event: SerializedEvent;
  galleryItems?: GalleryStripItem[];
}

export function EventDetail({ event, galleryItems = [] }: EventDetailProps) {
  const endLabel = event.endAt
    ? format(parseISO(event.endAt), "HH:mm")
    : null;

  return (
    <>
      <section className="relative flex min-h-[40vh] items-end overflow-hidden">
        {event.imageUrl && (
          <div className="image-frame image-frame-hero absolute inset-0">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              priority
              className="object-cover brightness-105"
              sizes="100%"
            />
          </div>
        )}
        <div className="section-container relative z-10 py-section">
          <ButtonLink
            href="/events"
            variant="ghost"
            className="mb-6 text-gold hover:text-gold-light"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </ButtonLink>
          {event.category && (
            <Badge className="mb-4 border-gold/30 bg-gold/10 capitalize text-gold">
              {event.category}
            </Badge>
          )}
          <h1 className="heading-display mb-4 text-white">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-neutral-200">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" />
              {format(parseISO(event.startAt), "EEEE, d MMMM yyyy")}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" />
              {format(parseISO(event.startAt), "HH:mm")}
              {endLabel ? ` – ${endLabel}` : ""}
            </span>
            {event.location && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="section-container max-w-3xl">
          <h2 className="heading-section mb-4">About This Event</h2>
          <p className="mb-6 whitespace-pre-line text-muted-foreground">
            {event.description}
          </p>
          <p className="text-sm text-muted-foreground">
            Hosted by {SITE_NAME}. We look forward to welcoming you.
          </p>
        </div>
      </section>

      {galleryItems.length > 0 && (
        <section className="section-padding bg-secondary/30">
          <div className="section-container">
            <h2 className="heading-section mb-6">Gallery</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {galleryItems.map((item) => (
                <Link
                  key={item.id}
                  href="/gallery"
                  className="image-frame-card group relative aspect-square overflow-hidden rounded-lg"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title || "Gallery image"}
                    fill
                    className="image-card-islamic transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mosque-black/80 to-transparent p-3">
                    <p className="font-heading text-sm font-semibold text-white">
                      {item.title || getGalleryCategoryLabel(item.category)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
