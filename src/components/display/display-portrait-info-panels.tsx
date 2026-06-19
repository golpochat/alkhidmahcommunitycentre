"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import type { SerializedDisplayNotice } from "@/lib/display-types";
import {
  filterActiveDisplayNotices,
  findActivePriorityNotice,
} from "@/lib/display-notices";
import type { SerializedEvent } from "@/lib/events";

interface DisplayPortraitInfoPanelsProps {
  notices: SerializedDisplayNotice[];
  events: SerializedEvent[];
  rotationSpeed?: number;
  now?: Date | null;
}

type PortraitInfoSlide =
  | {
      key: string;
      kicker: string;
      kickerClass: "display-portrait-panel-kicker-gold";
      title?: string;
      body: string;
      panelClass: "display-portrait-info-panel";
      multiline?: boolean;
    }
  | null;

function formatEventsText(events: SerializedEvent[]) {
  if (!events.length) {
    return "No upcoming events at this time.";
  }

  return events
    .map((event) => {
      const when = format(parseISO(event.startAt), "EEE d MMM · HH:mm");
      const location = event.location ? ` · ${event.location}` : "";
      return `${event.title} — ${when}${location}`;
    })
    .join("\n");
}

function buildPortraitInfoSlides(
  notices: SerializedDisplayNotice[],
  events: SerializedEvent[],
  now: Date
): PortraitInfoSlide[] {
  const slides: NonNullable<PortraitInfoSlide>[] = [];
  const activeNotices = filterActiveDisplayNotices(notices, now);

  for (const notice of activeNotices.filter((item) => item.priority !== "high")) {
    slides.push({
      key: `announcement-${notice.id}`,
      kicker: "Announcements",
      kickerClass: "display-portrait-panel-kicker-gold",
      body: `${notice.title}: ${notice.message}`,
      panelClass: "display-portrait-info-panel",
    });
  }

  if (events.length > 0) {
    slides.push({
      key: "events",
      kicker: "Upcoming Events",
      kickerClass: "display-portrait-panel-kicker-gold",
      body: formatEventsText(events),
      panelClass: "display-portrait-info-panel",
      multiline: true,
    });
  }

  return slides;
}

export function DisplayPortraitInfoPanels({
  notices,
  events,
  rotationSpeed = 10,
  now = null,
}: DisplayPortraitInfoPanelsProps) {
  const effectiveNow = now ?? new Date();
  const priorityNotice = useMemo(
    () => findActivePriorityNotice(notices, effectiveNow),
    [notices, effectiveNow]
  );

  const slides = useMemo(
    () => buildPortraitInfoSlides(notices, events, effectiveNow),
    [notices, events, effectiveNow]
  );
  const slidesKey = useMemo(
    () => slides.map((slide) => slide?.key ?? "").join("|"),
    [slides]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slidesKey]);

  useEffect(() => {
    if (priorityNotice || slides.length <= 1) return;

    const intervalMs = Math.max(5, rotationSpeed) * 1000;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [slides.length, rotationSpeed, slidesKey, priorityNotice]);

  if (priorityNotice) {
    return (
      <section className="display-portrait-info-section" aria-label="Notices and events">
        <article className="display-portrait-info-panel display-portrait-info-panel-emergency">
          <p className="display-portrait-panel-title">{priorityNotice.title}</p>
          <p className="display-portrait-panel-body">{priorityNotice.message}</p>
        </article>
      </section>
    );
  }

  const slide = slides.length ? slides[activeIndex % slides.length] : null;

  return (
    <section className="display-portrait-info-section" aria-label="Notices and events">
      {slide ? (
        <article className={slide.panelClass}>
          <p className={`display-portrait-panel-kicker ${slide.kickerClass}`}>
            {slide.kicker}
          </p>
          {slide.title ? (
            <p className="display-portrait-panel-title">{slide.title}</p>
          ) : null}
          <p
            className={
              slide.multiline
                ? "display-portrait-panel-body display-portrait-panel-body-multiline"
                : "display-portrait-panel-body"
            }
          >
            {slide.body}
          </p>
        </article>
      ) : (
        <article className="display-portrait-info-panel">
          <p className="display-portrait-panel-kicker display-portrait-panel-kicker-gold">
            Announcements
          </p>
          <p className="display-portrait-panel-body">
            No announcements at this time.
          </p>
        </article>
      )}
    </section>
  );
}
