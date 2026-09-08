// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * URL construction and scheme/host-drift rejection for hosted county hrefs.
 * County-config contract (digit length, second-county fixture, feature flags)
 * lives in `countyConfig.test.ts`, not here.
 */

import { describe, expect, it } from "vitest";
import { ARAPAHOE_COUNTY_CONFIG, DOUGLAS_COUNTY_CONFIG } from "./countyConfig";
import {
  clerkRecorderSearchValueFromBookPage,
  safeCountyBppAccountDetailsUrl,
  safeCountyBppNoticeOfValuationPdfUrl,
  safeCountyClerkRecorderSearchUrl,
  safeCountyCompsGridPdfUrl,
  safeCountyLevyAspxUrl,
  safeCountyParcelRecordUrl,
  safeHttpOrHttpsUrl,
} from "./safeExternalHref";
import { SYNTHETIC_AIN } from "./syntheticTestIds";

describe("safeHttpOrHttpsUrl", () => {
  it("accepts https URLs", () => {
    expect(safeHttpOrHttpsUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  it("accepts http URLs", () => {
    expect(safeHttpOrHttpsUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects javascript: URLs", () => {
    expect(safeHttpOrHttpsUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty and null", () => {
    expect(safeHttpOrHttpsUrl("")).toBeNull();
    expect(safeHttpOrHttpsUrl(null)).toBeNull();
    expect(safeHttpOrHttpsUrl(undefined)).toBeNull();
  });
});

describe("safeCountyLevyAspxUrl", () => {
  it("accepts county Levy.aspx URLs from the Arapahoe fixture", () => {
    expect(
      safeCountyLevyAspxUrl(
        "https://parcelsearch.arapahoegov.com/Levy.aspx?id=1251492",
        ARAPAHOE_COUNTY_CONFIG,
      ),
    ).toBe("https://parcelsearch.arapahoegov.com/Levy.aspx?id=1251492");
  });

  it("rejects wrong host or path", () => {
    expect(
      safeCountyLevyAspxUrl("https://evil.example/Levy.aspx?id=1", ARAPAHOE_COUNTY_CONFIG),
    ).toBeNull();
    expect(
      safeCountyLevyAspxUrl(
        "https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=x",
        ARAPAHOE_COUNTY_CONFIG,
      ),
    ).toBeNull();
  });

  it("rejects http (https only)", () => {
    expect(
      safeCountyLevyAspxUrl(
        "http://parcelsearch.arapahoegov.com/Levy.aspx?id=1",
        ARAPAHOE_COUNTY_CONFIG,
      ),
    ).toBeNull();
  });
});

describe("safeCountyParcelRecordUrl", () => {
  it("builds PPINum.aspx URL from AIN", () => {
    expect(safeCountyParcelRecordUrl(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG)).toBe(
      `https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=${SYNTHETIC_AIN}`,
    );
  });

  it("trims AIN and URL-encodes when needed", () => {
    expect(safeCountyParcelRecordUrl(`  ${SYNTHETIC_AIN}  `, ARAPAHOE_COUNTY_CONFIG)).toBe(
      `https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=${SYNTHETIC_AIN}`,
    );
  });

  it("returns null for empty AIN", () => {
    expect(safeCountyParcelRecordUrl("", ARAPAHOE_COUNTY_CONFIG)).toBeNull();
    expect(safeCountyParcelRecordUrl(null, ARAPAHOE_COUNTY_CONFIG)).toBeNull();
  });

  it("URL-encodes special characters in AIN", () => {
    expect(safeCountyParcelRecordUrl("a&b=c", ARAPAHOE_COUNTY_CONFIG)).toBe(
      "https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=a%26b%3Dc",
    );
  });
  it("builds Douglas hash-path property details URL", () => {
    expect(safeCountyParcelRecordUrl("R0399058", DOUGLAS_COUNTY_CONFIG)).toBe(
      "https://apps.douglas.co.us/assessor/web/#/details/2026/R0399058",
    );
  });
});

describe("safeCountyCompsGridPdfUrl", () => {
  it("builds FileDownload.ashx URL from AIN", () => {
    expect(safeCountyCompsGridPdfUrl(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG)).toBe(
      `https://parcelsearch.arapahoegov.com/FileDownload.ashx?AIN=${SYNTHETIC_AIN}`,
    );
  });

  it("returns null for empty AIN", () => {
    expect(safeCountyCompsGridPdfUrl("   ", ARAPAHOE_COUNTY_CONFIG)).toBeNull();
  });

  it("URL-encodes special characters in AIN", () => {
    expect(safeCountyCompsGridPdfUrl("a&b=c", ARAPAHOE_COUNTY_CONFIG)).toBe(
      "https://parcelsearch.arapahoegov.com/FileDownload.ashx?AIN=a%26b%3Dc",
    );
  });
});

describe("safeCountyBppNoticeOfValuationPdfUrl", () => {
  it("builds personalpropertysearch FileDownload.ashx URL from AIN", () => {
    expect(safeCountyBppNoticeOfValuationPdfUrl(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG)).toBe(
      `https://personalpropertysearch.arapahoegov.com/FileDownload.ashx?AIN=${SYNTHETIC_AIN}`,
    );
  });

  it("returns null for empty AIN", () => {
    expect(safeCountyBppNoticeOfValuationPdfUrl("   ", ARAPAHOE_COUNTY_CONFIG)).toBeNull();
    expect(safeCountyBppNoticeOfValuationPdfUrl(null, ARAPAHOE_COUNTY_CONFIG)).toBeNull();
  });

  it("URL-encodes special characters in AIN", () => {
    expect(safeCountyBppNoticeOfValuationPdfUrl("a&b=c", ARAPAHOE_COUNTY_CONFIG)).toBe(
      "https://personalpropertysearch.arapahoegov.com/FileDownload.ashx?AIN=a%26b%3Dc",
    );
  });

  it("does not use the real-property parcelsearch host", () => {
    const href = safeCountyBppNoticeOfValuationPdfUrl(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG);
    expect(href).not.toMatch(/parcelsearch\.arapahoegov\.com/);
    expect(href).toMatch(/^https:\/\/personalpropertysearch\.arapahoegov\.com\//);
  });
});

describe("safeCountyBppAccountDetailsUrl", () => {
  it("builds personalpropertysearch Details.aspx URL from AIN", () => {
    expect(safeCountyBppAccountDetailsUrl(SYNTHETIC_AIN, ARAPAHOE_COUNTY_CONFIG)).toBe(
      `https://personalpropertysearch.arapahoegov.com/Details.aspx?AIN=${SYNTHETIC_AIN}`,
    );
  });

  it("returns null for empty AIN", () => {
    expect(safeCountyBppAccountDetailsUrl("", ARAPAHOE_COUNTY_CONFIG)).toBeNull();
    expect(safeCountyBppAccountDetailsUrl(null, ARAPAHOE_COUNTY_CONFIG)).toBeNull();
  });

  it("URL-encodes special characters in AIN", () => {
    expect(safeCountyBppAccountDetailsUrl("a&b=c", ARAPAHOE_COUNTY_CONFIG)).toBe(
      "https://personalpropertysearch.arapahoegov.com/Details.aspx?AIN=a%26b%3Dc",
    );
  });
});

describe("clerkRecorderSearchValueFromBookPage", () => {
  it("strips spaces between book and page", () => {
    expect(clerkRecorderSearchValueFromBookPage("D411 5095")).toBe(
      "D4115095",
    );
    expect(clerkRecorderSearchValueFromBookPage("7095  0248")).toBe(
      "70950248",
    );
  });

  it("rejects empty or unsafe tokens", () => {
    expect(clerkRecorderSearchValueFromBookPage("")).toBeNull();
    expect(clerkRecorderSearchValueFromBookPage("D411/5095")).toBeNull();
    expect(
      clerkRecorderSearchValueFromBookPage("javascript:alert(1)"),
    ).toBeNull();
    expect(
      clerkRecorderSearchValueFromBookPage('D411"><img onerror=alert(1)>'),
    ).toBeNull();
    expect(
      clerkRecorderSearchValueFromBookPage("D4115095&department=evil"),
    ).toBeNull();
  });
});

describe("safeCountyClerkRecorderSearchUrl", () => {
  it("builds Clerk & Recorder quick-search URL from Book Page", () => {
    expect(safeCountyClerkRecorderSearchUrl("D411 5095", ARAPAHOE_COUNTY_CONFIG)).toBe(
      "https://arapahoe.co.publicsearch.us/results?department=RP&searchType=quickSearch&searchValue=D4115095",
    );
  });

  it("returns null for empty Book Page", () => {
    expect(safeCountyClerkRecorderSearchUrl("", ARAPAHOE_COUNTY_CONFIG)).toBeNull();
    expect(safeCountyClerkRecorderSearchUrl(null, ARAPAHOE_COUNTY_CONFIG)).toBeNull();
  });

  it("rejects unsafe Book Page values", () => {
    expect(safeCountyClerkRecorderSearchUrl("javascript:alert(1)", ARAPAHOE_COUNTY_CONFIG)).toBeNull();
    expect(
      safeCountyClerkRecorderSearchUrl("https://evil.example/?x=1", ARAPAHOE_COUNTY_CONFIG),
    ).toBeNull();
  });

  it("always targets the configured Clerk host", () => {
    const url = safeCountyClerkRecorderSearchUrl("D411 5095", ARAPAHOE_COUNTY_CONFIG);
    expect(url).toMatch(/^https:\/\/arapahoe\.co\.publicsearch\.us\//);
    expect(ARAPAHOE_COUNTY_CONFIG.urls.clerkRecorderSearch?.host).toBe(
      "arapahoe.co.publicsearch.us",
    );
  });
});
