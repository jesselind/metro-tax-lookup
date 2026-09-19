// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { parcelRecordSubsectionPresence } from "@/lib/parcelRecordSubsectionPresence";
import type { CountyParcelRecordRow } from "@/lib/countyParcelLevyData";

function baseRecord(
  overrides: Partial<CountyParcelRecordRow> = {},
): CountyParcelRecordRow {
  return {
    taxRollDescr: "Real Property",
    ...overrides,
  } as CountyParcelRecordRow;
}

describe("parcelRecordSubsectionPresence", () => {
  it("returns empty when record is null", () => {
    expect(parcelRecordSubsectionPresence(null)).toEqual({
      appraisedAssessed: false,
      saleHistory: false,
      buildings: false,
      area: false,
      landLine: false,
      permits: false,
    });
  });

  it("BPP: values only", () => {
    expect(
      parcelRecordSubsectionPresence(
        baseRecord({ taxRollDescr: "Personal" }),
      ),
    ).toEqual({
      appraisedAssessed: true,
      saleHistory: false,
      buildings: false,
      area: false,
      landLine: false,
      permits: false,
    });
  });

  it("Real: sale always; buildings/area/land/permits by content", () => {
    expect(
      parcelRecordSubsectionPresence(
        baseRecord({
          buildings: [
            {
              buildingNum: "1",
              attributes: [{ label: "Units", value: "1" }],
              areas: [{ description: "Living", sqFt: "1000" }],
            },
          ],
          landLines: [{ units: "1", landUse: "Residential" }],
          permits: [{ permitNum: "P1" }],
        }),
      ),
    ).toEqual({
      appraisedAssessed: true,
      saleHistory: true,
      buildings: true,
      area: true,
      landLine: true,
      permits: true,
    });
  });
});
