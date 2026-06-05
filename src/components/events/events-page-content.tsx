"use client";

import { useState } from "react";
import { PageHero } from "@/components/layout/page-hero";
import { EventFilters } from "@/components/events/event-filters";
import { EventList } from "@/components/events/event-list";
import type { SerializedEvent } from "@/lib/events";
import { IMAGES } from "@/lib/images";
import { SITE_NAME } from "@/lib/constants";

interface EventsPageContentProps {
  events: SerializedEvent[];
}

export function EventsPageContent({ events }: EventsPageContentProps) {
  const [category, setCategory] = useState("all");

  return (
    <>
      <PageHero
        badge="Events"
        title="Community Events"
        description={`Community gatherings, youth programmes, sisters' circles, and Ramadan activities at ${SITE_NAME}.`}
        image={IMAGES.heroes.events}
        imageAlt="Community events at Al Khidmah"
      />

      <section className="section-padding">
        <div className="section-container">
          <div className="mb-8">
            <EventFilters value={category} onChange={setCategory} />
          </div>
          <EventList events={events} category={category} />
        </div>
      </section>
    </>
  );
}
