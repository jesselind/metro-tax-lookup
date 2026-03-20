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

export type LevyDataFile = {
  year: number;
  source?: { title?: string };
  districts: LevyDistrictFromJson[];
};
