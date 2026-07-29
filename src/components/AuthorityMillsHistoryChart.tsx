// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Inline SVG mill-rate timeline for levy tile details (Levy % AUTH totals).
 * Renders only when the parent passes a series with at least two points.
 */

import { useMemo, useId } from "react";
import {
  AUTHORITY_MILLS_CHART_VIEWBOX,
  authorityMillsChartAriaLabel,
  buildAuthorityMillsChartLayout,
} from "@/lib/authorityMillsChartLayout";
import type { AuthorityMillsSeriesPoint } from "@/lib/authorityMillsHistory";
import {
  AUTHORITY_MILLS_HISTORY_CHART_CAPTION,
  AUTHORITY_MILLS_HISTORY_CHART_HEADING,
} from "@/content/levyYoYCopy";
import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { formatTaxYearLabel } from "@/lib/metroLevyYearOverYear";

type Props = {
  series: AuthorityMillsSeriesPoint[];
};

export function AuthorityMillsHistoryChart({ series }: Props) {
  const headingId = useId();
  const gradientId = useId().replace(/:/g, "");
  const layout = useMemo(() => buildAuthorityMillsChartLayout(series), [series]);
  if (!layout || series.length < 2) return null;

  const first = series[0]!;
  const last = series[series.length - 1]!;
  const ariaLabel = authorityMillsChartAriaLabel(series);
  const { width, height } = AUTHORITY_MILLS_CHART_VIEWBOX;

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
        {AUTHORITY_MILLS_HISTORY_CHART_HEADING}
      </p>
      <p className="mt-1 text-sm leading-snug text-slate-600 sm:text-[0.9375rem]">
        {AUTHORITY_MILLS_HISTORY_CHART_CAPTION}
      </p>

      <div className="mt-2 w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="auto"
          className="block max-h-36 w-full text-slate-600"
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

            {layout.points.map((point) => (
              <g key={point.taxYear}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.taxYear === last.taxYear ? 4.5 : 3.5}
                  fill={point.taxYear === last.taxYear ? "rgb(2 132 199)" : "white"}
                  stroke="rgb(2 132 199)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
                {point.showYearLabel ? (
                  <text
                    x={point.x}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px] font-medium"
                    style={{ fontSize: 10 }}
                  >
                    {point.taxYear}
                  </text>
                ) : null}
              </g>
            ))}
          </g>
        </svg>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm tabular-nums text-slate-800 sm:text-[0.9375rem]">
        <div className="min-w-0">
          <dt className="text-xs text-slate-500">{formatTaxYearLabel(first.taxYear)}</dt>
          <dd className="font-semibold">
            {formatCountyLevyMillsDisplay(first.mills)} mills
          </dd>
        </div>
        <div className="min-w-0 text-right">
          <dt className="text-xs text-slate-500">{formatTaxYearLabel(last.taxYear)}</dt>
          <dd className="font-semibold">
            {formatCountyLevyMillsDisplay(last.mills)} mills
          </dd>
        </div>
      </dl>
    </div>
  );
}
