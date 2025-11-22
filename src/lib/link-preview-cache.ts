import type { LinkMetadata } from '../types/tauri-commands';

/**
 * Link Preview Cache
 *
 * Implements a two-tier caching system for link metadata:
 * 1. In-memory cache: Fast access, cleared on page reload
 * 2. localStorage cache: Persistent across sessions
 *
 * Features:
 * - LRU (Least Recently Used) eviction with max 50 items
 * - TTL (Time To Live) of 7 days for cached entries
 * - Automatic cleanup of expired entries
 */

const CACHE_KEY_PREFIX = 'link-preview-';
const MAX_CACHE_SIZE = 50;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedLinkMetadata {
  metadata: LinkMetadata;
  timestamp: number;
}

// In-memory cache for fast access
const memoryCache = new Map<string, CachedLinkMetadata>();

/**
 * Get cached link metadata
 * @param url - The URL to get metadata for
 * @returns Cached metadata or null if not found or expired
 */
export function getCachedLinkMetadata(url: string): LinkMetadata | null {
  // Check memory cache first
  const memoryCached = memoryCache.get(url);
  if (memoryCached && !isExpired(memoryCached.timestamp)) {
    return memoryCached.metadata;
  }

  // Check localStorage
  try {
    const cacheKey = CACHE_KEY_PREFIX + url;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const parsed: CachedLinkMetadata = JSON.parse(cached);

      // Check if expired
      if (isExpired(parsed.timestamp)) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Update memory cache
      memoryCache.set(url, parsed);
      return parsed.metadata;
    }
  } catch (error) {
    console.error('Failed to get cached link metadata:', error);
  }

  return null;
}

/**
 * Cache link metadata
 * @param url - The URL to cache metadata for
 * @param metadata - The metadata to cache
 */
export function cacheLinkMetadata(url: string, metadata: LinkMetadata): void {
  const cached: CachedLinkMetadata = {
    metadata,
    timestamp: Date.now(),
  };

  // Update memory cache
  memoryCache.set(url, cached);

  // Enforce LRU eviction for memory cache
  if (memoryCache.size > MAX_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) {
      memoryCache.delete(firstKey);
    }
  }

  // Update localStorage
  try {
    const cacheKey = CACHE_KEY_PREFIX + url;
    localStorage.setItem(cacheKey, JSON.stringify(cached));

    // Cleanup old entries from localStorage
    cleanupExpiredEntries();
  } catch (error) {
    console.error('Failed to cache link metadata:', error);

    // If localStorage is full, try to cleanup and retry
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      cleanupExpiredEntries();
      try {
        const cacheKey = CACHE_KEY_PREFIX + url;
        localStorage.setItem(cacheKey, JSON.stringify(cached));
      } catch (retryError) {
        console.error('Failed to cache after cleanup:', retryError);
      }
    }
  }
}

/**
 * Clear all cached link metadata
 */
export function clearLinkMetadataCache(): void {
  // Clear memory cache
  memoryCache.clear();

  // Clear localStorage cache
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to clear link metadata cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getLinkMetadataCacheStats(): {
  memorySize: number;
  localStorageSize: number;
  oldestEntry: number | null;
} {
  const localStorageKeys: string[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        localStorageKeys.push(key);
      }
    }
  } catch (error) {
    console.error('Failed to get cache stats:', error);
  }

  let oldestEntry: number | null = null;

  if (memoryCache.size > 0) {
    const timestamps = Array.from(memoryCache.values()).map((c) => c.timestamp);
    oldestEntry = Math.min(...timestamps);
  }

  return {
    memorySize: memoryCache.size,
    localStorageSize: localStorageKeys.length,
    oldestEntry,
  };
}

/**
 * Check if a cached entry is expired
 * @param timestamp - The timestamp to check
 * @returns True if expired, false otherwise
 */
function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL_MS;
}

/**
 * Cleanup expired entries from localStorage
 */
function cleanupExpiredEntries(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed: CachedLinkMetadata = JSON.parse(cached);

            if (isExpired(parsed.timestamp)) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Invalid JSON, remove it
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // If still too many entries, remove oldest ones
    const remainingKeys: Array<{ key: string; timestamp: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed: CachedLinkMetadata = JSON.parse(cached);
            remainingKeys.push({ key, timestamp: parsed.timestamp });
          }
        } catch (error) {
          // Ignore
        }
      }
    }

    if (remainingKeys.length > MAX_CACHE_SIZE) {
      // Sort by timestamp (oldest first)
      remainingKeys.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries
      const toRemove = remainingKeys.slice(
        0,
        remainingKeys.length - MAX_CACHE_SIZE
      );
      toRemove.forEach((item) => localStorage.removeItem(item.key));
    }
  } catch (error) {
    console.error('Failed to cleanup expired entries:', error);
  }
}
