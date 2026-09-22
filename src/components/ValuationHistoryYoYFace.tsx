// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useId, useMemo } from "react";
import { ValuationHistoryChart } from "@/components/ValuationHistoryChart";
import {
  VALUATION_HISTORY_TAX_IMPACT_LEAD,
  VALUATION_HISTORY_TAX_IMPACT_LESS,
  VALUATION_HISTORY_TAX_IMPACT_MORE,
} from "@/content/valuationHistoryCopy";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";
import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { formatUsdWhole } from "@/lib/formatUsd";
import { levyYoYSurfaceClasses } from "@/lib/metroLevyYearOverYear";
import {
  buildValuationYoYSummary,
  valuationChartSeries,
  valuationYoYPairFromHistory,
  type ValuationValueKind,
} from "@/lib/valuationHistoryYoY";

export type ValuationHistoryYoYFaceProps = {
  valueKind: ValuationValueKind;
  series: CountyValuationHistoryPoint[];
  currentValue: number;
  currentTaxYear: number | null;
  totalMills: number | null;
};

function ValuationYoYYearCompare({
  previousYearLabel,
  currentYearLabel,
  priorValueLabel,
  currentValueLabel,
  differenceLabel,
  diffClassName,
}: {
  previousYearLabel: string;
  currentYearLabel: string;
  priorValueLabel: string;
  currentValueLabel: string;
  differenceLabel: string;
  diffClassName: string;
}) {
  const yearLabelClass =
    "text-sm font-semibold tracking-wide text-slate-600 sm:text-base";
  const valueClass =
    "font-mono text-xl font-bold tabular-nums leading-snug text-slate-900 sm:text-2xl";
  const diffClass = `mt-2.5 rounded-md px-2.5 py-2 text-base font-bold tabular-nums leading-snug sm:px-3 sm:py-2.5 sm:text-lg ${diffClassName}`;

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:gap-x-4 sm:gap-y-1.5">
        <p
          className={`min-w-0 border-r border-slate-300/80 pr-3 sm:pr-4 ${yearLabelClass}`}
        >
          {previousYearLabel}
        </p>
        <p className={`min-w-0 ${yearLabelClass}`}>{currentYearLabel}</p>
        <p
          className={`min-w-0 border-r border-slate-300/80 pr-3 sm:pr-4 ${valueClass}`}
        >
          {priorValueLabel}
        </p>
        <p className={`min-w-0 ${valueClass}`}>{currentValueLabel}</p>
      </div>
      <p className={diffClass}>Difference: {differenceLabel}</p>
    </>
  );
}

/**
 * Kind-card body after the field label: always-visible prior|current|Difference
 * (red up / green down / slate flat), optional tax-impact line, then chart.
 * Fills the card and pins the chart to the bottom so peer Appraised|Assessed
 * charts stay aligned when only one side has a tax-impact line.
 * No Total $ duplicate and no YoY badge disclosure.
 */
export function ValuationHistoryYoYFace({
  valueKind,
  series,
  currentValue,
  currentTaxYear,
  totalMills,
}: ValuationHistoryYoYFaceProps) {
  const yoyHeadingId = useId();

  const yoyPair = useMemo(
    () =>
      valuationYoYPairFromHistory(
        series,
        currentValue,
        currentTaxYear,
        valueKind,
      ),
    [series, currentValue, currentTaxYear, valueKind],
  );

  const yoySummary = useMemo(
    () =>
      yoyPair
        ? buildValuationYoYSummary(yoyPair, valueKind, totalMills)
        : null,
    [yoyPair, valueKind, totalMills],
  );

  const chartSeries = useMemo(
    () => valuationChartSeries(series, valueKind),
    [series, valueKind],
  );

  const yoySurface = levyYoYSurfaceClasses(yoySummary?.direction ?? "neutral");

  const taxImpactDollars = yoySummary?.taxImpactDollars ?? null;
  const showTaxImpact =
    taxImpactDollars != null && totalMills != null && totalMills > 0;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      {yoySummary != null ? (
        <div
          role="region"
          aria-labelledby={yoyHeadingId}
          className="min-w-0"
        >
          <h3 id={yoyHeadingId} className="sr-only">
            {yoySummary.headline}
          </h3>
          <ValuationYoYYearCompare
            previousYearLabel={yoySummary.previousYearLabel}
            currentYearLabel={yoySummary.currentYearLabel}
            priorValueLabel={yoySummary.priorValueLabel}
            currentValueLabel={yoySummary.currentValueLabel}
            differenceLabel={yoySummary.differenceLabel}
            diffClassName={yoySurface.diff}
          />
          {showTaxImpact && taxImpactDollars != null && totalMills != null ? (
            <p className="mt-3 text-sm font-medium leading-snug text-slate-800 sm:text-base">
              {VALUATION_HISTORY_TAX_IMPACT_LEAD}{" "}
              {formatUsdWhole(Math.abs(taxImpactDollars))}{" "}
              {taxImpactDollars > 0
                ? VALUATION_HISTORY_TAX_IMPACT_MORE
                : VALUATION_HISTORY_TAX_IMPACT_LESS}{" "}
              ({formatCountyLevyMillsDisplay(totalMills)} mills)
            </p>
          ) : null}
        </div>
      ) : null}

      {chartSeries.length >= 2 ? (
        <div className="mt-auto min-w-0">
          <ValuationHistoryChart
            series={chartSeries}
            valueKind={valueKind}
            embedded
          />
        </div>
      ) : null}
    </div>
  );
}
