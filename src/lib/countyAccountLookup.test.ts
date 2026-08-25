// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  candidateCountyIdsForAccountInput,
  looksLikeParcelIdInputAnyCounty,
  resolveAccountCountyLookup,
} from "@/lib/countyAccountLookup";
import {
  clearArapahoeParcelDataCache,
} from "@/lib/arapahoeParcelLevyData";
import { SYNTHETIC_AIN, SYNTHETIC_PIN } from "@/lib/syntheticTestIds";

describe("countyAccountLookup format heuristics", () => {
  it("accepts Arapahoe PIN and AIN shapes", () => {
    expect(looksLikeParcelIdInputAnyCounty(SYNTHETIC_PIN)).toBe(true);
    expect(looksLikeParcelIdInputAnyCounty(SYNTHETIC_AIN)).toBe(true);
    expect(candidateCountyIdsForAccountInput(SYNTHETIC_PIN)).toContain(
      "arapahoe",
    );
  });

  it("accepts Douglas alphanumeric account ids", () => {
    expect(looksLikeParcelIdInputAnyCounty("C0193439")).toBe(true);
    expect(candidateCountyIdsForAccountInput("C0193439")).toEqual(["douglas"]);
  });

  it("rejects street address text", () => {
    expect(looksLikeParcelIdInputAnyCounty("1940 Holly St")).toBe(false);
    expect(candidateCountyIdsForAccountInput("1940 Holly St")).toEqual([]);
  });
});

describe("resolveAccountCountyLookup", () => {
  afterEach(() => {
    clearArapahoeParcelDataCache();
    vi.unstubAllGlobals();
  });

  it("resolves Arapahoe when only that index matches", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("arapahoe-pin-to-tag")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            snapshot: { bundledAsOf: "2026-01-01", source: "test" },
            pinDigits: 9,
            byPin: {
              [SYNTHETIC_PIN]: { tagId: "1", tagShortDescr: "0001" },
            },
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveAccountCountyLookup(SYNTHETIC_PIN);
    expect(result.status).toBe("found");
    if (result.status === "found") {
      expect(result.hit.countyId).toBe("arapahoe");
      expect(result.hit.matchedPinKey).toBe(SYNTHETIC_PIN);
    }
  });

  it("resolves Douglas when only that index matches", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("douglas-pin-to-tag")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            snapshot: { bundledAsOf: "2026-01-01", source: "test" },
            pinDigits: 8,
            byPin: {
              C0193439: { tagId: "101", tagShortDescr: "101" },
            },
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await resolveAccountCountyLookup("c0193439");
    expect(result.status).toBe("found");
    if (result.status === "found") {
      expect(result.hit.countyId).toBe("douglas");
      expect(result.hit.matchedPinKey).toBe("C0193439");
    }
  });
});
