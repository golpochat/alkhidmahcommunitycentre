"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CachedAyah } from "@/lib/display-cache";
import {
  buildDisplayBottomSlides,
  displayBottomSlidesKey,
  type DisplayBottomSlide,
} from "@/lib/display-bottom-slides";
import type { RotationMessage } from "@/lib/rotation-client";

interface RotationContainerProps {
  messages: RotationMessage[];
  ayat?: CachedAyah[];
  ayatEnabled?: boolean;
  ayatRotationSpeed?: number;
  variant?: "default" | "landscape";
  fillStage?: boolean;
}

const ROTATION_FADE_MS = 500;

function PortraitAnnouncementSlide({
  title,
  body,
  isPriority,
}: {
  title: string;
  body: string;
  isPriority: boolean;
}) {
  return (
    <article
      className={`display-portrait-info-panel${isPriority ? " display-portrait-info-panel-emergency" : ""}`}
    >
      {!isPriority ? (
        <p className="display-portrait-panel-kicker display-portrait-panel-kicker-gold">
          Announcements
        </p>
      ) : null}
      {isPriority ? (
        <>
          <p className="display-portrait-panel-title">{title}</p>
          <p className="display-portrait-panel-body">{body}</p>
        </>
      ) : (
        <p className="display-portrait-panel-body">{`${title}: ${body}`}</p>
      )}
    </article>
  );
}

function LandscapeAnnouncementSlide({
  title,
  body,
  isPriority,
}: {
  title: string;
  body: string;
  isPriority: boolean;
}) {
  return (
    <article
      className={`display-landscape-announcement-block${isPriority ? " display-landscape-announcement-priority" : ""}`}
    >
      {!isPriority ? (
        <p className="display-landscape-announcement-kicker display-landscape-announcement-kicker-gold">
          Announcements
        </p>
      ) : null}
      <p className="display-landscape-announcement-title">{title}</p>
      <p className="display-landscape-announcement-message">{body}</p>
    </article>
  );
}

function PortraitAyatSlide({
  arabic,
  english,
  source,
}: {
  arabic: string;
  english: string;
  source: string;
}) {
  return (
    <article className="display-portrait-info-panel">
      <p className="display-portrait-panel-kicker display-portrait-panel-kicker-gold">
        Ayat &amp; Hadith
      </p>
      <p className="display-portrait-panel-body" dir="rtl">
        {arabic}
      </p>
      <p className="display-portrait-panel-body">{english}</p>
      <p className="display-portrait-panel-body display-portrait-panel-body-muted">
        {source}
      </p>
    </article>
  );
}

function LandscapeAyatSlide({
  arabic,
  english,
  source,
}: {
  arabic: string;
  english: string;
  source: string;
}) {
  return (
    <article className="display-landscape-announcement-block">
      <p className="display-landscape-announcement-title">Ayat &amp; Hadith</p>
      <p className="display-landscape-announcement-message" dir="rtl">
        {arabic}
      </p>
      <p className="display-landscape-announcement-message">{english}</p>
      <p className="display-landscape-announcement-message display-landscape-announcement-message-muted">
        {source}
      </p>
    </article>
  );
}

function renderSlide(slide: DisplayBottomSlide, variant: "default" | "landscape") {
  if (slide.kind === "announcement") {
    return variant === "landscape" ? (
      <LandscapeAnnouncementSlide
        title={slide.title}
        body={slide.body}
        isPriority={slide.isPriority}
      />
    ) : (
      <PortraitAnnouncementSlide
        title={slide.title}
        body={slide.body}
        isPriority={slide.isPriority}
      />
    );
  }

  return variant === "landscape" ? (
    <LandscapeAyatSlide
      arabic={slide.arabic}
      english={slide.english}
      source={slide.source}
    />
  ) : (
    <PortraitAyatSlide
      arabic={slide.arabic}
      english={slide.english}
      source={slide.source}
    />
  );
}

export function RotationContainer({
  messages,
  ayat = [],
  ayatEnabled = false,
  ayatRotationSpeed = 15,
  variant = "default",
  fillStage = false,
}: RotationContainerProps) {
  const slides = useMemo(
    () =>
      buildDisplayBottomSlides(messages, ayat, {
        ayatEnabled,
        ayatRotationSpeed,
      }),
    [messages, ayat, ayatEnabled, ayatRotationSpeed],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const slidesRef = useRef(slides);
  const fadeTimeoutRef = useRef<number | null>(null);
  const slidesKey = displayBottomSlidesKey(slides);

  slidesRef.current = slides;

  useEffect(() => {
    setCurrentIndex(0);
    setVisible(true);
  }, [slidesKey]);

  useEffect(() => {
    if (!slidesKey) return;

    const currentSlide = slidesRef.current[currentIndex];
    if (!currentSlide) return;

    const holdTimeout = window.setTimeout(() => {
      setVisible(false);

      fadeTimeoutRef.current = window.setTimeout(() => {
        fadeTimeoutRef.current = null;
        setCurrentIndex((index) => {
          const count = slidesRef.current.length;
          if (count <= 1) return index;
          return index === count - 1 ? 0 : index + 1;
        });
        setVisible(true);
      }, ROTATION_FADE_MS);
    }, currentSlide.durationSeconds * 1000);

    return () => {
      window.clearTimeout(holdTimeout);
      if (fadeTimeoutRef.current != null) {
        window.clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
    };
  }, [currentIndex, slidesKey]);

  if (!slides.length) {
    return null;
  }

  const activeSlide = slides[currentIndex % slides.length];
  const isLandscape = variant === "landscape";
  const sectionClass = isLandscape
    ? `display-rotating-panels display-rotating-panels-landscape${fillStage ? " display-rotating-panels-stage" : ""}`
    : "display-portrait-info-section display-rotating-panels";

  const dots =
    slides.length > 1 ? (
      <div className="display-rotating-panels-dots">
        {slides.map((slide, index) => (
          <span
            key={`${slide.kind}-${slide.id}-${index}`}
            className={`display-rotating-panels-dot${index === currentIndex ? " display-rotating-panels-dot-active" : ""}`}
            aria-hidden={index !== currentIndex}
          />
        ))}
      </div>
    ) : null;

  return (
    <section className={sectionClass} aria-label="Rotating display content">
      {isLandscape && !fillStage ? dots : null}
      <div
        className={`display-rotating-panels-inner${visible ? " display-rotating-panels-visible" : " display-rotating-panels-hidden"}`}
      >
        {renderSlide(activeSlide, variant)}
      </div>
      {isLandscape && fillStage ? dots : null}
      {!isLandscape ? dots : null}
    </section>
  );
}
