// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  lookupParcelRecordRow,
  PARCEL_RECORD_SHARD_PREFIX_LENGTH,
  parcelRecordShardPrefixes,
  parcelRecordShardUrl,
  pinLookupCandidates,
} from "./arapahoeParcelLevyData";

describe("parcelRecordShardPrefixes", () => {
  it("uses the first five digits of a normalized 9-digit PIN", () => {
    expect(parcelRecordShardPrefixes("032490811")).toEqual(["03249"]);
    expect(parcelRecordShardPrefixes("32490811")).toEqual(["03249"]);
  });

  it("returns unique prefixes when first and last nine digits differ", () => {
    const noisy = "123032490811999";
    const candidates = pinLookupCandidates(noisy);
    const prefixes = parcelRecordShardPrefixes(noisy);
    expect(candidates.length).toBeGreaterThan(1);
    expect(prefixes).toEqual([
      candidates[0].slice(0, PARCEL_RECORD_SHARD_PREFIX_LENGTH),
      candidates[1].slice(0, PARCEL_RECORD_SHARD_PREFIX_LENGTH),
    ]);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it("returns empty for non-numeric input", () => {
    expect(parcelRecordShardPrefixes("")).toEqual([]);
    expect(parcelRecordShardPrefixes("abc")).toEqual([]);
  });
});

describe("parcelRecordShardUrl", () => {
  it("builds a static shard path for valid prefixes", () => {
    expect(parcelRecordShardUrl("03249")).toBe(
      "/data/arapahoe-parcel-record-by-pin/03249.json",
    );
  });

  it("rejects invalid prefix shapes", () => {
    expect(parcelRecordShardUrl("0324")).toBeNull();
    expect(parcelRecordShardUrl("032491")).toBeNull();
    expect(parcelRecordShardUrl("../03249")).toBeNull();
    expect(parcelRecordShardUrl("03x49")).toBeNull();
  });
});

describe("lookupParcelRecordRow", () => {
  it("finds a row in a shard-scoped file using normalized PIN candidates", () => {
    const file = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test", taxYear: null },
      pinDigits: 9,
      shardPrefix: "03249",
      byPin: { "032490811": { ain: "2077-34-2-09-011" } },
    };
    expect(lookupParcelRecordRow("32490811", file)?.ain).toBe("2077-34-2-09-011");
  });
});
