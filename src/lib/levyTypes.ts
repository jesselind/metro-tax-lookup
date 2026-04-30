// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

export type LevyLineFromJson = {
  purposeRaw: string;
  purposeCategory: string;
  rateMillsCurrent: number;
  rateMillsPrevious: number | null;
  taborExempt: boolean | null;
  rawRowIndex: number;
};

export type LevyDistrictFromJson = {
  districtId: string;
  /** Colorado LG ID (DOLA / special district registry); present on metro rows in bundled JSON. */
  lgid?: string | null;
  countyId?: string | null;
  name: string;
  type: string;
  aggregates?: {
    opsMills?: number;
    debtMills?: number;
    /** Mills from levy lines not classified as operations or debt (e.g. summary "Total" rows). */
    otherMills?: number;
    totalMills?: number;
  };
  levies?: LevyLineFromJson[];
};

export type MetroDistrictOption = {
  id: string;
  name: string;
  debtMills: number;
  totalMills: number;
};

/** Set when the PDF is re-ingested; surfaced in the UI as "current as of". */
export type LevyDataSnapshot = {
  /** ISO calendar date (YYYY-MM-DD) when this JSON was generated from the county PDF. */
  bundledAsOf: string;
};

export type LevyDataFile = {
  year: number;
  source?: { title?: string };
  snapshot?: LevyDataSnapshot;
  districts: LevyDistrictFromJson[];
};
