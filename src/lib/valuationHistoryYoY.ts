// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { annualTaxDollarsFromAssessedMills } from "@/lib/annualTaxFromAssessedMills";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";
import {
  formatTaxYearLabel,
  type MetroYoYDirection,
} from "@/lib/metroLevyYearOverYear";
import { formatUsdWhole } from "@/lib/formatUsd";

export type ValuationValueKind = "assessed" | "actual";

const MIN_PERCENT_FOR_HEADLINE = 0.05;

export type ValuationYoYPair = {
  priorYear: number;
  currentYear: number;
  priorValue: number;
  currentValue: number;
  delta: number;
};

export type ValuationYoYSummary = {
  headline: string;
  direction: MetroYoYDirection;
  previousYearLabel: string;
  currentYearLabel: string;
  priorValueLabel: string;
  currentValueLabel: string;
  differenceLabel: string;
  /** Whole-dollar property tax change at current mills (assessed YoY only). */
  taxImpactDollars: number | null;
};

function valueForKind(
  point: CountyValuationHistoryPoint,
  kind: ValuationValueKind,
): number {
  return kind === "assessed" ? point.assessedValue : point.actualValue;
}

function valueLabelForKind(kind: ValuationValueKind): string {
  return kind === "assessed" ? "Assessed value" : "Actual value";
}

/** Prior tax year pair when history has at least two years. */
export function valuationYoYPairFromHistory(
  series: CountyValuationHistoryPoint[],
  currentValue: number | null | undefined,
  currentTaxYear: number | null | undefined,
  kind: ValuationValueKind,
): ValuationYoYPair | null {
  if (currentValue == null || !Number.isFinite(currentValue)) return null;
  if (series.length < 2) return null;

  const sorted = [...series].sort((a, b) => a.taxYear - b.taxYear);
  const latest = sorted.at(-1);
  if (!latest) return null;

  const year =
    currentTaxYear != null && Number.isFinite(currentTaxYear)
      ? currentTaxYear
      : latest.taxYear;
  const prior = sorted.filter((row) => row.taxYear < year).at(-1);
  if (!prior) return null;

  const priorValue = valueForKind(prior, kind);
  const delta = currentValue - priorValue;
  if (!Number.isFinite(delta)) return null;

  return {
    priorYear: prior.taxYear,
    currentYear: year,
    priorValue,
    currentValue,
    delta,
  };
}

export function valueDeltaFromHistory(
  series: CountyValuationHistoryPoint[],
  currentValue: number | null | undefined,
  currentTaxYear: number | null | undefined,
  kind: ValuationValueKind,
): number | null {
  const pair = valuationYoYPairFromHistory(
    series,
    currentValue,
    currentTaxYear,
    kind,
  );
  if (!pair || pair.delta === 0) return null;
  return pair.delta;
}

/** Prior tax year assessed delta when history has at least two years. */
export function assessedValueDeltaFromHistory(
  series: CountyValuationHistoryPoint[],
  currentAssessed: number | null | undefined,
  currentTaxYear: number | null | undefined,
): number | null {
  return valueDeltaFromHistory(
    series,
    currentAssessed,
    currentTaxYear,
    "assessed",
  );
}

/** Prior tax year actual delta when history has at least two years. */
export function actualValueDeltaFromHistory(
  series: CountyValuationHistoryPoint[],
  currentActual: number | null | undefined,
  currentTaxYear: number | null | undefined,
): number | null {
  return valueDeltaFromHistory(
    series,
    currentActual,
    currentTaxYear,
    "actual",
  );
}

function formatSignedUsd(delta: number): string {
  if (delta > 0) return `+${formatUsdWhole(delta)}`;
  return formatUsdWhole(delta);
}

function buildHeadline(
  delta: number,
  priorValue: number,
  valueLabel: string,
): { headline: string; direction: MetroYoYDirection } {
  if (delta === 0) {
    return {
      headline: `Same ${valueLabel.toLowerCase()} as last year`,
      direction: "neutral",
    };
  }

  const direction: MetroYoYDirection = delta > 0 ? "more" : "less";
  const directionWord = delta > 0 ? "higher" : "lower";
  const absDelta = Math.abs(delta);
  const percent =
    priorValue > 0 ? (absDelta / priorValue) * 100 : null;

  if (percent != null && percent >= MIN_PERCENT_FOR_HEADLINE) {
    return {
      headline: `${formatUsdWhole(absDelta)} ${directionWord} than last year (${percent.toFixed(1)}%)`,
      direction,
    };
  }

  return {
    headline: `${formatUsdWhole(absDelta)} ${directionWord} than last year`,
    direction,
  };
}

export function buildValuationYoYSummary(
  pair: ValuationYoYPair,
  kind: ValuationValueKind,
  totalMills: number | null | undefined,
): ValuationYoYSummary {
  const valueLabel = valueLabelForKind(kind);
  const { headline, direction } = buildHeadline(
    pair.delta,
    pair.priorValue,
    valueLabel,
  );

  let taxImpactDollars: number | null = null;
  if (
    kind === "assessed" &&
    pair.delta !== 0 &&
    totalMills != null &&
    Number.isFinite(totalMills) &&
    totalMills > 0
  ) {
    const priorTax = annualTaxDollarsFromAssessedMills(
      pair.priorValue,
      totalMills,
    );
    const currentTax = annualTaxDollarsFromAssessedMills(
      pair.currentValue,
      totalMills,
    );
    taxImpactDollars = currentTax - priorTax;
    if (taxImpactDollars === 0) taxImpactDollars = null;
  }

  return {
    headline,
    direction,
    previousYearLabel: formatTaxYearLabel(pair.priorYear),
    currentYearLabel: formatTaxYearLabel(pair.currentYear),
    priorValueLabel: formatUsdWhole(pair.priorValue),
    currentValueLabel: formatUsdWhole(pair.currentValue),
    differenceLabel: formatSignedUsd(pair.delta),
    taxImpactDollars,
  };
}

export function valuationChartSeries(
  series: CountyValuationHistoryPoint[],
  kind: ValuationValueKind,
): { taxYear: number; value: number }[] {
  return [...series]
    .sort((a, b) => a.taxYear - b.taxYear)
    .map((point) => ({
      taxYear: point.taxYear,
      value: valueForKind(point, kind),
    }));
}

export { valueLabelForKind };
