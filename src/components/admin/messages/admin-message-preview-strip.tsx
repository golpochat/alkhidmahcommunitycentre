"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CachedAyah } from "@/lib/display-cache";
import {
  buildDisplayBottomSlides,
  displayBottomSlideBody,
  displayBottomSlidesKey,
  displayBottomSlideTitle,
} from "@/lib/display-bottom-slides";
import { sortMessagesByOrder } from "@/lib/message-client";
import type { SerializedMessage } from "@/lib/message-types";

interface AdminMessagePreviewStripProps {
  messages: SerializedMessage[];
  rotationQueue: SerializedMessage[];
  ayat: CachedAyah[];
  rotationSpeed: number;
}

interface PlaybackState {
  index: number;
  secondsRemaining: number;
}

export function AdminMessagePreviewStrip({
  messages,
  rotationQueue,
  ayat,
  rotationSpeed,
}: AdminMessagePreviewStripProps) {
  const orderedQueue = useMemo(
    () => sortMessagesByOrder(rotationQueue),
    [rotationQueue],
  );
  const slides = useMemo(
    () =>
      buildDisplayBottomSlides(orderedQueue, ayat, {
        ayatEnabled: true,
        ayatRotationSpeed: rotationSpeed,
      }),
    [orderedQueue, ayat, rotationSpeed],
  );
  const slidesKey = displayBottomSlidesKey(slides);
  const slidesRef = useRef(slides);
  const [playback, setPlayback] = useState<PlaybackState>({
    index: 0,
    secondsRemaining: 0,
  });

  slidesRef.current = slides;

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

  const currentSlide = slides[playback.index] ?? null;
  const nextSlide =
    slides.length > 1 ? slides[(playback.index + 1) % slides.length] : null;
  const liveCount = messages.filter((message) =>
    rotationQueue.some((item) => item.id === message.id),
  ).length;

  return (
    <section className="admin-display-preview-strip" aria-live="polite">
      <div className="admin-display-preview-strip-main">
        <p className="admin-display-preview-strip-label">On TV now</p>
        {currentSlide ? (
          <>
            <p className="admin-display-preview-strip-title">
              {displayBottomSlideTitle(currentSlide)}
            </p>
            <p className="admin-display-preview-strip-body">
              {displayBottomSlideBody(currentSlide)}
            </p>
          </>
        ) : (
          <p className="admin-display-preview-strip-empty">
            Nothing in rotation — add a message or ayat entry above.
          </p>
        )}
      </div>

      <div className="admin-display-preview-strip-meta">
        {currentSlide ? (
          <p>
            <strong>{playback.secondsRemaining}s</strong> remaining
          </p>
        ) : null}
        {nextSlide ? (
          <p>
            Next: <span>{displayBottomSlideTitle(nextSlide)}</span>
          </p>
        ) : null}
        <p>
          Queue: <strong>{slides.length}</strong> item
          {slides.length === 1 ? "" : "s"}
          {liveCount > 0
            ? ` · ${liveCount} message${liveCount === 1 ? "" : "s"} live`
            : ""}
        </p>
      </div>
    </section>
  );
}
