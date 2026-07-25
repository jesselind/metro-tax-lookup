// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Fixed-window in-memory rate limiter for serverless / proxy isolates.
 *
 * Counters are per process (or Edge isolate), not global across Vercel
 * regions. That still slows single-IP floods hitting one instance; for
 * durable cross-region limits, add a shared store (e.g. Upstash Redis).
 */

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the window resets. */
  resetAt: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_MAX_KEYS = 10_000;

export type MemoryRateLimitStore = {
  take: (
    key: string,
    limit: number,
    windowMs: number,
  ) => RateLimitResult;
  /** Test helper to reset isolate state between cases. */
  clear: () => void;
};

function pruneExpired(store: Map<string, Bucket>, now: number): void {
  for (const [key, bucket] of store) {
    if (now >= bucket.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Create an isolated store (unit tests) or reuse the shared module store.
 */
export function createMemoryRateLimitStore(
  maxKeys: number = DEFAULT_MAX_KEYS,
): MemoryRateLimitStore {
  const buckets = new Map<string, Bucket>();
  let opsSincePrune = 0;

  return {
    take(key, limit, windowMs) {
      const now = Date.now();
      opsSincePrune += 1;
      if (opsSincePrune >= 64) {
        opsSincePrune = 0;
        pruneExpired(buckets, now);
      }

      let bucket = buckets.get(key);
      if (!bucket || now >= bucket.resetAt) {
        if (!bucket && buckets.size >= maxKeys) {
          pruneExpired(buckets, now);
          if (buckets.size >= maxKeys) {
            // Map full under key flood: fail open for this request rather than
            // evicting an active client's bucket (which would reset their count).
            return {
              success: true,
              limit,
              remaining: limit,
              resetAt: now + windowMs,
            };
          }
        }
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
      }

      bucket.count += 1;
      const remaining = Math.max(0, limit - bucket.count);
      return {
        success: bucket.count <= limit,
        limit,
        remaining,
        resetAt: bucket.resetAt,
      };
    },
    clear() {
      buckets.clear();
      opsSincePrune = 0;
    },
  };
}

/** Process-local store used by `proxy.ts`. */
export const sharedMemoryRateLimit = createMemoryRateLimitStore();
