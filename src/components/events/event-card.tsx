"use client";

import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SerializedEvent } from "@/lib/events";
import { getEventCardImage } from "@/lib/images";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: SerializedEvent;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const endLabel = event.endAt
    ? format(parseISO(event.endAt), "HH:mm")
    : null;
  const imageSrc = getEventCardImage(event.slug, event.category);

  return (
    <Link href={`/events/${event.slug}`} className={cn("group block h-full", className)}>
      <Card className="h-full overflow-hidden border-border transition-all duration-200 hover:border-gold/40 hover:shadow-card-hover">
        <div className="image-frame-card relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={imageSrc}
            alt={event.title}
            fill
            className="object-cover brightness-105 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100%, 33vw"
          />
          <div className="absolute left-3 top-3">
            {event.category && (
              <Badge className="border-gold/30 bg-mosque-black/80 capitalize text-gold">
                {event.category}
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-gold" />
            {format(parseISO(event.startAt), "EEEE, d MMMM yyyy")}
          </div>
          <h3 className="mb-3 font-heading text-lg font-semibold transition-colors group-hover:text-gold">
            {event.title}
          </h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-gold" />
              {format(parseISO(event.startAt), "HH:mm")}
              {endLabel ? ` – ${endLabel}` : ""}
            </p>
            {event.location && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-gold" />
                {event.location}
              </p>
            )}
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
