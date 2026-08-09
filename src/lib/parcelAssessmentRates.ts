// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * DPT assessment rates by property classification (2026 chart).
 * Keep numerics in sync with `tools/build_arapahoe_parcel_levy_index.py`.
 *
 * Residential uses dual local (6.8%) and school (7.05%) rates from 2025+.
 * Non-residential uses a single chart rate; school assessed does not apply.
 */

import type { ArapahoeParcelRecordRow } from "@/lib/arapahoeParcelLevyData";
import {
  COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL,
  COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL,
  coloradoPersonalPropertyAssessedRateLabel,
} from "@/lib/coloradoDptAssessmentRates";

export const COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE = 0.068;
export const COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE = 0.0705;
export const DUAL_ASSESSED_MIN_ASSESSMENT_YEAR = 2025;

export type ParcelAssessmentRateMode = "residential_dual" | "single_rate" | "none";

export type ParcelAssessmentProfile = {
  mode: ParcelAssessmentRateMode;
  /** Shown in assessed value row header when mode is single_rate. */
  assessedRateLabel: string | null;
  showSchoolAssessedRow: boolean;
};

export type ParcelValueColumn = {
  total?: number | null;
  building?: number | null;
  land?: number | null;
};

export type ParcelValueTableRowKind = "appraised" | "assessed" | "assessed-school";

export type ParcelValueTableRow = {
  kind: ParcelValueTableRowKind;
  values: ParcelValueColumn;
  /** Parenthetical rate on assessed rows (e.g. 6.8%, 25%). */
  rateLabel?: string | null;
};

function positiveActual(val: number | null | undefined): number {
  if (val == null || !Number.isFinite(val) || val <= 0) return 0;
  return val;
}

function parseAssessmentYear(year: string | null | undefined): number | null {
  const s = (year ?? "").trim();
  if (!s) return null;
  const y = Number.parseInt(s, 10);
  return Number.isFinite(y) && y >= 1900 && y <= 2100 ? y : null;
}

/** State use `1xxx` is residential for DPT assessment-rate rules. */
export function isResidentialStateUseCode(
  stateUseCd: string | null | undefined,
): boolean {
  const code = (stateUseCd ?? "").trim().replace(/\.0+$/, "");
  return code.length > 0 && code.startsWith("1");
}

/**
 * Single DPT chart rate label for non-residential state use (2026).
 * Returns null when the code does not map cleanly to a chart row (exempt
 * `9xxx`, mines/oil, missing code) so the UI does not invent a percent.
 * Proportional building/land splits still use the mart total assessed.
 */
export function nonResidentialAssessedRateLabel(
  stateUseCd: string | null | undefined,
  improvementActual: number | null | undefined,
): string | null {
  const code = (stateUseCd ?? "").trim().replace(/\.0+$/, "");
  if (!code) return null;
  const hasImprovement = positiveActual(improvementActual) > 0;
  const prefix = code[0] ?? "";
  // DPT / Assessors' Library class prefixes (2026 chart + Chapter 6).
  if (prefix === "0") return "26%"; // vacant land
  if (prefix === "2") return hasImprovement ? "25%" : "26%"; // commercial
  if (prefix === "3") return "26%"; // industrial
  if (prefix === "4") return "25%"; // agricultural
  if (prefix === "5") return "26%"; // natural resources
  if (prefix === "8") return "26%"; // state assessed
  // 6/7 mines & oil/gas use special formulas; 9xxx exempt is "according to use".
  return null;
}

export function resolveParcelAssessmentProfile(
  record: Pick<
    ArapahoeParcelRecordRow,
    | "stateUseCd"
    | "taxRollDescr"
    | "propertyClassDescr"
    | "assessmentYear"
    | "improvementActual"
  >,
): ParcelAssessmentProfile {
  const year = parseAssessmentYear(record.assessmentYear);
  const taxRoll = (record.taxRollDescr ?? "").trim().toUpperCase();
  const isReal = taxRoll === "REAL";
  const isPersonal =
    taxRoll === "PERSONAL" ||
    (taxRoll.length === 0 &&
      ["PERSONAL", "PERSPROP"].includes(
        (record.propertyClassDescr ?? "").trim().toUpperCase(),
      ));
  const isImprovement =
    (record.propertyClassDescr ?? "").trim() === "Improvement";
  const residential = isResidentialStateUseCode(record.stateUseCd);

  // Business personal property: flat DPT personal-property rate by year (not
  // the Real state-use chart). Totals stay mart totals; no building/land split.
  if (isPersonal) {
    return {
      mode: "single_rate",
      assessedRateLabel: coloradoPersonalPropertyAssessedRateLabel(year),
      showSchoolAssessedRow: false,
    };
  }

  if (!isReal || year == null || year < DUAL_ASSESSED_MIN_ASSESSMENT_YEAR) {
    return {
      mode: "none",
      assessedRateLabel: null,
      showSchoolAssessedRow: false,
    };
  }

  if (!residential) {
    return {
      mode: "single_rate",
      assessedRateLabel: nonResidentialAssessedRateLabel(
        record.stateUseCd,
        record.improvementActual,
      ),
      showSchoolAssessedRow: false,
    };
  }

  return {
    mode: "residential_dual",
    assessedRateLabel: COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL,
    showSchoolAssessedRow: isImprovement,
  };
}

function roundSchoolComponent(actual: number | null | undefined): number | null {
  if (actual == null || !Number.isFinite(actual)) return null;
  return Math.round(actual * COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE);
}

/** Residential local assessed land/building (6.8% on land; building = remainder). */
export function residentialLocalAssessedSplit(
  improvementActual: number | null | undefined,
  landActual: number | null | undefined,
  totalAssessed: number | null | undefined,
): ParcelValueColumn {
  if (totalAssessed == null || !Number.isFinite(totalAssessed)) {
    return { total: null, building: null, land: null };
  }
  const totalInt = Math.round(totalAssessed);
  const imp = positiveActual(improvementActual);
  const land = positiveActual(landActual);
  if (imp === 0 && land > 0) {
    return { total: totalInt, building: 0, land: totalInt };
  }
  if (imp > 0 && land === 0) {
    return { total: totalInt, building: totalInt, land: 0 };
  }
  if (imp > 0 && land > 0) {
    const landAssessed = Math.round(
      land * COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE,
    );
    return {
      total: totalInt,
      land: landAssessed,
      building: Math.max(0, totalInt - landAssessed),
    };
  }
  return { total: totalInt, building: null, land: null };
}

/** Non-residential: split mart total assessed in proportion to appraised actuals. */
export function nonResidentialAssessedSplit(
  improvementActual: number | null | undefined,
  landActual: number | null | undefined,
  totalActual: number | null | undefined,
  totalAssessed: number | null | undefined,
): ParcelValueColumn {
  if (totalAssessed == null || !Number.isFinite(totalAssessed)) {
    return { total: null, building: null, land: null };
  }
  const totalInt = Math.round(totalAssessed);
  const imp = positiveActual(improvementActual);
  const land = positiveActual(landActual);
  const actualTotal = positiveActual(totalActual);
  if (imp === 0 && land > 0) {
    return { total: totalInt, building: 0, land: totalInt };
  }
  if (imp > 0 && land === 0) {
    return { total: totalInt, building: totalInt, land: 0 };
  }
  if (imp > 0 && land > 0 && actualTotal > 0) {
    const buildingAssessed = Math.round(totalInt * (imp / actualTotal));
    return {
      total: totalInt,
      building: buildingAssessed,
      land: Math.max(0, totalInt - buildingAssessed),
    };
  }
  return { total: totalInt, building: null, land: null };
}

function residentialSchoolAssessedSplit(
  record: Pick<
    ArapahoeParcelRecordRow,
    "improvementActual" | "landActual" | "totalActual"
  >,
): ParcelValueColumn {
  const building = roundSchoolComponent(record.improvementActual);
  const land = roundSchoolComponent(record.landActual);
  if (building != null || land != null) {
    return {
      total: (building ?? 0) + (land ?? 0),
      building,
      land,
    };
  }
  const total = roundSchoolComponent(record.totalActual);
  return { total, building: null, land: null };
}

/**
 * Value table rows for the parcel record (appraised, assessed, optional school).
 * Rates and school row follow state use / tax roll, not hardcoded residential defaults.
 */
export function buildParcelValueTableRows(
  record: ArapahoeParcelRecordRow,
): ParcelValueTableRow[] {
  const profile = resolveParcelAssessmentProfile(record);
  const taxRoll = (record.taxRollDescr ?? "").trim().toUpperCase();
  const isPersonal =
    taxRoll === "PERSONAL" ||
    (taxRoll.length === 0 &&
      ["PERSONAL", "PERSPROP"].includes(
        (record.propertyClassDescr ?? "").trim().toUpperCase(),
      ));
  const rows: ParcelValueTableRow[] = [
    {
      kind: "appraised",
      values: {
        total: record.totalActual,
        building: isPersonal ? null : record.improvementActual,
        land: isPersonal ? null : record.landActual,
      },
    },
  ];

  const hasAssessed =
    record.totalAssessed != null && Number.isFinite(record.totalAssessed);
  if (hasAssessed) {
    let assessedValues: ParcelValueColumn;
    if (isPersonal) {
      assessedValues = {
        total: record.totalAssessed,
        building: null,
        land: null,
      };
    } else if (profile.mode === "residential_dual") {
      assessedValues = residentialLocalAssessedSplit(
        record.improvementActual,
        record.landActual,
        record.totalAssessed,
      );
    } else if (profile.mode === "single_rate") {
      assessedValues = nonResidentialAssessedSplit(
        record.improvementActual,
        record.landActual,
        record.totalActual,
        record.totalAssessed,
      );
    } else {
      assessedValues = {
        total: record.totalAssessed,
        building: record.assessedBuilding,
        land: record.assessedLand,
      };
    }
    rows.push({
      kind: "assessed",
      values: assessedValues,
      rateLabel: profile.assessedRateLabel,
    });
  }

  if (profile.showSchoolAssessedRow) {
    rows.push({
      kind: "assessed-school",
      values: residentialSchoolAssessedSplit(record),
      rateLabel: COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL,
    });
  }

  return rows;
}

export function schoolValueRowRateLabel(
  profile: ParcelAssessmentProfile,
): string | null {
  return profile.showSchoolAssessedRow
    ? COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL
    : null;
}
