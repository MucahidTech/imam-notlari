// Cache service over AsyncStorage with TTL support.
// All keys are namespaced under 'cache:' to avoid collisions.

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache:';

// Default TTL: 7 days.
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Stored shape for every cached entry. */
interface CacheEntry<T> {
  data: T;
  cachedAt: number; // epoch ms
  ttlMs: number;
}

/** Result returned by getCache with freshness metadata. */
export interface CacheReadResult<T> {
  data: T;
  cachedAt: number;
  ageMs: number;
  isStale: boolean;
}

/** Builds the namespaced storage key. */
function buildKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

/** Type guard for parsing unknown JSON safely. */
function isCacheEntry(value: unknown): value is CacheEntry<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return 'data' in v && typeof v.cachedAt === 'number' && typeof v.ttlMs === 'number';
}

/**
 * Reads a cached entry. Returns null if missing or malformed.
 * Does NOT delete stale entries — caller decides what to do.
 */
export async function getCache<T>(key: string): Promise<CacheReadResult<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(buildKey(key));
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isCacheEntry(parsed)) return null;

    const now = Date.now();
    const ageMs = now - parsed.cachedAt;
    const isStale = ageMs > parsed.ttlMs;

    return {
      data: parsed.data as T,
      cachedAt: parsed.cachedAt,
      ageMs,
      isStale,
    };
  } catch {
    // Corrupted cache entries are treated as missing.
    return null;
  }
}

/**
 * Writes a value to the cache with the given TTL.
 * If ttlMs is omitted, the default TTL is used.
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    ttlMs,
  };
  await AsyncStorage.setItem(buildKey(key), JSON.stringify(entry));
}

/** Removes a single cache entry. */
export async function invalidateCache(key: string): Promise<void> {
  await AsyncStorage.removeItem(buildKey(key));
}

/**
 * Removes all cache entries (prefixed with 'cache:').
 * Other AsyncStorage keys are left untouched.
 */
export async function clearAllCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
  if (cacheKeys.length > 0) {
    await AsyncStorage.multiRemove(cacheKeys);
  }
}

/** Returns the age (ms) of a cached entry, or null if missing. */
export async function getCacheAge(key: string): Promise<number | null> {
  const result = await getCache<unknown>(key);
  return result ? result.ageMs : null;
}

/** Exposes the default TTL for callers that want to override it explicitly. */
export const CACHE_DEFAULT_TTL_MS = DEFAULT_TTL_MS;
