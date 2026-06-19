import type { CachedAyah } from "@/lib/display-cache";
import type { RotationMessage } from "@/lib/rotation-client";

export type DisplayBottomSlide =
  | {
      kind: "announcement";
      id: string;
      title: string;
      body: string;
      isPriority: boolean;
      durationSeconds: number;
    }
  | {
      kind: "ayat";
      id: string;
      arabic: string;
      english: string;
      source: string;
      durationSeconds: number;
    };

export function buildDisplayBottomSlides(
  messages: RotationMessage[],
  ayat: CachedAyah[],
  options: {
    ayatEnabled: boolean;
    ayatRotationSpeed: number;
  },
): DisplayBottomSlide[] {
  const slides: DisplayBottomSlide[] = messages.map((message) => ({
    kind: "announcement" as const,
    id: message.id,
    title: message.title,
    body: message.body,
    isPriority: message.state === "PRIORITY",
    durationSeconds: message.durationSeconds,
  }));

  const priorityRotationActive = messages.some(
    (message) => message.state === "PRIORITY",
  );

  if (options.ayatEnabled && ayat.length && !priorityRotationActive) {
    const ayatDuration = Math.max(5, options.ayatRotationSpeed);
    slides.push(
      ...ayat.map((item) => ({
        kind: "ayat" as const,
        id: item.id,
        arabic: item.arabic,
        english: item.english,
        source: item.source,
        durationSeconds: ayatDuration,
      })),
    );
  }

  return slides;
}

export function displayBottomSlidesKey(slides: DisplayBottomSlide[]) {
  return slides
    .map((slide) =>
      slide.kind === "announcement"
        ? `m:${slide.id}:${slide.durationSeconds}:${slide.isPriority ? 1 : 0}`
        : `a:${slide.id}:${slide.durationSeconds}`,
    )
    .join("|");
}

export function rotationMessagesKey(
  messages: Pick<
    RotationMessage,
    "id" | "durationSeconds" | "state" | "title" | "body"
  >[],
) {
  return messages
    .map(
      (message) =>
        `${message.id}:${message.durationSeconds}:${message.state}:${message.title}:${message.body}`,
    )
    .join("|");
}

export function displayBottomSlideSourceLabel(slide: DisplayBottomSlide | null) {
  if (!slide) return "Idle";
  if (slide.kind === "ayat") return "Ayat & Hadith rotation";
  return slide.isPriority ? "Priority rotation" : "Non-priority rotation";
}

export function displayBottomSlideTitle(slide: DisplayBottomSlide) {
  return slide.kind === "announcement" ? slide.title : "Ayat & Hadith";
}

export function displayBottomSlideBody(slide: DisplayBottomSlide) {
  if (slide.kind === "announcement") return slide.body;
  return slide.english;
}
