// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Positive finite assessed value for dollar estimates; otherwise null (no fake $0). */
export function parcelAssessedForDollarEstimate(
  v: number | null | undefined,
): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return v;
}

/** Colorado-style: annual tax ≈ assessed × (mills / 1000), rounded to whole dollars. */
export function annualTaxDollarsFromAssessedMills(
  assessed: number,
  mills: number,
): number {
  return Math.round(assessed * (mills / 1000));
}
