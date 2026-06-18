"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { EventsPanel } from "@/components/display/rotating-panels/events-panel";
import { WeatherPanel } from "@/components/display/rotating-panels/weather-panel";
import type { CachedAyah } from "@/lib/display-cache";
import {
  filterActiveDisplayNotices,
} from "@/lib/display-notices";
import type { SerializedDisplayNotice, WeatherPayload } from "@/lib/display-types";
import type { SerializedEvent } from "@/lib/events";

interface DisplayRotatingContentProps {
  enabledPanels: string[];
  rotationSpeed: number;
  notices: SerializedDisplayNotice[];
  events: SerializedEvent[];
  ayat: CachedAyah[];
  weather: WeatherPayload;
  now?: Date | null;
  variant?: "default" | "landscape";
  excludePanels?: string[];
}

interface DisplaySlide {
  key: string;
  node: ReactNode;
}

function formatEventsBody(events: SerializedEvent[]) {
  if (!events.length) return "No upcoming events at this time.";

  return events
    .map((event) => {
      const when = format(parseISO(event.startAt), "EEE d MMM · HH:mm");
      const location = event.location ? ` · ${event.location}` : "";
      return `${event.title} — ${when}${location}`;
    })
    .join("\n");
}

function PortraitSlide({
  kicker,
  body,
  multiline = false,
}: {
  kicker: string;
  body: string;
  multiline?: boolean;
}) {
  return (
    <article className="display-portrait-info-panel">
      <p className="display-portrait-panel-kicker display-portrait-panel-kicker-gold">
        {kicker}
      </p>
      <p
        className={
          multiline
            ? "display-portrait-panel-body display-portrait-panel-body-multiline"
            : "display-portrait-panel-body"
        }
      >
        {body}
      </p>
    </article>
  );
}

function LandscapeNoticeSlide({ notice }: { notice: SerializedDisplayNotice }) {
  return (
    <article className="display-landscape-announcement-block">
      <p className="display-landscape-announcement-title">{notice.title}</p>
      <p className="display-landscape-announcement-message">{notice.message}</p>
    </article>
  );
}

function buildDisplaySlides({
  enabledPanels,
  notices,
  events,
  ayat,
  weather,
  now,
  variant,
  excludePanels,
}: Omit<DisplayRotatingContentProps, "rotationSpeed"> & {
  now: Date;
}): DisplaySlide[] {
  const panels = enabledPanels.filter((panel) => !excludePanels?.includes(panel));
  const slides: DisplaySlide[] = [];
  const activeNotices = filterActiveDisplayNotices(notices, now).filter(
    (notice) => notice.priority !== "high",
  );

  if (panels.includes("announcements") && activeNotices.length > 0) {
    for (const notice of activeNotices) {
      slides.push({
        key: `announcement-${notice.id}`,
        node:
          variant === "landscape" ? (
            <LandscapeNoticeSlide notice={notice} />
          ) : (
            <PortraitSlide
              kicker="Announcements"
              body={`${notice.title}: ${notice.message}`}
            />
          ),
      });
    }
  }

  if (panels.includes("events") && events.length > 0) {
    slides.push({
      key: "events",
      node:
        variant === "landscape" ? (
          <article className="display-landscape-announcement-block">
            <p className="display-landscape-announcement-title">Upcoming Events</p>
            <p
              className={
                events.length > 0
                  ? "display-landscape-announcement-message display-landscape-announcement-message-multiline"
                  : "display-landscape-announcement-message"
              }
            >
              {formatEventsBody(events)}
            </p>
          </article>
        ) : (
          <EventsPanel events={events} variant="default" />
        ),
    });
  }

  if (panels.includes("ayat") && ayat.length > 0) {
    for (const ayah of ayat) {
      slides.push({
        key: `ayah-${ayah.id}`,
        node:
          variant === "landscape" ? (
            <article className="display-landscape-announcement-block">
              <p className="display-landscape-announcement-title">
                Ayat &amp; Hadith
              </p>
              <p
                className="display-landscape-announcement-message"
                dir="rtl"
              >
                {ayah.arabic}
              </p>
              <p className="display-landscape-announcement-message">
                {ayah.english}
              </p>
              <p className="display-landscape-announcement-message display-landscape-announcement-message-muted">
                {ayah.source}
              </p>
            </article>
          ) : (
            <article className="display-portrait-info-panel">
              <p className="display-portrait-panel-kicker display-portrait-panel-kicker-gold">
                Ayat &amp; Hadith
              </p>
              <p className="display-portrait-panel-body" dir="rtl">
                {ayah.arabic}
              </p>
              <p className="display-portrait-panel-body">{ayah.english}</p>
              <p className="display-portrait-panel-body display-portrait-panel-body-muted">
                {ayah.source}
              </p>
            </article>
          ),
      });
    }
  }

  if (panels.includes("weather")) {
    slides.push({
      key: "weather",
      node: <WeatherPanel weather={weather} />,
    });
  }

  return slides;
}

export function DisplayRotatingContent({
  enabledPanels,
  rotationSpeed,
  notices,
  events,
  ayat,
  weather,
  now = null,
  variant = "default",
  excludePanels = [],
}: DisplayRotatingContentProps) {
  const effectiveNow = now ?? new Date();

  const slides = useMemo(
    () =>
      buildDisplaySlides({
        enabledPanels,
        notices,
        events,
        ayat,
        weather,
        now: effectiveNow,
        variant,
        excludePanels,
      }),
    [
      enabledPanels,
      notices,
      events,
      ayat,
      weather,
      effectiveNow,
      variant,
      excludePanels,
    ],
  );

  const slidesKey = useMemo(
    () => slides.map((slide) => slide.key).join("|"),
    [slides],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setActiveIndex(0);
  }, [slidesKey]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const intervalMs = Math.max(5, rotationSpeed) * 1000;
    const interval = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setActiveIndex((current) => (current + 1) % slides.length);
        setVisible(true);
      }, 500);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [slides.length, rotationSpeed, slidesKey]);

  if (!slides.length) return null;

  const activeSlide = slides[activeIndex % slides.length];
  const sectionClass =
    variant === "landscape"
      ? "display-rotating-panels display-rotating-panels-landscape"
      : "display-portrait-info-section display-rotating-panels";

  return (
    <section className={sectionClass} aria-label="Rotating display content">
      <div
        className={`display-rotating-panels-inner${visible ? " display-rotating-panels-visible" : " display-rotating-panels-hidden"}`}
      >
        {activeSlide.node}
      </div>
      {slides.length > 1 ? (
        <div className="display-rotating-panels-dots">
          {slides.map((slide, index) => (
            <span
              key={slide.key}
              className={`display-rotating-panels-dot${index === activeIndex ? " display-rotating-panels-dot-active" : ""}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
