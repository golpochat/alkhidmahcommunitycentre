import "server-only";

const ALADHAN_FETCH_TIMEOUT_MS = 12_000;
const ALADHAN_MAX_ATTEMPTS = 3;
const ALADHAN_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const responseCache = new Map<string, CacheEntry<unknown>>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCache<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache<T>(key: string, value: T) {
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + ALADHAN_CACHE_TTL_MS,
  });
}

export function isAlAdhanNetworkError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  const cause = error.cause;
  const causeCode =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: string }).code)
      : "";

  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("etimedout") ||
    causeCode === "ENOTFOUND" ||
    causeCode === "ECONNREFUSED" ||
    causeCode === "ETIMEDOUT"
  );
}

export async function fetchAlAdhanJson<T>(
  url: string,
  cacheKey?: string,
  init?: RequestInit
): Promise<T> {
  if (cacheKey) {
    const cached = readCache<T>(cacheKey);
    if (cached) return cached;
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= ALADHAN_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(ALADHAN_FETCH_TIMEOUT_MS),
        next: init?.next ?? { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error(`AlAdhan API request failed (${response.status})`);
      }

      const json = (await response.json()) as T;
      if (cacheKey) {
        writeCache(cacheKey, json);
      }
      return json;
    } catch (error) {
      lastError = error;
      if (attempt < ALADHAN_MAX_ATTEMPTS) {
        await sleep(250 * attempt);
      }
    }
  }

  if (cacheKey) {
    const stale = responseCache.get(cacheKey);
    if (stale) {
      return stale.value as T;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("AlAdhan API request failed");
}
