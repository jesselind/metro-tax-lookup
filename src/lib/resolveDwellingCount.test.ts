// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import type { CountyParcelRecordRow } from "./countyParcelLevyData";
import {
  dwellingCountFromImprovementType,
  equalSplitFromAnnualTax,
  levyDisplayDollarsForAudience,
  levyDollarsForAudience,
  monthlyFromAnnualTax,
  parseBuildingUnitsAttribute,
  parseLandLineUbUnits,
  perUnitShareWholeDollars,
  resolveDwellingCount,
  sumBuildingUnitsAttributes,
  sumLandLineUbUnits,
} from "./resolveDwellingCount";

describe("parseLandLineUbUnits", () => {
  it("parses county UB unit strings", () => {
    expect(parseLandLineUbUnits("352.0000 UB")).toBe(352);
    expect(parseLandLineUbUnits("4 UB")).toBe(4);
    expect(parseLandLineUbUnits("1.0000 ub")).toBe(1);
  });

  it("ignores LT / AC / SF and blank", () => {
    expect(parseLandLineUbUnits("1.0000 LT")).toBeNull();
    expect(parseLandLineUbUnits("9000.0000 SF")).toBeNull();
    expect(parseLandLineUbUnits("2.0000 AC")).toBeNull();
    expect(parseLandLineUbUnits("")).toBeNull();
    expect(parseLandLineUbUnits(null)).toBeNull();
  });

  it("rejects fractional UB quantities (no rounding)", () => {
    expect(parseLandLineUbUnits("1.5 UB")).toBeNull();
    expect(parseLandLineUbUnits("2.25 UB")).toBeNull();
  });
});

describe("sumLandLineUbUnits", () => {
  it("sums UB lines and ignores retail SF", () => {
    expect(
      sumLandLineUbUnits([
        { units: "352.0000 UB", landUse: "APT Multi-Units (9+)" },
        { units: "9000.0000 SF", landUse: "Merchandising (all Retail)" },
      ]),
    ).toBe(352);
  });

  it("sums multiple UB lines", () => {
    expect(
      sumLandLineUbUnits([
        { units: "100.0000 UB", landUse: "APT Multi-Units (9+)" },
        { units: "50.0000 UB", landUse: "APT Multi-Units (9+)" },
      ]),
    ).toBe(150);
  });
});

describe("parseBuildingUnitsAttribute / sumBuildingUnitsAttributes", () => {
  it("parses whole positive unit counts", () => {
    expect(parseBuildingUnitsAttribute("18")).toBe(18);
    expect(parseBuildingUnitsAttribute("18.00")).toBe(18);
    expect(parseBuildingUnitsAttribute("1")).toBe(1);
  });

  it("rejects blank, zero, fractional, and non-numeric", () => {
    expect(parseBuildingUnitsAttribute("")).toBeNull();
    expect(parseBuildingUnitsAttribute(null)).toBeNull();
    expect(parseBuildingUnitsAttribute("0")).toBeNull();
    expect(parseBuildingUnitsAttribute("0.00")).toBeNull();
    expect(parseBuildingUnitsAttribute("1.5")).toBeNull();
    expect(parseBuildingUnitsAttribute("abc")).toBeNull();
  });

  it("sums Units attrs and skips zero clubhouse rows (Douglas apartment shape)", () => {
    expect(
      sumBuildingUnitsAttributes([
        {
          buildingNum: "1",
          attributes: [
            { label: "Improvement Type", value: "Apartment <= 3 Stories" },
            { label: "Units", value: "18" },
          ],
        },
        {
          buildingNum: "2",
          attributes: [
            { label: "Improvement Type", value: "Clubhouse" },
            { label: "Units", value: "0" },
          ],
        },
        {
          buildingNum: "3",
          attributes: [
            { label: "Improvement Type", value: "Apartment <= 3 Stories" },
            { label: "Units", value: "20" },
          ],
        },
      ]),
    ).toBe(38);
  });

  it("returns null when no positive Units attrs", () => {
    expect(
      sumBuildingUnitsAttributes([
        {
          buildingNum: "1",
          attributes: [{ label: "Improvement Type", value: "Hospital" }],
        },
      ]),
    ).toBeNull();
  });
});

describe("dwellingCountFromImprovementType", () => {
  it("maps duplex / triplex / fourplex improvement types", () => {
    expect(
      dwellingCountFromImprovementType([
        {
          buildingNum: "1",
          attributes: [{ label: "Improvement Type", value: "Duplex: Two Family" }],
        },
      ]),
    ).toBe(2);
    expect(
      dwellingCountFromImprovementType([
        {
          buildingNum: "1",
          attributes: [
            { label: "Improvement Type", value: "Triplex: Three Family" },
          ],
        },
      ]),
    ).toBe(3);
    expect(
      dwellingCountFromImprovementType([
        {
          buildingNum: "1",
          attributes: [{ label: "Improvement Type", value: "Fourplex" }],
        },
      ]),
    ).toBe(4);
  });

  it("does not treat apartment story strings as N", () => {
    expect(
      dwellingCountFromImprovementType([
        {
          buildingNum: "1",
          attributes: [
            { label: "Improvement Type", value: "Apartment Low Rise 1-3" },
          ],
        },
      ]),
    ).toBeNull();
  });

  it("returns null when multiple buildings supply dwelling counts", () => {
    expect(
      dwellingCountFromImprovementType([
        {
          buildingNum: "1",
          attributes: [{ label: "Improvement Type", value: "Duplex: Two Family" }],
        },
        {
          buildingNum: "2",
          attributes: [
            { label: "Improvement Type", value: "Triplex: Three Family" },
          ],
        },
      ]),
    ).toBeNull();
  });
});

describe("resolveDwellingCount", () => {
  it("prefers UB over improvement type (AMLI-shaped synthetic)", () => {
    const record: CountyParcelRecordRow = {
      landLines: [
        { units: "352.0000 UB", landUse: "APT Multi-Units (9+)" },
        { units: "9000.0000 SF", landUse: "Merchandising (all Retail)" },
      ],
      buildings: [
        {
          buildingNum: "1",
          attributes: [
            { label: "Improvement Type", value: "Apartment Low Rise 1-3" },
          ],
        },
      ],
      stateUseCd: "2112",
    };
    expect(resolveDwellingCount(record)).toEqual({
      n: 352,
      source: "land-line-ub",
      sourceLabel: "county land record: 352 units",
    });
  });

  it("prefers UB over building Units attrs", () => {
    expect(
      resolveDwellingCount({
        landLines: [
          { units: "352.0000 UB", landUse: "APT Multi-Units (9+)" },
        ],
        buildings: [
          {
            buildingNum: "1",
            attributes: [{ label: "Units", value: "10" }],
          },
        ],
      }),
    ).toMatchObject({ n: 352, source: "land-line-ub" });
  });

  it("sums building Units when no UB (Douglas apartment shape)", () => {
    expect(
      resolveDwellingCount({
        landLines: [
          { units: "4,976,294", landUse: "MULTI-UNITS(9 AND UP) - LAND" },
        ],
        buildings: [
          {
            buildingNum: "1",
            attributes: [
              { label: "Improvement Type", value: "Apartment w/9 + Units" },
              { label: "Units", value: "18" },
            ],
          },
          {
            buildingNum: "2",
            attributes: [
              { label: "Improvement Type", value: "Clubhouse" },
              { label: "Units", value: "0" },
            ],
          },
          {
            buildingNum: "3",
            attributes: [
              { label: "Improvement Type", value: "Apartment w/9 + Units" },
              { label: "Units", value: "20" },
            ],
          },
        ],
        stateUseCd: "1225",
        landUse: "Apartment w/9 + Units",
      }),
    ).toEqual({
      n: 38,
      source: "building-units",
      sourceLabel: "county building record: 38 units",
    });
  });

  it("prefers building Units over duplex improvement type", () => {
    expect(
      resolveDwellingCount({
        buildings: [
          {
            buildingNum: "1",
            attributes: [
              { label: "Improvement Type", value: "Duplex One Story" },
              { label: "Units", value: "2" },
            ],
          },
        ],
      }),
    ).toMatchObject({ n: 2, source: "building-units" });
  });

  it("uses triplex improvement type when no UB and no Units", () => {
    const record: CountyParcelRecordRow = {
      landLines: [{ units: "1.0000 LT", landUse: "Duplexes-Triplexes" }],
      buildings: [
        {
          buildingNum: "1",
          attributes: [
            { label: "Improvement Type", value: "Triplex: Three Family" },
          ],
        },
      ],
    };
    expect(resolveDwellingCount(record)).toEqual({
      n: 3,
      source: "improvement-type",
      sourceLabel: "building type: triplex",
    });
  });

  it("uses N=1 for typical SFR / condo accounts", () => {
    expect(
      resolveDwellingCount({
        landLines: [
          { units: "1.0000 LT", landUse: "Single Family Residential" },
        ],
        buildings: [
          {
            buildingNum: "1",
            attributes: [{ label: "Improvement Type", value: "Traditional" }],
          },
        ],
        stateUseCd: "1112",
      }),
    ).toMatchObject({ n: 1, source: "single-dwelling" });
  });

  it("returns null for APT multi without UB or Units (no invented N)", () => {
    expect(
      resolveDwellingCount({
        landLines: [{ units: "1.0000 LT", landUse: "APT Multi-Units (9+)" }],
        buildings: [
          {
            buildingNum: "1",
            attributes: [
              { label: "Improvement Type", value: "Apartment Mid Rise" },
            ],
          },
        ],
        stateUseCd: "2112",
      }),
    ).toBeNull();
  });

  it("returns null for empty / missing record", () => {
    expect(resolveDwellingCount(null)).toBeNull();
    expect(resolveDwellingCount({})).toBeNull();
  });
});

describe("equalSplitFromAnnualTax / monthlyFromAnnualTax", () => {
  it("splits whole-property annual into per-unit annual and monthly", () => {
    // 68 / 4 = 17 annual; 68 / 4 / 12 ≈ 1.42 → $1 monthly (whole dollars).
    expect(equalSplitFromAnnualTax(68, 4)).toEqual({
      annualPerUnitDollars: 17,
      monthlyPerUnitDollars: 1,
    });
    expect(monthlyFromAnnualTax(68)).toBe(6);
  });

  it("rejects invalid inputs", () => {
    expect(equalSplitFromAnnualTax(68, 0)).toBeNull();
    expect(monthlyFromAnnualTax(-1)).toBeNull();
  });
});

describe("levyDollarsForAudience", () => {
  it("keeps whole-account dollars when N is unknown", () => {
    expect(levyDollarsForAudience(68, null)).toBe(68);
    expect(levyDollarsForAudience(68, undefined)).toBe(68);
  });

  it("equal-splits when N is known", () => {
    expect(perUnitShareWholeDollars(68, 4)).toBe(17);
    expect(levyDollarsForAudience(68, 4)).toBe(17);
    expect(levyDollarsForAudience(68, 1)).toBe(68);
  });

  it("uses monthly whole dollars in Rent", () => {
    expect(levyDisplayDollarsForAudience(68, 4, false)).toBe(17);
    expect(levyDisplayDollarsForAudience(68, 4, true)).toBe(1);
    expect(levyDisplayDollarsForAudience(68, null, true)).toBe(6);
  });
});
