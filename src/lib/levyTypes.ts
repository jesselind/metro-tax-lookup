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
  name: string;
  type: string;
  aggregates?: { opsMills?: number; debtMills?: number; totalMills?: number };
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
