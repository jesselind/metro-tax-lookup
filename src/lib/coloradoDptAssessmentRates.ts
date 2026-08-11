// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Residential DPT assessment rate *display* labels for UI copy (2026).
 * Keep in sync with `COLORADO_LOCAL_ASSESSED_RATE` / `COLORADO_SCHOOL_ASSESSED_RATE`
 * in `tools/build_arapahoe_parcel_levy_index.py` (those numerics are fixed for all
 * AssessmentYear >= 2025 until a year→rate map is added). Update both when DPT
 * publishes a new assessment-year rate pair.
 */
export const COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL = "6.8%";
export const COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL = "7.05%";

/**
 * Colorado personal property assessment rate label by assessment year
 * (Assessors' Library Vol. 5 / DPT schedule).
 * 2023–2024 temporary 27.9%; then 27% (2025), 26% (2026), 25% (2027+).
 * Non-integer years (e.g. 2026.5) return null — only whole assessment years map.
 */
export function coloradoPersonalPropertyAssessedRateLabel(
  assessmentYear: number | null | undefined,
): string | null {
  if (
    assessmentYear == null ||
    !Number.isFinite(assessmentYear) ||
    !Number.isInteger(assessmentYear) ||
    assessmentYear < 1900 ||
    assessmentYear > 2100
  ) {
    return null;
  }
  if (assessmentYear >= 2027) return "25%";
  if (assessmentYear === 2026) return "26%";
  if (assessmentYear === 2025) return "27%";
  if (assessmentYear === 2024 || assessmentYear === 2023) return "27.9%";
  return "29%";
}
