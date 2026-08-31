// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Arapahoe shipping JSON: shard paths, fetch-time validators, PIN/AIN paste
 * against the 9-digit default. Config-driven digit length and a 10-digit
 * schedule fixture live in `countyConfig.test.ts`.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ainLookupCandidates,
  ARAPAHOE_PARCEL_RECORD_CACHE_BUST,
  clearArapahoeParcelDataCache,
  fetchArapahoeLevyStacksJson,
  fetchArapahoePinToTagJson,
  getAinToPinIndex,
  getLastArapahoeLevyStacksFetchFailureDetail,
  getLastArapahoePinToTagFetchFailureDetail,
  looksLikeAinInput,
  looksLikeParcelIdInput,
  looksLikePinOnlyInput,
  lookupParcelRecordRow,
  PARCEL_RECORD_SHARD_PREFIX_LENGTH,
  parcelRecordShardPrefixes,
  parcelRecordShardUrl,
  pinLookupCandidates,
  resolvePinKeyFromParcelIdInput,
  validateArapahoeLevyStacksFile,
  validateArapahoePinToTagFile,
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

  it("returns empty for short or empty input", () => {
    expect(parcelRecordShardPrefixes("")).toEqual([]);
    expect(parcelRecordShardPrefixes("abc")).toEqual([]);
  });

  it("accepts letter-prefixed Douglas account ids", () => {
    expect(parcelRecordShardPrefixes("R0103974", "douglas")).toEqual(["R01039"]);
    expect(parcelRecordShardPrefixes("c0193439", "douglas")).toEqual(["C01934"]);
  });
});

describe("parcelRecordShardUrl", () => {
  it("builds a static shard path with the cache-bust version", () => {
    expect(parcelRecordShardUrl(SYNTHETIC_PIN_SHARD_PREFIX)).toBe(
      `/data/arapahoe-parcel-record-by-pin/${SYNTHETIC_PIN_SHARD_PREFIX}.json?v=${ARAPAHOE_PARCEL_RECORD_CACHE_BUST}`,
    );
  });

  it("uses the countyId path segment (not always Arapahoe)", () => {
    expect(
      parcelRecordShardUrl(SYNTHETIC_PIN_SHARD_PREFIX, "/data", "douglas"),
    ).toBe(
      `/data/douglas-parcel-record-by-pin/${SYNTHETIC_PIN_SHARD_PREFIX}.json?v=${ARAPAHOE_PARCEL_RECORD_CACHE_BUST}`,
    );
  });

  it("allows alphanumeric prefixes and rejects unsafe shapes", () => {
    expect(parcelRecordShardUrl("R01039")).toBe(
      `/data/arapahoe-parcel-record-by-pin/R01039.json?v=${ARAPAHOE_PARCEL_RECORD_CACHE_BUST}`,
    );
    expect(parcelRecordShardUrl("01000")).toBeNull();
    expect(parcelRecordShardUrl("0100000")).toBeNull();
    expect(parcelRecordShardUrl("../010000")).toBeNull();
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

describe("AIN and parcel-id input helpers", () => {
  it("normalizes AIN candidates to 12 digits", () => {
    expect(ainLookupCandidates(SYNTHETIC_AIN)).toEqual(["100000000001"]);
    expect(ainLookupCandidates("1000 00 0 00 001")).toEqual(["100000000001"]);
    expect(ainLookupCandidates(SYNTHETIC_PIN)).toEqual([]);
  });

  it("detects AIN vs PIN-only vs street-like input", () => {
    expect(looksLikeAinInput(SYNTHETIC_AIN)).toBe(true);
    expect(looksLikePinOnlyInput(SYNTHETIC_PIN)).toBe(true);
    expect(looksLikeParcelIdInput(SYNTHETIC_AIN)).toBe(true);
    expect(looksLikeParcelIdInput("1940 Holly St")).toBe(false);
  });

  it("resolves AIN to PIN through the reverse index", () => {
    const file = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      pinDigits: 9,
      byPin: {
        [SYNTHETIC_PIN]: { tagId: "1", tagShortDescr: "0001", ain: SYNTHETIC_AIN },
      },
    };
    expect(getAinToPinIndex(file).get("100000000001")).toBe(SYNTHETIC_PIN);
    expect(resolvePinKeyFromParcelIdInput(file, SYNTHETIC_AIN)).toBe(
      SYNTHETIC_PIN,
    );
    expect(resolvePinKeyFromParcelIdInput(file, SYNTHETIC_PIN)).toBe(
      SYNTHETIC_PIN,
    );
  });

  it("prefers an exact AIN match over a PIN-sized AIN suffix already in byPin", () => {
    const ainDigits = SYNTHETIC_AIN.replace(/\D/g, "");
    const collidingPin = ainDigits.slice(-9);
    expect(collidingPin).not.toBe(SYNTHETIC_PIN);
    const file = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      pinDigits: 9,
      byPin: {
        [SYNTHETIC_PIN]: {
          tagId: "1",
          tagShortDescr: "0001",
          ain: SYNTHETIC_AIN,
        },
        [collidingPin]: { tagId: "2", tagShortDescr: "0002" },
      },
    };
    expect(resolvePinKeyFromParcelIdInput(file, SYNTHETIC_AIN)).toBe(
      SYNTHETIC_PIN,
    );
    expect(resolvePinKeyFromParcelIdInput(file, collidingPin)).toBe(
      collidingPin,
    );
  });
});

describe("validateArapahoeLevyStacksFile", () => {
  const validStack = {
    tagId: "1",
    levyAspxUrl: "https://parcelsearch.arapahoegov.com/Levy.aspx?id=1",
    lines: [
      {
        code: "0601",
        authorityName: "SCHOOL",
        dolaMatch: { method: "none", confidence: "low" },
      },
    ],
  };

  it("accepts a well-formed root and stack entries", () => {
    expect(
      validateArapahoeLevyStacksFile({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        stacksByTagId: { "1": validStack },
      }),
    ).toBeNull();
  });

  it("rejects a malformed root", () => {
    expect(validateArapahoeLevyStacksFile(null)).toMatch(/root must be an object/);
    expect(
      validateArapahoeLevyStacksFile({
        snapshot: { bundledAsOf: "2026-01-01" },
      }),
    ).toMatch(/missing stacksByTagId/);
    expect(
      validateArapahoeLevyStacksFile({
        snapshot: { source: "test" },
        stacksByTagId: {},
      }),
    ).toMatch(/snapshot\.bundledAsOf required/);
  });

  it("rejects a malformed stack entry", () => {
    expect(
      validateArapahoeLevyStacksFile({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        stacksByTagId: { "1": { tagId: "1", lines: [] } },
      }),
    ).toMatch(/stacksByTagId\[1\] has an invalid shape/);
  });
});

describe("validateArapahoePinToTagFile", () => {
  it("accepts a well-formed root and byPin entries", () => {
    expect(
      validateArapahoePinToTagFile({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        pinDigits: 9,
        byPin: {
          [SYNTHETIC_PIN]: { tagId: "1", tagShortDescr: "0001" },
        },
      }),
    ).toBeNull();
  });

  it("rejects a malformed root", () => {
    expect(validateArapahoePinToTagFile([])).toMatch(/root must be an object/);
    expect(
      validateArapahoePinToTagFile({
        snapshot: { bundledAsOf: "2026-01-01" },
        pinDigits: 9,
      }),
    ).toMatch(/missing byPin/);
    expect(
      validateArapahoePinToTagFile({
        snapshot: { source: "test" },
        pinDigits: 9,
        byPin: {},
      }),
    ).toMatch(/snapshot\.bundledAsOf required/);
  });

  it("rejects a malformed byPin entry", () => {
    expect(
      validateArapahoePinToTagFile({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        pinDigits: 9,
        byPin: { [SYNTHETIC_PIN]: { tagId: "1" } },
      }),
    ).toMatch(new RegExp(`byPin\\[${SYNTHETIC_PIN}\\] has an invalid shape`));
  });
});

describe("fetchArapahoeLevyStacksJson / fetchArapahoePinToTagJson validation", () => {
  afterEach(() => {
    clearArapahoeParcelDataCache();
    vi.unstubAllGlobals();
  });

  it("clears cache and records detail for a malformed stacks root", async () => {
    const validStacks = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      stacksByTagId: {
        "1": {
          tagId: "1",
          levyAspxUrl: "https://parcelsearch.arapahoegov.com/Levy.aspx?id=1",
          lines: [
            {
              code: "0601",
              authorityName: "SCHOOL",
              dolaMatch: { method: "none", confidence: "low" },
            },
          ],
        },
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notStacks: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => validStacks,
      });
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchArapahoeLevyStacksJson()).toBeNull();
    expect(getLastArapahoeLevyStacksFetchFailureDetail()).toMatch(
      /missing stacksByTagId|missing snapshot/,
    );

    expect(await fetchArapahoeLevyStacksJson()).toEqual(validStacks);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("clears cache and records detail for a malformed pin-to-tag entry", async () => {
    const validPinToTag = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      pinDigits: 9,
      byPin: {
        [SYNTHETIC_PIN]: { tagId: "1", tagShortDescr: "0001" },
      },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          snapshot: { bundledAsOf: "2026-01-01", source: "test" },
          pinDigits: 9,
          byPin: { [SYNTHETIC_PIN]: { tagId: "1" } },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => validPinToTag,
      });
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchArapahoePinToTagJson()).toBeNull();
    expect(getLastArapahoePinToTagFetchFailureDetail()).toMatch(
      /has an invalid shape/,
    );

    expect(await fetchArapahoePinToTagJson()).toEqual(validPinToTag);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
