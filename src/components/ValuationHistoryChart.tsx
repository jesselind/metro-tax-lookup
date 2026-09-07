// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useMemo, useId } from "react";
import {
  VALUATION_HISTORY_CHART_VIEWBOX,
  buildValuationHistoryChartLayout,
  valuationHistoryChartAriaLabel,
  type ValuationHistoryChartSeriesPoint,
} from "@/lib/valuationHistoryChartLayout";
import { formatTaxYearLabel } from "@/lib/metroLevyYearOverYear";
import { formatUsdWhole } from "@/lib/formatUsd";
import { InfoHintPopover } from "@/components/InfoHintPopover";
import type { ValuationValueKind } from "@/lib/valuationHistoryYoY";
import { valueLabelForKind } from "@/lib/valuationHistoryYoY";
import {
  VALUATION_HISTORY_CHART_HEADING_ACTUAL,
  VALUATION_HISTORY_CHART_HEADING_ASSESSED,
} from "@/content/valuationHistoryCopy";

type Props = {
  series: ValuationHistoryChartSeriesPoint[];
  valueKind: ValuationValueKind;
};

function chartHeading(kind: ValuationValueKind): string {
  return kind === "assessed"
    ? VALUATION_HISTORY_CHART_HEADING_ASSESSED
    : VALUATION_HISTORY_CHART_HEADING_ACTUAL;
}

export function ValuationHistoryChart({ series, valueKind }: Props) {
  const headingId = useId();
  const pointTriggerIdBase = useId().replace(/:/g, "");
  const gradientId = useId().replace(/:/g, "");
  const layout = useMemo(
    () => buildValuationHistoryChartLayout(series),
    [series],
  );
  if (!layout || series.length < 2) return null;

  const valueLabel = valueLabelForKind(valueKind);
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const ariaLabel = valuationHistoryChartAriaLabel(series, valueLabel);
  const { width, height } = VALUATION_HISTORY_CHART_VIEWBOX;

  return (
    <div
      className="rounded-lg border border-slate-200/95 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-sm sm:p-4"
      role="region"
      aria-labelledby={headingId}
    >
      <p
        id={headingId}
        className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs"
      >
        {chartHeading(valueKind)}
      </p>

      <div className="relative mt-2 w-full overflow-visible">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="auto"
          className="block h-auto w-full text-slate-600"
          role="img"
          aria-label={ariaLabel}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(14 165 233)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="rgb(14 165 233)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          <g aria-hidden="true">
            {layout.points.length > 1 ? (
              <path
                d={`${layout.linePath} L ${layout.points[layout.points.length - 1]!.x} ${layout.fillBaselineY} L ${layout.points[0]!.x} ${layout.fillBaselineY} Z`}
                fill={`url(#${gradientId})`}
                stroke="none"
              />
            ) : null}

            <path
              d={layout.linePath}
              fill="none"
              stroke="rgb(2 132 199)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            {layout.points.map((point) =>
              point.showYearLabel ? (
                <text
                  key={`year-${point.taxYear}`}
                  x={point.x}
                  y={height - 8}
                  textAnchor={point.yearLabelAnchor}
                  className="fill-slate-500 text-[10px] font-medium"
                  style={{ fontSize: 10 }}
                >
                  {point.taxYear}
                </text>
              ) : null,
            )}
          </g>
        </svg>

        {layout.points.map((point) => {
          const yearLabel = formatTaxYearLabel(point.taxYear);
          const valueDisplay = formatUsdWhole(point.value);
          const isLatest = point.taxYear === last.taxYear;
          return (
            <span
              key={point.taxYear}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(point.x / width) * 100}%`,
                top: `${(point.y / height) * 100}%`,
              }}
            >
              <InfoHintPopover
                textTriggerId={`${pointTriggerIdBase}-${point.taxYear}`}
                textTriggerClassName="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
                textTriggerAriaLabel={`${yearLabel}, ${valueDisplay}`}
                ariaLabel={`${yearLabel} ${valueLabel.toLowerCase()}`}
                customTrigger={
                  <span
                    className={`block rounded-full border-2 border-sky-600 ${
                      isLatest
                        ? "h-2.5 w-2.5 bg-sky-600"
                        : "h-2 w-2 bg-white"
                    }`}
                    aria-hidden="true"
                  />
                }
              >
                <p className="font-semibold text-slate-900">{yearLabel}</p>
                <p className="mt-0.5 tabular-nums">{valueDisplay}</p>
              </InfoHintPopover>
            </span>
          );
        })}
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm tabular-nums text-slate-800 sm:text-[0.9375rem]">
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">
            {formatTaxYearLabel(first.taxYear)}
          </dt>
          <dd className="font-semibold">{formatUsdWhole(first.value)}</dd>
        </div>
        <div className="min-w-0 text-right">
          <dt className="text-xs text-slate-500">
            {formatTaxYearLabel(last.taxYear)}
          </dt>
          <dd className="font-semibold">{formatUsdWhole(last.value)}</dd>
        </div>
      </dl>
    </div>
  );
}
