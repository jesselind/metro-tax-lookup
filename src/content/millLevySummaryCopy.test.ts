// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { millLevyAssessedExampleText } from "@/content/millLevySummaryCopy";

describe("millLevyAssessedExampleText", () => {
  it("uses this property's mills and assessed value", () => {
    expect(millLevyAssessedExampleText(106.202, 33_776)).toBe(
      "For example, your total mill levy of 106.202 means that you are being taxed $106.20 for every thousand dollars of your $33,776 assessed value.",
    );
  });

  it("is null when assessed value is missing", () => {
    expect(millLevyAssessedExampleText(106.202, 0)).toBeNull();
    expect(millLevyAssessedExampleText(106.202, Number.NaN)).toBeNull();
  });
});
