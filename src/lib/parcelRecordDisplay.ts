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
  return `Tax year is ${tax}. Value labels use assessment year ${assess}.`;
}

/** True when both years are present and differ. */
export function parcelTaxAndAssessmentYearsDiffer(
  taxYear: string | null | undefined,
  assessmentYear: string | null | undefined,
): boolean {
  return parcelTaxAssessmentYearNote(taxYear, assessmentYear) != null;
}

/** Filing label for Property details: description when present, else recording number. */
export function formatParcelFilingDisplay(
  filingDescr: string | null | undefined,
  filingNo: string | null | undefined,
): string | null {
  const descr = (filingDescr ?? "").trim();
  const no = (filingNo ?? "").trim();
  if (descr && no) return `${descr} (${no})`;
  return descr || no || null;
}

/**
 * Owner of record for summary tiles: account map first (available at levy load),
 * then parcel-record shard when that lands (counties that only join ownership
 * into shards still get a tile once Property details loads).
 */
export function summaryOwnerOfRecord(
  accountMapOwner: string | null | undefined,
  parcelRecordOwner: string | null | undefined,
): string | null {
  const fromMap = (accountMapOwner ?? "").trim();
  if (fromMap) return fromMap;
  const fromRecord = (parcelRecordOwner ?? "").trim();
  return fromRecord || null;
}
