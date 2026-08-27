// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  formatMartIntegerCodeDisplay,
  parcelTaxAndAssessmentYearsDiffer,
  parcelTaxAssessmentYearNote,
  summaryOwnerOfRecord,
} from "./parcelRecordDisplay";

describe("formatMartIntegerCodeDisplay", () => {
  it("strips Excel whole-number float suffixes without dropping leading zeros", () => {
    expect(formatMartIntegerCodeDisplay("54850.0")).toBe("54850");
    expect(formatMartIntegerCodeDisplay("54850.000")).toBe("54850");
    expect(formatMartIntegerCodeDisplay("0400")).toBe("0400");
    expect(formatMartIntegerCodeDisplay("1112")).toBe("1112");
  });

  it("returns null for blank input and leaves non-numeric codes alone", () => {
    expect(formatMartIntegerCodeDisplay(null)).toBeNull();
    expect(formatMartIntegerCodeDisplay("  ")).toBeNull();
    expect(formatMartIntegerCodeDisplay("ABC.0")).toBe("ABC.0");
  });
});

describe("parcelTaxAssessmentYearNote", () => {
  it("explains when tax year and assessment year differ", () => {
    expect(parcelTaxAssessmentYearNote("2025", "2026")).toBe(
      "Tax year is 2025. Value labels use assessment year 2026.",
    );
  });

  it("is silent when years match or either is missing", () => {
    expect(parcelTaxAssessmentYearNote("2026", "2026")).toBeNull();
    expect(parcelTaxAssessmentYearNote("2025", null)).toBeNull();
    expect(parcelTaxAssessmentYearNote("", "2026")).toBeNull();
  });
});

describe("parcelTaxAndAssessmentYearsDiffer", () => {
  it("is true only when both years are present and differ", () => {
    expect(parcelTaxAndAssessmentYearsDiffer("2025", "2026")).toBe(true);
    expect(parcelTaxAndAssessmentYearsDiffer("2026", "2026")).toBe(false);
    expect(parcelTaxAndAssessmentYearsDiffer("2025", null)).toBe(false);
  });
});

describe("summaryOwnerOfRecord", () => {
  it("prefers account-map owner, then parcel-record owner", () => {
    expect(summaryOwnerOfRecord("From Map", "From Record")).toBe("From Map");
    expect(summaryOwnerOfRecord(null, "From Record")).toBe("From Record");
    expect(summaryOwnerOfRecord("  ", "From Record")).toBe("From Record");
    expect(summaryOwnerOfRecord(null, null)).toBeNull();
  });
});
