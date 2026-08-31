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
    expect(countyAccountMapUrl()).toBe(`/data/${id}-pin-to-tag.json`);
    expect(countyLevyStacksUrl()).toBe(
      `/data/${id}-levy-stacks-by-tag-id.json`,
    );
    expect(countySitusToPinsUrl(SHIPPING_DATA_ROOT, id, "bust")).toBe(
      `/data/${id}-situs-to-pins.json?v=bust`,
    );
    expect(countyParcelRecordShardUrl("035662", SHIPPING_DATA_ROOT, id, "v1")).toBe(
      `/data/${id}-parcel-record-by-pin/035662.json?v=v1`,
    );
  });

  it("builds engine-v2 URLs under /data-engine-v2", () => {
    expect(countyAccountMapUrl(ENGINE_V2_DATA_ROOT)).toBe(
      `/data-engine-v2/${id}-pin-to-tag.json`,
    );
    expect(countyLevyStacksUrl(ENGINE_V2_DATA_ROOT)).toBe(
      `/data-engine-v2/${id}-levy-stacks-by-tag-id.json`,
    );
  });

  it("maps URL roots to public/ filesystem relatives for validators", () => {
    expect(countyAccountMapFsRelative()).toBe(
      `public/data/${id}-pin-to-tag.json`,
    );
    expect(countyLevyStacksFsRelative()).toBe(
      `public/data/${id}-levy-stacks-by-tag-id.json`,
    );
    expect(countySitusToPinsFsRelative()).toBe(
      `public/data/${id}-situs-to-pins.json`,
    );
    expect(countyAccountMapFsRelative(ENGINE_V2_DATA_ROOT)).toBe(
      `public/data-engine-v2/${id}-pin-to-tag.json`,
    );
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
