// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";

import {
  DATA_RATE_WINDOW_MS,
  HEAVY_DATA_LIMIT,
  HEAVY_DATA_PATHS,
  OTHER_DATA_LIMIT,
  dataRateTierForPath,
  isAllowedDataMethod,
} from "./dataRequestGuard";
import { createMemoryRateLimitStore } from "./memoryRateLimit";

describe("dataRequestGuard", () => {
  it("allows GET and HEAD only", () => {
    expect(isAllowedDataMethod("GET")).toBe(true);
    expect(isAllowedDataMethod("HEAD")).toBe(true);
    expect(isAllowedDataMethod("POST")).toBe(false);
  });

  it("tiers heavy index paths tighter than shards", () => {
    const heavy = dataRateTierForPath("/data/arapahoe-pin-to-tag.json");
    expect(heavy.bucket).toBe("heavy");
    expect(heavy.limit).toBe(HEAVY_DATA_LIMIT);
    expect(heavy.windowMs).toBe(DATA_RATE_WINDOW_MS);

    const shard = dataRateTierForPath(
      "/data/arapahoe-parcel-record-by-pin/035662.json",
    );
    expect(shard.bucket).toBe("other");
    expect(shard.limit).toBe(OTHER_DATA_LIMIT);

    expect(HEAVY_DATA_PATHS.has("/data/arapahoe-situs-to-pins.json")).toBe(
      true,
    );
    expect(
      HEAVY_DATA_PATHS.has("/data-engine-v2/arapahoe-pin-to-tag.json"),
    ).toBe(true);
  });
});

describe("createMemoryRateLimitStore", () => {
  it("allows up to the limit then rejects until the window would reset", () => {
    const store = createMemoryRateLimitStore();
    const key = "heavy:203.0.113.9";
    const limit = 3;
    const windowMs = 60_000;

    expect(store.take(key, limit, windowMs).success).toBe(true);
    expect(store.take(key, limit, windowMs).success).toBe(true);
    const third = store.take(key, limit, windowMs);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);

    const blocked = store.take(key, limit, windowMs);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("isolates keys", () => {
    const store = createMemoryRateLimitStore();
    expect(store.take("a", 1, 60_000).success).toBe(true);
    expect(store.take("a", 1, 60_000).success).toBe(false);
    expect(store.take("b", 1, 60_000).success).toBe(true);
  });

  it("fails open for a new key when the map is full rather than resetting others", () => {
    const store = createMemoryRateLimitStore(1);
    expect(store.take("kept", 1, 60_000).success).toBe(true);
    expect(store.take("kept", 1, 60_000).success).toBe(false);
    // New key cannot be tracked; allow the request without eviction.
    expect(store.take("new", 1, 60_000).success).toBe(true);
    // Existing key still at its limit.
    expect(store.take("kept", 1, 60_000).success).toBe(false);
  });
});
