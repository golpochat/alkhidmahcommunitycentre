"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CachedAyah } from "@/lib/display-cache";
import {
  buildDisplayBottomSlides,
  displayBottomSlideBody,
  displayBottomSlidesKey,
  displayBottomSlideSourceLabel,
  displayBottomSlideTitle,
  type DisplayBottomSlide,
} from "@/lib/display-bottom-slides";
import {
  isMessageRotationEligible,
  sortMessagesByOrder,
} from "@/lib/message-client";
import type { SerializedMessage } from "@/lib/message-types";

interface AdminMessageEnginePanelProps {
  messages: SerializedMessage[];
  rotationQueue: SerializedMessage[];
  ayat: CachedAyah[];
  ayatEnabled: boolean;
  announcementsEnabled: boolean;
  rotationSpeed: number;
}

interface PlaybackState {
  index: number;
  secondsRemaining: number;
}

function slideQueueLabel(slide: DisplayBottomSlide) {
  if (slide.kind === "ayat") {
    return `Ayat · ${slide.durationSeconds}s`;
  }

  return `${slide.durationSeconds}s · ${slide.isPriority ? "Priority" : "Non-priority"}`;
}

export function AdminMessageEnginePanel({
  messages,
  rotationQueue,
  ayat,
  ayatEnabled,
  announcementsEnabled,
  rotationSpeed,
}: AdminMessageEnginePanelProps) {
  const [now, setNow] = useState(() => new Date());
  const orderedQueue = useMemo(
    () => sortMessagesByOrder(rotationQueue),
    [rotationQueue],
  );
  const slides = useMemo(
    () =>
      buildDisplayBottomSlides(
        announcementsEnabled ? orderedQueue : [],
        ayat,
        {
          ayatEnabled,
          ayatRotationSpeed: rotationSpeed,
        },
      ),
    [announcementsEnabled, orderedQueue, ayat, ayatEnabled, rotationSpeed],
  );
  const slidesKey = displayBottomSlidesKey(slides);
  const slidesRef = useRef(slides);
  const [playback, setPlayback] = useState<PlaybackState>({
    index: 0,
    secondsRemaining: 0,
  });

  slidesRef.current = slides;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!slides.length) {
      setPlayback({ index: 0, secondsRemaining: 0 });
      return;
    }

    setPlayback({
      index: 0,
      secondsRemaining: slides[0].durationSeconds,
    });
  }, [slidesKey, slides.length]);

  useEffect(() => {
    if (!slidesKey) return;

    const timer = setInterval(() => {
      setPlayback((current) => {
        const queue = slidesRef.current;
        const activeSlide = queue[current.index];
        if (!activeSlide) {
          return { index: 0, secondsRemaining: 0 };
        }

        if (current.secondsRemaining > 1) {
          return {
            ...current,
            secondsRemaining: current.secondsRemaining - 1,
          };
        }

        const nextIndex =
          queue.length <= 1 ? current.index : (current.index + 1) % queue.length;
        const nextSlide = queue[nextIndex];

        return {
          index: nextIndex,
          secondsRemaining: nextSlide?.durationSeconds ?? 0,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [slidesKey]);

  const validPriorityCount = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.state === "PRIORITY" && isMessageRotationEligible(message, now),
      ).length,
    [messages, now],
  );

  const validNonPriorityCount = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.state === "NON_PRIORITY" &&
          isMessageRotationEligible(message, now),
      ).length,
    [messages, now],
  );

  const currentSlide = slides[playback.index] ?? null;

  return (
    <section className="admin-messages-panel admin-messages-panel-engine">
      <header className="admin-messages-panel-header">
        <h2 className="admin-messages-panel-title">Live engine view</h2>
        <p className="admin-messages-panel-description">
          Simulated bottom-panel playback using the same message queue, ayat
          entries, and durations as the TV display.
        </p>
      </header>

      <div className="admin-messages-engine-layout">
        <article className="admin-messages-engine-block admin-messages-engine-block-now">
          <h3 className="admin-messages-engine-block-title">What&apos;s on TV now?</h3>
          {currentSlide ? (
            <>
              <p className="admin-messages-engine-now-title">
                {displayBottomSlideTitle(currentSlide)}
              </p>
              <p className="admin-messages-engine-now-snippet">
                {displayBottomSlideBody(currentSlide)}
              </p>
              <p className="admin-messages-engine-source">
                Source: {displayBottomSlideSourceLabel(currentSlide)}
              </p>
              <p className="admin-messages-engine-timer">
                Time remaining: {playback.secondsRemaining}s
              </p>
            </>
          ) : (
            <>
              <p className="admin-messages-engine-now-title">Nothing to show</p>
              <p className="admin-messages-engine-now-snippet">
                Enable announcements and/or Ayat &amp; Hadith under Screen Setup,
                and make sure at least one item is eligible to display.
              </p>
            </>
          )}
        </article>

        <article className="admin-messages-engine-block admin-messages-engine-block-table">
          <h3 className="admin-messages-engine-block-title">Current rotation queue</h3>
          <div className="admin-messages-table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="admin-table-col-order">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="admin-table-col-hide-md">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="admin-messages-table-empty">
                      Queue is empty.
                    </TableCell>
                  </TableRow>
                ) : (
                  slides.map((slide, index) => (
                    <TableRow
                      key={`${slide.kind}-${slide.id}`}
                      className={
                        index === playback.index
                          ? "admin-messages-engine-queue-row-active"
                          : undefined
                      }
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="admin-messages-table-title">
                        {displayBottomSlideTitle(slide)}
                      </TableCell>
                      <TableCell>{slide.durationSeconds}s</TableCell>
                      <TableCell className="admin-table-col-hide-md">
                        {slideQueueLabel(slide)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </article>

        <article className="admin-messages-engine-block admin-messages-engine-block-table">
          <h3 className="admin-messages-engine-block-title">System state</h3>
          <div className="admin-messages-table-wrap">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="admin-messages-engine-stat-label">
                    Priority messages valid now
                  </TableCell>
                  <TableCell className="admin-messages-engine-stat-value">
                    {validPriorityCount}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="admin-messages-engine-stat-label">
                    Non-priority messages valid now
                  </TableCell>
                  <TableCell className="admin-messages-engine-stat-value">
                    {validNonPriorityCount}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="admin-messages-engine-stat-label">
                    Ayat &amp; Hadith rotation
                  </TableCell>
                  <TableCell>
                    <Badge variant={ayatEnabled ? "default" : "secondary"}>
                      {ayatEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </article>
      </div>
    </section>
  );
}
