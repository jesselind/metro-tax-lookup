// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Phase 10 ship gate: wired counties must keep `{countyId}-*` shipping paths, and
 * fetch loaders must request the same URLs as countyDataPaths builders.
 * Deprecated `arapahoe*` module barrels must re-export identical functions.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchArapahoeLevyStacksJson,
  fetchArapahoePinToTagJson,
  validateArapahoeLevyStacksFile,
  validateArapahoePinToTagFile,
} from "@/lib/arapahoeParcelLevyData";
import {
  fetchArapahoeSitusToPinsJson,
  validateArapahoeSitusToPinsPayload,
} from "@/lib/arapahoeSitusLookup";
import {
  APP_JSON_REQUIRED_RELATIVE_PATHS,
  validateRequiredAccountMapJson,
  validateRequiredLevyStacksJson,
} from "@/lib/appJsonValidate";
import {
  COUNTY_CONFIG_BY_ID,
  countyConfigById,
} from "@/lib/countyConfig";
import {
  countyAccountMapFsRelative,
  countyAccountMapUrl,
  countyHeavyDataPathnames,
  countyLevyStacksFsRelative,
  countyLevyStacksUrl,
  countyParcelRecordShardDirUrl,
  countyParcelRecordShardUrl,
  countySitusToPinsFsRelative,
  countySitusToPinsUrl,
} from "@/lib/countyDataPaths";
import {
  COUNTY_ACCOUNT_MAP_CACHE_BUST,
  COUNTY_PARCEL_RECORD_CACHE_BUST,
  clearCountyParcelDataCache,
  fetchCountyLevyStacksJson,
  fetchCountyPinToTagJson,
  parcelRecordShardUrl,
  validateCountyLevyStacksFile,
  validateCountyPinToTagFile,
} from "@/lib/countyParcelLevyData";
import {
  COUNTY_SITUS_TO_PINS_CACHE_BUST,
  clearCountySitusDataCache,
  fetchCountySitusToPinsJson,
  validateCountySitusToPinsPayload,
} from "@/lib/situsIndexLookup";

const WIRED_COUNTY_IDS = Object.keys(COUNTY_CONFIG_BY_ID).sort();

function minimalLevyStacksJson() {
  return {
    snapshot: { bundledAsOf: "2026-01-01", source: "contract-test" },
    stacksByTagId: {
      "1": {
        tagId: "1",
        levyAspxUrl: "https://example.com/levy?id=1",
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
}

function minimalPinToTagJson(pinDigits: number, pin: string) {
  return {
    snapshot: { bundledAsOf: "2026-01-01", source: "contract-test" },
    pinDigits,
    byPin: {
      [pin]: { tagId: "1", tagShortDescr: "0001" },
    },
  };
}

function minimalSitusJson() {
  return {
    snapshot: { bundledAsOf: "2026-01-01", source: "contract-test" },
    lookupVersion: 2,
    entryCount: 0,
    byKey: {},
  };
}

describe("county loader contract", () => {
  describe("shipping paths ({countyId}-* under /data/)", () => {
    it.each(WIRED_COUNTY_IDS)(
      "%s required index URLs use county id prefix",
      (countyId) => {
        expect(countyAccountMapUrl(undefined, countyId)).toBe(
          `/data/${countyId}-pin-to-tag.json`,
        );
        expect(countyLevyStacksUrl(undefined, countyId)).toBe(
          `/data/${countyId}-levy-stacks-by-tag-id.json`,
        );
        expect(
          countySitusToPinsUrl(undefined, countyId, COUNTY_SITUS_TO_PINS_CACHE_BUST),
        ).toBe(
          `/data/${countyId}-situs-to-pins.json?v=${COUNTY_SITUS_TO_PINS_CACHE_BUST}`,
        );
        expect(countyParcelRecordShardDirUrl(undefined, countyId)).toBe(
          `/data/${countyId}-parcel-record-by-pin`,
        );
        expect(
          countyParcelRecordShardUrl("035662", undefined, countyId, "v1"),
        ).toBe(`/data/${countyId}-parcel-record-by-pin/035662.json?v=v1`);
      },
    );

    it.each(WIRED_COUNTY_IDS)(
      "%s validator filesystem paths match URL layout",
      (countyId) => {
        expect(countyAccountMapFsRelative(undefined, countyId)).toBe(
          `public/data/${countyId}-pin-to-tag.json`,
        );
        expect(countyLevyStacksFsRelative(undefined, countyId)).toBe(
          `public/data/${countyId}-levy-stacks-by-tag-id.json`,
        );
        expect(countySitusToPinsFsRelative(undefined, countyId)).toBe(
          `public/data/${countyId}-situs-to-pins.json`,
        );
      },
    );

    it("lists heavy rate-limit paths for every wired county", () => {
      const heavy = countyHeavyDataPathnames();
      for (const countyId of WIRED_COUNTY_IDS) {
        expect(heavy).toContain(`/data/${countyId}-pin-to-tag.json`);
        expect(heavy).toContain(`/data/${countyId}-situs-to-pins.json`);
        expect(heavy).toContain(`/data/${countyId}-levy-stacks-by-tag-id.json`);
      }
    });
  });

  describe("fetch loaders request countyDataPaths URLs", () => {
    afterEach(() => {
      clearCountyParcelDataCache();
      clearCountySitusDataCache();
      vi.unstubAllGlobals();
    });

    it.each(WIRED_COUNTY_IDS)(
      "%s pin-to-tag fetch uses countyAccountMapUrl",
      async (countyId) => {
        const config = countyConfigById(countyId);
        expect(config).not.toBeNull();
        const pin = "1".padStart(config!.identifierDigits, "0");
        const expectedUrl = countyAccountMapUrl(
          undefined,
          countyId,
          COUNTY_ACCOUNT_MAP_CACHE_BUST,
        );
        const fetchMock = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => minimalPinToTagJson(config!.identifierDigits, pin),
        });
        vi.stubGlobal("fetch", fetchMock);

        await fetchCountyPinToTagJson(undefined, countyId);

        expect(fetchMock).toHaveBeenCalledWith(expectedUrl, undefined);
      },
    );

    it.each(WIRED_COUNTY_IDS)(
      "%s levy stacks fetch uses countyLevyStacksUrl",
      async (countyId) => {
        const expectedUrl = countyLevyStacksUrl(undefined, countyId);
        const fetchMock = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => minimalLevyStacksJson(),
        });
        vi.stubGlobal("fetch", fetchMock);

        await fetchCountyLevyStacksJson(undefined, countyId);

        expect(fetchMock).toHaveBeenCalledWith(expectedUrl, undefined);
      },
    );

    it.each(WIRED_COUNTY_IDS)(
      "%s situs fetch uses countySitusToPinsUrl",
      async (countyId) => {
        const expectedUrl = countySitusToPinsUrl(
          undefined,
          countyId,
          COUNTY_SITUS_TO_PINS_CACHE_BUST,
        );
        const fetchMock = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => minimalSitusJson(),
        });
        vi.stubGlobal("fetch", fetchMock);

        await fetchCountySitusToPinsJson(undefined, countyId);

        expect(fetchMock).toHaveBeenCalledWith(expectedUrl, {
          credentials: "same-origin",
        });
      },
    );

    it.each(WIRED_COUNTY_IDS)(
      "%s parcel-record shard URL uses county id segment",
      (countyId) => {
        expect(parcelRecordShardUrl("035662", undefined, countyId)).toBe(
          `/data/${countyId}-parcel-record-by-pin/035662.json?v=${COUNTY_PARCEL_RECORD_CACHE_BUST}`,
        );
      },
    );
  });

  describe("deprecated arapahoe* barrels (non-destructive Phase 10)", () => {
    it("re-export the same fetch functions as county loaders", () => {
      expect(fetchArapahoePinToTagJson).toBe(fetchCountyPinToTagJson);
      expect(fetchArapahoeLevyStacksJson).toBe(fetchCountyLevyStacksJson);
      expect(fetchArapahoeSitusToPinsJson).toBe(fetchCountySitusToPinsJson);
    });

    it("re-export the same validators as county loaders", () => {
      expect(validateArapahoeLevyStacksFile).toBe(validateCountyLevyStacksFile);
      expect(validateArapahoePinToTagFile).toBe(validateCountyPinToTagFile);
      expect(validateArapahoeSitusToPinsPayload).toBe(
        validateCountySitusToPinsPayload,
      );
    });
  });

  describe("app JSON validator paths stay county-scoped", () => {
    it("default required paths remain Arapahoe shipping files", () => {
      expect(APP_JSON_REQUIRED_RELATIVE_PATHS.accountMap).toBe(
        "public/data/arapahoe-pin-to-tag.json",
      );
      expect(APP_JSON_REQUIRED_RELATIVE_PATHS.levyStacks).toBe(
        "public/data/arapahoe-levy-stacks-by-tag-id.json",
      );
    });

    it.each(WIRED_COUNTY_IDS)(
      "%s minimal levy + account payloads pass validators",
      (countyId) => {
        const config = countyConfigById(countyId);
        expect(config).not.toBeNull();
        const pin = "2".padStart(config!.identifierDigits, "0");
        const stacksPath = countyLevyStacksFsRelative(undefined, countyId);
        const accountPath = countyAccountMapFsRelative(undefined, countyId);

        expect(
          validateRequiredLevyStacksJson(minimalLevyStacksJson(), stacksPath),
        ).toBeNull();
        expect(
          validateRequiredAccountMapJson(
            minimalPinToTagJson(config!.identifierDigits, pin),
            accountPath,
          ),
        ).toBeNull();
      },
    );
  });
});
