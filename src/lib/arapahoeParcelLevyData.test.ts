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
import {
  SYNTHETIC_AIN,
  SYNTHETIC_PIN,
  SYNTHETIC_PIN_NOISY,
  SYNTHETIC_PIN_NO_LEADING_ZERO,
  SYNTHETIC_PIN_SHARD_PREFIX,
} from "./syntheticTestIds";

describe("parcelRecordShardPrefixes", () => {
  it("uses the configured PIN prefix length of a normalized 9-digit PIN", () => {
    expect(PARCEL_RECORD_SHARD_PREFIX_LENGTH).toBe(6);
    expect(parcelRecordShardPrefixes(SYNTHETIC_PIN)).toEqual([
      SYNTHETIC_PIN_SHARD_PREFIX,
    ]);
    expect(parcelRecordShardPrefixes(SYNTHETIC_PIN_NO_LEADING_ZERO)).toEqual([
      SYNTHETIC_PIN_SHARD_PREFIX,
    ]);
  });

  it("returns unique prefixes when first and last nine digits differ", () => {
    const candidates = pinLookupCandidates(SYNTHETIC_PIN_NOISY);
    const prefixes = parcelRecordShardPrefixes(SYNTHETIC_PIN_NOISY);
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
    expect(parcelRecordShardUrl(SYNTHETIC_PIN_SHARD_PREFIX)).toBe(
      `/data/arapahoe-parcel-record-by-pin/${SYNTHETIC_PIN_SHARD_PREFIX}.json`,
    );
  });

  it("rejects invalid prefix shapes", () => {
    expect(parcelRecordShardUrl("01000")).toBeNull();
    expect(parcelRecordShardUrl("0100000")).toBeNull();
    expect(parcelRecordShardUrl("../010000")).toBeNull();
    expect(parcelRecordShardUrl("01x000")).toBeNull();
  });
});

describe("lookupParcelRecordRow", () => {
  it("finds a row in a shard-scoped file using normalized PIN candidates", () => {
    const file = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test", taxYear: null },
      pinDigits: 9,
      shardPrefix: SYNTHETIC_PIN_SHARD_PREFIX,
      byPin: { [SYNTHETIC_PIN]: { ain: SYNTHETIC_AIN } },
    };
    expect(
      lookupParcelRecordRow(SYNTHETIC_PIN_NO_LEADING_ZERO, file)?.ain,
    ).toBe(SYNTHETIC_AIN);
  });
});
