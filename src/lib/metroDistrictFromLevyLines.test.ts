// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import type { CommittedLevyLine } from "@/lib/committedLevyLine";
import {
  ARAPAHOE_COUNTY_CONFIG,
  DOUGLAS_COUNTY_CONFIG,
} from "@/lib/countyConfig";
import {
  findMetroDistrictIdsFromCommittedLines,
  metroFromLevyLines,
  shouldShowMetroPurposesSection,
} from "@/lib/metroDistrictFromLevyLines";
import { metroPurposesFileForCounty } from "@/lib/metroPurposesBundle";

describe("shouldShowMetroPurposesSection", () => {
  const metroMatch = {
    kind: "match" as const,
    districtIds: ["1001-64903-0"],
  };

  it("shows when the resolved county has metroPurposes and the stack matched a metro LG ID", () => {
    expect(
      shouldShowMetroPurposesSection(ARAPAHOE_COUNTY_CONFIG, metroMatch),
    ).toBe(true);
    expect(
      shouldShowMetroPurposesSection(DOUGLAS_COUNTY_CONFIG, metroMatch),
    ).toBe(true);
  });

  it("omits when metroPurposes is on but the stack has no metro LG ID match", () => {
    expect(
      shouldShowMetroPurposesSection(ARAPAHOE_COUNTY_CONFIG, {
        kind: "no_metro_lgid_match",
      }),
    ).toBe(false);
  });

  it("omits when there is no stack hint yet", () => {
    expect(
      shouldShowMetroPurposesSection(ARAPAHOE_COUNTY_CONFIG, undefined),
    ).toBe(false);
  });
});

describe("metroPurposesFileForCounty", () => {
  it("returns null for missing or unknown county (never silent Arapahoe)", () => {
    expect(metroPurposesFileForCounty(null)).toBeNull();
    expect(metroPurposesFileForCounty("")).toBeNull();
    expect(metroPurposesFileForCounty("unknown-county")).toBeNull();
  });

  it("loads Arapahoe and Douglas bundles separately", () => {
    const ara = metroPurposesFileForCounty("arapahoe");
    const doug = metroPurposesFileForCounty("douglas");
    expect(ara).not.toBeNull();
    expect(doug).not.toBeNull();
    expect(ara!.districts.some((d) => d.lgid === "65214")).toBe(true);
    expect(doug!.districts.some((d) => d.lgid === "65041")).toBe(true);
    expect(doug!.districts.some((d) => d.lgid === "65214")).toBe(false);
  });
});

describe("metroFromLevyLines county-keyed match", () => {
  function lineWithLg(lgId: string): CommittedLevyLine {
    return {
      id: `line-${lgId}`,
      authority: "Test Metro",
      mills: 10,
      levyLineCode: "8888",
      dolaMatch: {
        method: "fuzzy",
        confidence: "high",
        lgId,
      },
    };
  }

  it("matches Arapahoe Adonea only against the Arapahoe bundle", () => {
    const lines = [lineWithLg("65214")];
    expect(findMetroDistrictIdsFromCommittedLines(lines, "arapahoe").length).toBe(
      1,
    );
    expect(findMetroDistrictIdsFromCommittedLines(lines, "douglas")).toEqual([]);
    expect(metroFromLevyLines(lines, "douglas")?.kind).toBe(
      "no_metro_lgid_match",
    );
  });

  it("matches Douglas Canyons MD 3 against the Douglas bundle with ops+debt", () => {
    const lines = [lineWithLg("65041")];
    const ids = findMetroDistrictIdsFromCommittedLines(lines, "douglas");
    expect(ids).toEqual(["douglas-65041-0"]);
    const file = metroPurposesFileForCounty("douglas")!;
    const district = file.districts.find((d) => d.districtId === ids[0]);
    expect(district?.name).toMatch(/Canyons/i);
    const cats = new Set(district?.levies?.map((l) => l.purposeCategory));
    expect(cats.has("operations")).toBe(true);
    expect(cats.has("debt_service")).toBe(true);
    expect(metroFromLevyLines(lines, "arapahoe")?.kind).toBe(
      "no_metro_lgid_match",
    );
  });
});
