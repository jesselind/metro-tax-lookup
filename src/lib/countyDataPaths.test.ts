// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";

import { COUNTY_CONFIG } from "@/lib/countyConfig";
import {
  ENGINE_V2_DATA_ROOT,
  SHIPPING_DATA_ROOT,
  countyAccountMapFsRelative,
  countyAccountMapUrl,
  countyHeavyDataPathnames,
  countyLevyStacksFsRelative,
  countyLevyStacksUrl,
  countyParcelRecordShardUrl,
  countySitusToPinsFsRelative,
  countySitusToPinsUrl,
} from "@/lib/countyDataPaths";

describe("countyDataPaths", () => {
  const id = COUNTY_CONFIG.id;

  it("builds shipping URLs from county id (no hard-coded arapahoe segment beyond config)", () => {
    expect(countyAccountMapUrl(id)).toBe(`/data/${id}-pin-to-tag.json`);
    expect(countyLevyStacksUrl(id)).toBe(
      `/data/${id}-levy-stacks-by-tag-id.json`,
    );
    expect(countySitusToPinsUrl(id, SHIPPING_DATA_ROOT, "bust")).toBe(
      `/data/${id}-situs-to-pins.json?v=bust`,
    );
    expect(countyParcelRecordShardUrl(id, "035662", SHIPPING_DATA_ROOT, "v1")).toBe(
      `/data/${id}-parcel-record-by-pin/035662.json?v=v1`,
    );
  });

  it("builds engine-v2 URLs under /data-engine-v2", () => {
    expect(countyAccountMapUrl(id, ENGINE_V2_DATA_ROOT)).toBe(
      `/data-engine-v2/${id}-pin-to-tag.json`,
    );
    expect(countyLevyStacksUrl(id, ENGINE_V2_DATA_ROOT)).toBe(
      `/data-engine-v2/${id}-levy-stacks-by-tag-id.json`,
    );
  });

  it("maps URL roots to public/ filesystem relatives for validators", () => {
    expect(countyAccountMapFsRelative(id)).toBe(
      `public/data/${id}-pin-to-tag.json`,
    );
    expect(countyLevyStacksFsRelative(id)).toBe(
      `public/data/${id}-levy-stacks-by-tag-id.json`,
    );
    expect(countySitusToPinsFsRelative(id)).toBe(
      `public/data/${id}-situs-to-pins.json`,
    );
    expect(countyAccountMapFsRelative(id, ENGINE_V2_DATA_ROOT)).toBe(
      `public/data-engine-v2/${id}-pin-to-tag.json`,
    );
  });

  it("rejects an empty county id instead of substituting Arapahoe", () => {
    expect(() => countyLevyStacksUrl("")).toThrow(/countyId is required/);
    expect(() => countyLevyStacksUrl("   ")).toThrow(/countyId is required/);
  });

  it("lists heavy paths for every wired county and both URL roots", () => {
    const heavy = countyHeavyDataPathnames();
    for (const countyId of ["arapahoe", "douglas"]) {
      expect(heavy).toContain(`/data/${countyId}-pin-to-tag.json`);
      expect(heavy).toContain(`/data-engine-v2/${countyId}-pin-to-tag.json`);
      expect(heavy).toContain(`/data/${countyId}-situs-to-pins.json`);
      expect(heavy).toContain(`/data/${countyId}-levy-stacks-by-tag-id.json`);
    }
  });
});
