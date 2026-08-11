// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { coloradoPersonalPropertyAssessedRateLabel } from "./coloradoDptAssessmentRates";

describe("coloradoPersonalPropertyAssessedRateLabel", () => {
  it("maps known integer assessment years", () => {
    expect(coloradoPersonalPropertyAssessedRateLabel(2023)).toBe("27.9%");
    expect(coloradoPersonalPropertyAssessedRateLabel(2024)).toBe("27.9%");
    expect(coloradoPersonalPropertyAssessedRateLabel(2025)).toBe("27%");
    expect(coloradoPersonalPropertyAssessedRateLabel(2026)).toBe("26%");
    expect(coloradoPersonalPropertyAssessedRateLabel(2027)).toBe("25%");
    expect(coloradoPersonalPropertyAssessedRateLabel(2030)).toBe("25%");
    expect(coloradoPersonalPropertyAssessedRateLabel(2022)).toBe("29%");
  });

  it("rejects null, out-of-range, and non-integer years", () => {
    expect(coloradoPersonalPropertyAssessedRateLabel(null)).toBeNull();
    expect(coloradoPersonalPropertyAssessedRateLabel(undefined)).toBeNull();
    expect(coloradoPersonalPropertyAssessedRateLabel(1899)).toBeNull();
    expect(coloradoPersonalPropertyAssessedRateLabel(2101)).toBeNull();
    expect(coloradoPersonalPropertyAssessedRateLabel(Number.NaN)).toBeNull();
    expect(coloradoPersonalPropertyAssessedRateLabel(2026.5)).toBeNull();
    expect(coloradoPersonalPropertyAssessedRateLabel(2027.1)).toBeNull();
  });
});
