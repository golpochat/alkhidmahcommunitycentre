import type { AyahRotation } from "@prisma/client";

export interface CachedAyah {
  id: string;
  arabic: string;
  english: string;
  source: string;
}

let ayatCache: CachedAyah[] = [];
let ayatCacheUpdatedAt = 0;
let ayatRotationIndex = 0;

export function setAyatCache(items: AyahRotation[]) {
  ayatCache = items.map((item) => ({
    id: item.id,
    arabic: item.arabic,
    english: item.english,
    source: item.source,
  }));
  ayatCacheUpdatedAt = Date.now();
  ayatRotationIndex = 0;
}

export function getAyatCache(): CachedAyah[] {
  return ayatCache;
}

export function getAyatCacheUpdatedAt() {
  return ayatCacheUpdatedAt;
}

export function getRotatingAyah(): CachedAyah | null {
  if (!ayatCache.length) return null;
  const ayah = ayatCache[ayatRotationIndex % ayatCache.length];
  ayatRotationIndex = (ayatRotationIndex + 1) % ayatCache.length;
  return ayah;
}

export function getAllRotatingAyat(): CachedAyah[] {
  return ayatCache;
}
