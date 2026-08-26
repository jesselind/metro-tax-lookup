// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveSitusCountyLookup,
  SITUS_COUNTY_AMBIGUOUS_MESSAGE,
} from "@/lib/countySitusLookup";
import {
  clearArapahoeParcelDataCache,
} from "@/lib/arapahoeParcelLevyData";
import { clearArapahoeSitusDataCache } from "@/lib/arapahoeSitusLookup";
import { SYNTHETIC_PIN } from "@/lib/syntheticTestIds";

const ARAPAHOE_SITUS = {
  snapshot: { bundledAsOf: "2026-01-01", source: "test" },
  lookupVersion: 2,
  entryCount: 1,
  byKey: {
    "1940|EVANS|": [{ pin: SYNTHETIC_PIN, label: "1940 Evans Ave, Aurora, CO 80014" }],
  },
};

const ARAPAHOE_PIN = {
  snapshot: { bundledAsOf: "2026-01-01", source: "test" },
  pinDigits: 9,
  byPin: {
    [SYNTHETIC_PIN]: { tagId: "1", tagShortDescr: "0001" },
  },
};

describe("resolveSitusCountyLookup", () => {
  afterEach(() => {
    clearArapahoeParcelDataCache();
    clearArapahoeSitusDataCache();
    vi.unstubAllGlobals();
  });

  it("resolves Arapahoe when only that situs index matches", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if (url.includes("arapahoe-situs-to-pins")) {
        return Promise.resolve({ ok: true, json: async () => ARAPAHOE_SITUS });
      }
      if (url.includes("arapahoe-pin-to-tag")) {
        return Promise.resolve({ ok: true, json: async () => ARAPAHOE_PIN });
      }
      if (url.includes("douglas-situs-to-pins")) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      if (url.includes("douglas-pin-to-tag")) {
        return Promise.resolve({ ok: true, json: async () => ({
          snapshot: { bundledAsOf: "2026-01-01", source: "test" },
          pinDigits: 8,
          byPin: {},
        }) });
      }
      return Promise.resolve({ ok: false, status: 404 });
    }));

    const result = await resolveSitusCountyLookup("1940", "", "Evans", "");
    expect(result.status).toBe("found");
    if (result.status === "found") {
      expect(result.match.countyId).toBe("arapahoe");
      expect(result.match.fuzzy.kind).toBe("match");
    }
  });

  it("returns ambiguous when two counties match the same address", async () => {
    const DOUGLAS_SITUS = {
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      lookupVersion: 2,
      entryCount: 1,
      byKey: {
        "1940|EVANS|": [{ pin: "R0000001", label: "1940 Evans Ave, Castle Rock, CO 80104" }],
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if (url.includes("arapahoe-situs-to-pins")) {
        return Promise.resolve({ ok: true, json: async () => ARAPAHOE_SITUS });
      }
      if (url.includes("douglas-situs-to-pins")) {
        return Promise.resolve({ ok: true, json: async () => DOUGLAS_SITUS });
      }
      if (url.includes("arapahoe-pin-to-tag")) {
        return Promise.resolve({ ok: true, json: async () => ARAPAHOE_PIN });
      }
      if (url.includes("douglas-pin-to-tag")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            snapshot: { bundledAsOf: "2026-01-01", source: "test" },
            pinDigits: 8,
            byPin: { R0000001: { tagId: "101", tagShortDescr: "101" } },
          }),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    }));

    const result = await resolveSitusCountyLookup("1940", "", "Evans", "");
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") {
      expect(result.matches.length).toBeGreaterThan(1);
    }
  });

  it("exports a resident-facing ambiguous message", () => {
    expect(SITUS_COUNTY_AMBIGUOUS_MESSAGE).toMatch(/more than one supported county/i);
  });
});
