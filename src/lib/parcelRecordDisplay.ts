// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Display helpers for parcel-record fields. Keep formatting rules here so the
 * panel, values table, and summary tiles stay consistent.
 */

/**
 * Strip Excel-ish whole-number float suffixes from mart codes ("54850.0" → "54850").
 * Does not parse as Number, so zero-padded codes like "0400" stay intact.
 */
export function formatMartIntegerCodeDisplay(
  raw: string | null | undefined,
): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const m = /^(-?\d+)\.0+$/.exec(t);
  return m ? m[1]! : t;
}

/**
 * Calm note when Main Parcel TaxYear and AssessmentYear differ.
 * Returns null when either is missing or they match.
 */
export function parcelTaxAssessmentYearNote(
  taxYear: string | null | undefined,
  assessmentYear: string | null | undefined,
): string | null {
  const tax = (taxYear ?? "").trim();
  const assess = (assessmentYear ?? "").trim();
  if (!tax || !assess || tax === assess) return null;
  return `Tax year on this parcel record is ${tax}. Value labels use assessment year ${assess} (the year on the county notice headers).`;
}
