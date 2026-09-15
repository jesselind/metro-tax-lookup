// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from "vitest";
import { annualTaxDollarsFromAssessedMills } from "@/lib/annualTaxFromAssessedMills";
import {
  annualTaxDollarsForLevyLine,
  annualTaxDollarsForLevyStack,
  assessedBaseForLevyLine,
  isSchoolAuthorityLevyLine,
} from "@/lib/levyLineAssessedBase";
import { realwareTaxDollarsTotal } from "@/lib/propertyTaxEstimate";

/** Matches tools/fixtures/douglas_realware_detail_synthetic_split_rate.json after extract. */
const SYNTHETIC_SPLIT_RATE_FACE = {
  taxYear: 2026,
  actualValue: 380000,
  assessedValue: 27170,
  alternateAssessedValue: 26790,
  taxDollars: 1300,
  alternateTaxDollars: 1200,
} as const;

describe("assessedBaseForLevyLine", () => {
  it("uses local for every line when school assessed is missing", () => {
    expect(
      assessedBaseForLevyLine({
        localAssessed: 27170,
        schoolAssessed: null,
        lineIsSchoolAuthority: true,
      }),
    ).toBe(27170);
    expect(
      assessedBaseForLevyLine({
        localAssessed: 27170,
        schoolAssessed: undefined,
        lineIsSchoolAuthority: false,
      }),
    ).toBe(27170);
  });

  it("uses local for every line when school equals local", () => {
    expect(
      assessedBaseForLevyLine({
        localAssessed: 27170,
        schoolAssessed: 27170,
        lineIsSchoolAuthority: true,
      }),
    ).toBe(27170);
  });

  it("uses school assessed only for school authority lines when bases differ", () => {
    expect(
      assessedBaseForLevyLine({
        localAssessed: 27170,
        schoolAssessed: 26790,
        lineIsSchoolAuthority: true,
      }),
    ).toBe(26790);
    expect(
      assessedBaseForLevyLine({
        localAssessed: 27170,
        schoolAssessed: 26790,
        lineIsSchoolAuthority: false,
      }),
    ).toBe(27170);
  });
});

describe("isSchoolAuthorityLevyLine", () => {
  it("classifies SCHOOL DIST names as school", () => {
    expect(
      isSchoolAuthorityLevyLine({
        authorityName: "SYNTHETIC SCHOOL DIST # 99",
      }),
    ).toBe(true);
    expect(
      isSchoolAuthorityLevyLine({
        authorityName: "Invented County Fire Protection District",
      }),
    ).toBe(false);
  });

  it("classifies Schools debt / reserve style labels as school", () => {
    expect(
      isSchoolAuthorityLevyLine({
        authorityName: "Invented County Schools - Debt Service",
      }),
    ).toBe(true);
    expect(
      isSchoolAuthorityLevyLine({
        authorityName: "Invented County Schools - Cap Reserve",
      }),
    ).toBe(true);
  });

  it("classifies via DOLA matched legal name when authority label is opaque", () => {
    expect(
      isSchoolAuthorityLevyLine({
        authorityName: "AUTH CODE ONLY",
        dolaMatchedLegalName: "Invented 99 School District",
      }),
    ).toBe(true);
  });

  it("classifies curated authority-chain school family", () => {
    expect(
      isSchoolAuthorityLevyLine({
        authorityName: "CHERRY CRK SCHOOL DIST 5",
        levyLineCode: "0501",
        countyId: "arapahoe",
      }),
    ).toBe(true);
  });
});

describe("annualTaxDollarsForLevyStack dual-base reconciliation", () => {
  it("sums to Realware face total on synthetic split-rate history", () => {
    const local = SYNTHETIC_SPLIT_RATE_FACE.assessedValue;
    const school = SYNTHETIC_SPLIT_RATE_FACE.alternateAssessedValue;
    const face = realwareTaxDollarsTotal(SYNTHETIC_SPLIT_RATE_FACE);
    expect(face).toBe(2500);

    // Mills chosen so per-line rounding recovers taxDollars + alternateTaxDollars.
    const schoolMills = (1200 * 1000) / school;
    const localMills = (1300 * 1000) / local;
    const lines = [
      {
        authority: "SYNTHETIC SCHOOL DIST # 99",
        mills: schoolMills,
      },
      {
        authority: "SYNTHETIC COUNTY",
        mills: localMills,
      },
    ];

    const stack = annualTaxDollarsForLevyStack(lines, local, school);
    expect(face).not.toBeNull();
    expect(stack).toBe(face!);

    const singleBase = annualTaxDollarsFromAssessedMills(
      local,
      schoolMills + localMills,
    );
    expect(singleBase).not.toBe(face!);
    expect(Math.abs(stack - face!)).toBeLessThanOrEqual(1);
  });

  it("matches Realware face when school debt line uses Schools label (bucket round)", () => {
    // Shape mirrors a dual-rate stack where general + debt school lines share
    // school assessed; invented mills/assessed (not a real situs).
    const local = 43620;
    const school = 45230;
    const face = 2325 + 2059;
    const lines = [
      { authority: "Invented County Government", mills: 19.774 },
      { authority: "Invented County Law Enforcement", mills: 4.5 },
      { authority: "Invented Re-1 School District", mills: 39.752 },
      { authority: "Invented County Schools - Debt Service", mills: 5.776 },
      { authority: "Invented Urban Drainage", mills: 0.9 },
      { authority: "Invented Fire Protection District", mills: 12.25 },
      { authority: "Invented Public Library District", mills: 3.519 },
      { authority: "Invented Urban Drainage South", mills: 0.1 },
      { authority: "Invented Metro District", mills: 12.25 },
    ];
    expect(annualTaxDollarsForLevyStack(lines, local, school)).toBe(face);
    expect(
      isSchoolAuthorityLevyLine({
        authorityName: "Invented County Schools - Debt Service",
      }),
    ).toBe(true);
  });

  it("matches single-base when school equals local", () => {
    const assessed = 10000;
    const lines = [
      { authority: "SYNTHETIC SCHOOL DIST # 1", mills: 40 },
      { authority: "SYNTHETIC COUNTY", mills: 10 },
    ];
    const dual = annualTaxDollarsForLevyStack(lines, assessed, assessed);
    const single = annualTaxDollarsFromAssessedMills(assessed, 50);
    expect(dual).toBe(single);
  });

  it("uses school base for one school line", () => {
    expect(
      annualTaxDollarsForLevyLine(
        { authority: "SYNTHETIC SCHOOL DIST # 1", mills: 50 },
        20000,
        18000,
      ),
    ).toBe(annualTaxDollarsFromAssessedMills(18000, 50));
    expect(
      annualTaxDollarsForLevyLine(
        { authority: "SYNTHETIC COUNTY", mills: 50 },
        20000,
        18000,
      ),
    ).toBe(annualTaxDollarsFromAssessedMills(20000, 50));
  });
});
