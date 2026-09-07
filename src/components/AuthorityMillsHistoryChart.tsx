// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Inline SVG mill-rate timeline for levy tile details (Levy % AUTH totals).
 * Renders only when the parent passes a series with at least two points.
 * Year dots and endpoint readouts show mills first; when valuation history
 * provides assessed for that tax year, whole-dollar levy-line amounts appear
 * below the mills in the footer (annual in Own, monthly per-unit in Rent).
 * When `priorYearValuesGap` is on and the oldest year has no assessed, the
 * footer secondary row shows the Prior years missing badge (opt-in per county config).
 */

import { useMemo, useId } from "react";
import {
  AUTHORITY_MILLS_CHART_VIEWBOX,
  authorityMillsChartAriaLabel,
  buildAuthorityMillsChartLayout,
} from "@/lib/authorityMillsChartLayout";
import type { AuthorityMillsSeriesPoint } from "@/lib/authorityMillsHistory";
import {
  AUTHORITY_MILLS_HISTORY_CHART_HEADING,
} from "@/content/levyYoYCopy";
import { CountyPriorYearValuesGapPopover } from "@/components/CountyPriorYearValuesGapPopover";
import { InfoHintPopover } from "@/components/InfoHintPopover";
import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { formatTaxYearLabel } from "@/lib/metroLevyYearOverYear";
import {
  assessedForLevyTaxYear,
  levyLineDisplayDollars,
  type LevyDollarAssessedContext,
  type LevyDollarAudience,
} from "@/lib/levyDollarAssessedContext";
import { formatUsdWhole } from "@/lib/formatUsd";
import {
  showMillsChartFooterLedger,
  showPriorYearGapOnMillsChartFooter,
} from "@/lib/authorityMillsChartFooter";

type Props = {
  series: AuthorityMillsSeriesPoint[];
  assessedContext?: LevyDollarAssessedContext | null;
  dollarAudience?: LevyDollarAudience;
  /** Opt-in county config: confirmed no public prior-year assessed (not hardcoded). */
  priorYearValuesGap?: boolean;
  /** Resident county for the Sources link (`?county=`). */
  countyId?: string | null;
  /** Same sale-history jump as the Assessed value gap badge when true. */
  hasSaleHistory?: boolean;
  /** Safe Assessor property-page URL when the account is loaded. */
  parcelRecordHref?: string | null;
};

function rentDollarSuffix(rentMode: boolean): string {
  return rentMode ? "/mo" : "";
}

function formatChartDollarLine(
  dollars: number,
  rentMode: boolean,
): string {
  return `${formatUsdWhole(dollars)}${rentDollarSuffix(rentMode)}`;
}

const CHART_FOOTER_MILLS_CLASS =
  "text-sm font-semibold tabular-nums text-slate-800 sm:text-[0.9375rem]";
const CHART_FOOTER_DOLLARS_CLASS =
  "text-base font-bold tabular-nums leading-none text-slate-900 sm:text-lg";
/** Ledger rule between mills (always shown) and dollars or gap badge below. */
const CHART_FOOTER_LEDGER_CLASS = "col-span-2 border-t border-slate-200/90";
const CHART_FOOTER_SECONDARY_CLASS = "flex min-w-0 items-center pt-1.5";

export function AuthorityMillsHistoryChart({
  series,
  assessedContext = null,
  dollarAudience,
  priorYearValuesGap = false,
  countyId = null,
  hasSaleHistory = false,
  parcelRecordHref = null,
}: Props) {
  const headingId = useId();
  const priorYearGapTriggerId = useId();
  const pointTriggerIdBase = useId().replace(/:/g, "");
  const gradientId = useId().replace(/:/g, "");
  const layout = useMemo(() => buildAuthorityMillsChartLayout(series), [series]);
  const rentMode = dollarAudience?.rentMode ?? false;

  const dollarsForPoint = useMemo(() => {
    const map = new Map<number, number>();
    for (const point of series) {
      const assessed = assessedForLevyTaxYear(assessedContext, point.taxYear);
      const dollars = levyLineDisplayDollars(
        assessed,
        point.mills,
        dollarAudience,
      );
      if (dollars != null) map.set(point.taxYear, dollars);
    }
    return map;
  }, [series, assessedContext, dollarAudience]);

  if (!layout || series.length < 2) return null;

  const first = series[0]!;
  const last = series[series.length - 1]!;
  const ariaLabel = authorityMillsChartAriaLabel(series);
  const { width, height } = AUTHORITY_MILLS_CHART_VIEWBOX;
  const oldestEndpointHasDollars =
    dollarsForPoint.get(first.taxYear) != null;
  const newestEndpointHasDollars =
    dollarsForPoint.get(last.taxYear) != null;
  const showPriorYearGapFooter = showPriorYearGapOnMillsChartFooter({
    priorYearValuesGap,
    oldestEndpointHasDollars,
    newestEndpointHasDollars,
    countyId,
  });
  const gapCountyId = String(countyId ?? "").trim().toLowerCase();
  const showFooterLedgerLine = showMillsChartFooterLedger({
    showPriorYearGap: showPriorYearGapFooter,
    oldestEndpointHasDollars,
    newestEndpointHasDollars,
  });

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
          const millsLabel = formatCountyLevyMillsDisplay(point.mills);
          const displayDollars = dollarsForPoint.get(point.taxYear) ?? null;
          const isLatest = point.taxYear === last.taxYear;
          const ariaParts = [yearLabel, `${millsLabel} mills`];
          if (displayDollars != null) {
            ariaParts.push(formatChartDollarLine(displayDollars, rentMode));
          }
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
                textTriggerAriaLabel={ariaParts.join(", ")}
                ariaLabel={`${yearLabel} mill rate`}
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
                <p className="mt-0.5 tabular-nums">{millsLabel} mills</p>
                {displayDollars != null ? (
                  <p className="mt-0.5 tabular-nums font-semibold text-slate-900">
                    {formatChartDollarLine(displayDollars, rentMode)}
                  </p>
                ) : null}
              </InfoHintPopover>
            </span>
          );
        })}
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 tabular-nums">
        {[first, last].map((point, index) => (
          <dt
            key={`year-${point.taxYear}`}
            className={`text-xs text-slate-500 ${index === 1 ? "text-right" : ""}`}
          >
            {formatTaxYearLabel(point.taxYear)}
          </dt>
        ))}
        {[first, last].map((point, index) => (
          <dd
            key={`mills-${point.taxYear}`}
            className={`${CHART_FOOTER_MILLS_CLASS} ${index === 1 ? "text-right" : ""}`}
          >
            {formatCountyLevyMillsDisplay(point.mills)} mills
          </dd>
        ))}
        {showFooterLedgerLine ? (
          <dd aria-hidden="true" className={CHART_FOOTER_LEDGER_CLASS} />
        ) : null}
        {[first, last].map((point, index) => {
          const displayDollars = dollarsForPoint.get(point.taxYear) ?? null;
          const showGapBadge = index === 0 && showPriorYearGapFooter;
          return (
            <dd
              key={`secondary-${point.taxYear}`}
              className={`${CHART_FOOTER_SECONDARY_CLASS} ${index === 1 ? "justify-end" : ""}`}
            >
              {showGapBadge ? (
                <CountyPriorYearValuesGapPopover
                  countyId={gapCountyId}
                  hasSaleHistory={hasSaleHistory}
                  parcelRecordHref={parcelRecordHref}
                  textTriggerId={priorYearGapTriggerId}
                />
              ) : displayDollars != null ? (
                <span className={CHART_FOOTER_DOLLARS_CLASS}>
                  {formatChartDollarLine(displayDollars, rentMode)}
                </span>
              ) : null}
            </dd>
          );
        })}
      </dl>
    </div>
  );
}
