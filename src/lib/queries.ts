import "server-only";

import { db } from "@/lib/db";
import { serializeGalleryAlbum, serializeGalleryItem, type SerializedGalleryItem } from "@/lib/gallery";
import { serializeClass, type SerializedClass } from "@/lib/classes";
import {
  serializeEvent,
  type SerializedEvent,
} from "@/lib/events";
import {
  resolveEventImageUrl,
  resolveGalleryImageUrl,
} from "@/lib/images";

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    if (!process.env.DATABASE_URL) return fallback;
    return await fn();
  } catch {
    return fallback;
  }
}

function withFallbackImage(event: SerializedEvent): SerializedEvent {
  return {
    ...event,
    imageUrl: resolveEventImageUrl(event.imageUrl, event.category, event.slug),
  };
}

export async function getUpcomingEvents(limit?: number) {
  return safe(async () => {
    const now = new Date();
    const events = await db.event.findMany({
      where: { startAt: { gte: now }, published: true },
      orderBy: { startAt: "asc" },
      ...(limit ? { take: limit } : {}),
    });

    return events.map((event) => withFallbackImage(serializeEvent(event)));
  }, []);
}

export async function getAllEvents(includePast = true) {
  return safe(async () => {
    const events = await db.event.findMany({
      where: {
        published: true,
        ...(includePast ? {} : { startAt: { gte: new Date() } }),
      },
      orderBy: { startAt: "asc" },
    });

    return events.map((event) => withFallbackImage(serializeEvent(event)));
  }, []);
}

export async function getEventBySlug(slug: string) {
  return safe(async () => {
    const event = await db.event.findFirst({
      where: { slug, published: true },
    });
    if (!event) return null;
    return withFallbackImage(serializeEvent(event));
  }, null);
}

export async function getEventRecordById(id: string) {
  return safe(async () => {
    const event = await db.event.findUnique({ where: { id } });
    if (!event) return null;
    return serializeEvent(event);
  }, null);
}

export async function getEventById(id: string) {
  return safe(async () => {
    const event = await db.event.findUnique({ where: { id } });
    if (!event) return null;
    return withFallbackImage(serializeEvent(event));
  }, null);
}

export async function getRelatedGalleryForEvent(category: string | null, limit = 4) {
  return safe(async () => {
    const items = await db.galleryItem.findMany({
      where: {
        published: true,
        album: { published: true },
        ...(category
          ? { category: { equals: category, mode: "insensitive" } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { album: { select: { id: true, name: true } } },
      take: limit,
    });

    return items.map((item) => {
      const serialized = serializeGalleryItem(item);
      return {
        ...serialized,
        imageUrl: resolveGalleryImageUrl(
          serialized.imageUrl,
          serialized.category,
          serialized.title
        ),
      };
    });
  }, []);
}

export async function getGalleryAlbums() {
  return safe(async () => {
    const albums = await db.galleryAlbum.findMany({
      where: { published: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    });

    return albums.map(serializeGalleryAlbum);
  }, []);
}

export async function getRecentGallery(limit = 8): Promise<SerializedGalleryItem[]> {
  return safe(async () => {
    const items = await db.galleryItem.findMany({
      where: { published: true, album: { published: true } },
      orderBy: { createdAt: "desc" },
      include: { album: { select: { id: true, name: true } } },
      take: limit,
    });

    return items.map((item) => {
      const serialized = serializeGalleryItem(item);
      return {
        ...serialized,
        imageUrl: resolveGalleryImageUrl(
          serialized.imageUrl,
          serialized.category,
          serialized.title
        ),
      };
    });
  }, []);
}

export async function getAllGallery(): Promise<SerializedGalleryItem[]> {
  return safe(async () => {
    const items = await db.galleryItem.findMany({
      where: { published: true, album: { published: true } },
      orderBy: { createdAt: "desc" },
      include: { album: { select: { id: true, name: true } } },
    });

    return items.map((item) => {
      const serialized = serializeGalleryItem(item);
      return {
        ...serialized,
        imageUrl: resolveGalleryImageUrl(
          serialized.imageUrl,
          serialized.category,
          serialized.title
        ),
      };
    });
  }, []);
}

export async function getAllClasses(): Promise<SerializedClass[]> {
  return safe(async () => {
    const classes = await db.class.findMany({
      where: { published: true },
      orderBy: { title: "asc" },
    });

    return classes.map(serializeClass);
  }, []);
}

export async function getFeaturedClasses(limit = 3): Promise<SerializedClass[]> {
  return safe(async () => {
    const classes = await db.class.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return classes.map(serializeClass);
  }, []);
}

export async function getClassBySlug(slug: string): Promise<SerializedClass | null> {
  return safe(async () => {
    const cls = await db.class.findFirst({
      where: { slug, published: true },
    });
    if (!cls) return null;
    return serializeClass(cls);
  }, null);
}

export async function getClassRecordById(id: string): Promise<SerializedClass | null> {
  return safe(async () => {
    const cls = await db.class.findUnique({ where: { id } });
    if (!cls) return null;
    return serializeClass(cls);
  }, null);
}

/** @deprecated Use getAllClasses instead */
export async function getActiveClasses() {
  return getAllClasses();
}

export async function getSettingsMap() {
  return safe(async () => {
    const settings = await db.setting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }, {});
}

/** @deprecated Use getUpcomingEvents instead */
export async function getFeaturedEvents(limit = 3) {
  return getUpcomingEvents(limit);
}

/** @deprecated Use getRecentGallery instead */
export async function getFeaturedGallery(limit = 4) {
  return getRecentGallery(limit);
}
