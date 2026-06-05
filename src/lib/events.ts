export type EventCategoryFilter =
  | "all"
  | "community"
  | "youth"
  | "sisters"
  | "ramadan";

export const EVENT_FILTER_CATEGORIES: {
  value: EventCategoryFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "community", label: "Community" },
  { value: "youth", label: "Youth" },
  { value: "sisters", label: "Sisters" },
  { value: "ramadan", label: "Ramadan" },
];

export const ADMIN_EVENT_CATEGORIES = [
  "community",
  "youth",
  "sisters",
  "ramadan",
  "adult",
  "others",
] as const;

export const ADMIN_EVENT_CATEGORY_OPTIONS: {
  value: (typeof ADMIN_EVENT_CATEGORIES)[number];
  label: string;
}[] = [
  { value: "community", label: "Community" },
  { value: "youth", label: "Youth" },
  { value: "sisters", label: "Sisters" },
  { value: "ramadan", label: "Ramadan" },
  { value: "adult", label: "Adult" },
  { value: "others", label: "Others" },
];

export interface SerializedEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  imageUrl: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function serializeEvent(event: {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string | null;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  imageUrl: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SerializedEvent {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    category: event.category,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    location: event.location,
    imageUrl: event.imageUrl,
    published: event.published,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export function getEventImageUrl(imageUrl: string | null | undefined, fallback: string) {
  return imageUrl || fallback;
}

export function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

export function nowIso() {
  return new Date().toISOString();
}
