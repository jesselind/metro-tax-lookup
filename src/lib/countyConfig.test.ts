// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * County config contract (new ingest / second-county work). Identifier digits,
 * URL templates, host allowlist, and feature flags. Second-county fixtures use
 * invented 10-digit schedule ids, not El Paso production numbers.
 *
 * Keep this file separate from:
 * - `arapahoeParcelLevyData.test.ts` (Arapahoe JSON / shard / fetch-time)
 * - `tools/test_build_arapahoe_parcel_levy_index.py` (current production rebuild)
 * URL encoding and scheme-rejection stay in `safeExternalHref.test.ts`.
 */

import { describe, expect, it } from "vitest";
import {
  looksLikeAinInput,
  looksLikePinOnlyInput,
  pinLookupCandidates,
} from "@/lib/arapahoeParcelLevyData";
import {
  ARAPAHOE_COUNTY_CONFIG,
  COUNTY_CONFIG,
  countyFeaturePresentation,
  formatIdentifierNotFoundMessage,
  type CountyConfig,
  validateCountyConfig,
} from "@/lib/countyConfig";
import {
  safeCountyBppAccountDetailsUrl,
  safeCountyBppNoticeOfValuationPdfUrl,
  safeCountyClerkRecorderSearchUrl,
  safeCountyCompsGridPdfUrl,
  safeCountyLevyAspxUrl,
  safeCountyParcelRecordUrl,
} from "@/lib/safeExternalHref";
import { SYNTHETIC_AIN, SYNTHETIC_PIN, SYNTHETIC_SCHEDULE_10 } from "@/lib/syntheticTestIds";

function scheduleCountyFixture(
  overrides: Partial<CountyConfig> = {},
): CountyConfig {
  return {
    ...ARAPAHOE_COUNTY_CONFIG,
    id: "synthetic-schedule",
    displayName: "Synthetic County",
    dolaCertifyingCounty: "Synthetic",
    identifierDigits: 10,
    identifierPasteMinDigits: 10,
    publicParcelId: null,
    hostAllowlist: ["parcel.example.test"],
    urls: {
      levyAspx: {
        host: "parcel.example.test",
        pathSuffix: "/rates.aspx",
      },
      parcelRecord: {
        host: "parcel.example.test",
        path: "/record",
        queryParam: "id",
      },
    },
    residentLinks: {
      propertySearch: "https://parcel.example.test/search",
    },
    features: {
      situs: false,
      compsPdf: false,
      bpp: false,
      millsHistory: false,
      metroPurposes: false,
    },
    knownFailures: {
      compsPdfHostedFiles: false,
    },
    countyScopeNote: "Synthetic County only.",
    identifierPlaceholder: "10-digit schedule number from county record",
    emptyIdentifierMessage:
      "Enter your schedule number (digits from the county record).",
    identifierNotFoundTemplate:
      "No parcel found for {tried}. Copy the 10-digit schedule number from your county record.",
    situsSearchOffMessage:
      "Address search is not available. Enter the 10-digit schedule number.",
    ...overrides,
  };
}

describe("COUNTY_CONFIG (Arapahoe shipping)", () => {
  it("is the Arapahoe county file and validates", () => {
    expect(COUNTY_CONFIG).toBe(ARAPAHOE_COUNTY_CONFIG);
    expect(validateCountyConfig(ARAPAHOE_COUNTY_CONFIG)).toBeNull();
    expect(ARAPAHOE_COUNTY_CONFIG.identifierDigits).toBe(9);
    expect(ARAPAHOE_COUNTY_CONFIG.dolaCertifyingCounty).toBe("Arapahoe");
  });
});

describe("identifier digit length from config", () => {
  it("pads and windows Arapahoe 9-digit PIN pastes", () => {
    expect(pinLookupCandidates(SYNTHETIC_PIN, 9)).toEqual([SYNTHETIC_PIN]);
    expect(pinLookupCandidates("10000001", 9)).toEqual([SYNTHETIC_PIN]);
    expect(looksLikePinOnlyInput(SYNTHETIC_PIN, ARAPAHOE_COUNTY_CONFIG)).toBe(
      true,
    );
    expect(looksLikeAinInput(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG)).toBe(true);
  });

  it("uses 10-digit schedule rules on a second invented fixture", () => {
    const schedule = scheduleCountyFixture();
    expect(validateCountyConfig(schedule)).toBeNull();
    expect(pinLookupCandidates(SYNTHETIC_SCHEDULE_10, 10)).toEqual([
      SYNTHETIC_SCHEDULE_10,
    ]);
    expect(pinLookupCandidates("100000001", 10)).toEqual([
      SYNTHETIC_SCHEDULE_10,
    ]);
    expect(looksLikePinOnlyInput(SYNTHETIC_SCHEDULE_10, schedule)).toBe(true);
    expect(looksLikePinOnlyInput(SYNTHETIC_PIN, schedule)).toBe(false);
    expect(looksLikeAinInput(SYNTHETIC_AIN, schedule)).toBe(false);
    expect(formatIdentifierNotFoundMessage(SYNTHETIC_SCHEDULE_10, schedule)).toBe(
      `No parcel found for ${SYNTHETIC_SCHEDULE_10}. Copy the 10-digit schedule number from your county record.`,
    );
  });
});

describe("URL templates and host allowlist", () => {
  it("builds Arapahoe URLs from the first county file", () => {
    expect(safeCountyParcelRecordUrl(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG)).toBe(
      `https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=${SYNTHETIC_AIN}`,
    );
    expect(
      safeCountyLevyAspxUrl(
        "https://parcelsearch.arapahoegov.com/Levy.aspx?id=1251492",
        ARAPAHOE_COUNTY_CONFIG,
      ),
    ).toBe("https://parcelsearch.arapahoegov.com/Levy.aspx?id=1251492");
    expect(safeCountyCompsGridPdfUrl(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG)).toBe(
      `https://parcelsearch.arapahoegov.com/FileDownload.ashx?AIN=${SYNTHETIC_AIN}`,
    );
    expect(
      safeCountyBppAccountDetailsUrl(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG),
    ).toBe(
      `https://personalpropertysearch.arapahoegov.com/Details.aspx?AIN=${SYNTHETIC_AIN}`,
    );
    expect(
      safeCountyBppNoticeOfValuationPdfUrl(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG),
    ).toBe(
      `https://personalpropertysearch.arapahoegov.com/FileDownload.ashx?AIN=${SYNTHETIC_AIN}`,
    );
    expect(
      safeCountyClerkRecorderSearchUrl("D411 5095", ARAPAHOE_COUNTY_CONFIG),
    ).toBe(
      "https://arapahoe.co.publicsearch.us/results?department=RP&searchType=quickSearch&searchValue=D4115095",
    );
  });

  it("rejects hosts that are not on the allowlist", () => {
    expect(
      safeCountyLevyAspxUrl(
        "https://evil.example/Levy.aspx?id=1",
        ARAPAHOE_COUNTY_CONFIG,
      ),
    ).toBeNull();
    expect(
      validateCountyConfig({
        ...ARAPAHOE_COUNTY_CONFIG,
        urls: {
          ...ARAPAHOE_COUNTY_CONFIG.urls,
          parcelRecord: {
            host: "evil.example",
            path: "/PPINum.aspx",
            queryParam: "PPINum",
          },
        },
      }),
    ).toMatch(/not in hostAllowlist/);
  });

  it("builds the second fixture host from its templates", () => {
    const schedule = scheduleCountyFixture();
    expect(
      safeCountyParcelRecordUrl(SYNTHETIC_SCHEDULE_10, schedule),
    ).toBe(`https://parcel.example.test/record?id=${SYNTHETIC_SCHEDULE_10}`);
    expect(
      safeCountyLevyAspxUrl(
        `https://parcel.example.test/Rates.aspx?id=${SYNTHETIC_SCHEDULE_10}`,
        schedule,
      ),
    ).toBe(`https://parcel.example.test/Rates.aspx?id=${SYNTHETIC_SCHEDULE_10}`);
    expect(
      safeCountyLevyAspxUrl(
        "https://parcelsearch.arapahoegov.com/Levy.aspx?id=1",
        schedule,
      ),
    ).toBeNull();
  });
});

describe("feature-available flags", () => {
  it("shows Arapahoe features and gaps comps PDFs (known hosting failure)", () => {
    expect(countyFeaturePresentation("situs", ARAPAHOE_COUNTY_CONFIG)).toBe(
      "show",
    );
    expect(countyFeaturePresentation("bpp", ARAPAHOE_COUNTY_CONFIG)).toBe(
      "show",
    );
    expect(
      countyFeaturePresentation("millsHistory", ARAPAHOE_COUNTY_CONFIG),
    ).toBe("show");
    expect(
      countyFeaturePresentation("metroPurposes", ARAPAHOE_COUNTY_CONFIG),
    ).toBe("show");
    expect(countyFeaturePresentation("compsPdf", ARAPAHOE_COUNTY_CONFIG)).toBe(
      "gap",
    );
  });

  it("omits situs, comps, BPP, mills history, and metro purposes when flags are off", () => {
    const schedule = scheduleCountyFixture();
    expect(countyFeaturePresentation("situs", schedule)).toBe("omit");
    expect(countyFeaturePresentation("compsPdf", schedule)).toBe("omit");
    expect(countyFeaturePresentation("bpp", schedule)).toBe("omit");
    expect(countyFeaturePresentation("millsHistory", schedule)).toBe("omit");
    expect(countyFeaturePresentation("metroPurposes", schedule)).toBe("omit");
    expect(safeCountyCompsGridPdfUrl(SYNTHETIC_AIN, schedule)).toBeNull();
    expect(safeCountyBppAccountDetailsUrl(SYNTHETIC_AIN, schedule)).toBeNull();
    expect(
      safeCountyBppNoticeOfValuationPdfUrl(SYNTHETIC_AIN, schedule),
    ).toBeNull();
  });
});

describe("validateCountyConfig resident-facing required fields", () => {
  it("rejects blank propertySearch", () => {
    expect(
      validateCountyConfig({
        ...ARAPAHOE_COUNTY_CONFIG,
        residentLinks: {
          ...ARAPAHOE_COUNTY_CONFIG.residentLinks,
          propertySearch: "   ",
        },
      }),
    ).toMatch(/propertySearch required/);
  });

  it("rejects blank emptyIdentifierMessage", () => {
    expect(
      validateCountyConfig({
        ...ARAPAHOE_COUNTY_CONFIG,
        emptyIdentifierMessage: "",
      }),
    ).toMatch(/emptyIdentifierMessage required/);
  });

  it("rejects blank situsSearchOffMessage", () => {
    expect(
      validateCountyConfig({
        ...ARAPAHOE_COUNTY_CONFIG,
        situsSearchOffMessage: "  ",
      }),
    ).toMatch(/situsSearchOffMessage required/);
  });
});
