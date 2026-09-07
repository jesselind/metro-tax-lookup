// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Pure SVG layout helpers for the valuation history chart (assessed / actual).
 * Mirrors authorityMillsChartLayout without a chart library.
 */

import { authorityMillsChartYearLabelIndices } from "@/lib/authorityMillsChartLayout";

export const VALUATION_HISTORY_CHART_VIEWBOX = {
  width: 320,
  height: 116,
} as const;

export const VALUATION_HISTORY_CHART_PADDING = {
  top: 8,
  right: 0,
  bottom: 24,
  left: 0,
} as const;

export type ValuationHistoryChartSeriesPoint = {
  taxYear: number;
  value: number;
};

export type ValuationHistoryChartLayoutPoint = ValuationHistoryChartSeriesPoint & {
  x: number;
  y: number;
  showYearLabel: boolean;
  yearLabelAnchor: "start" | "middle" | "end";
};

export type ValuationHistoryChartLayout = {
  points: ValuationHistoryChartLayoutPoint[];
  linePath: string;
  fillBaselineY: number;
};

function yRangePadding(values: number[]): { yMin: number; yMax: number } {
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  if (rawMin === rawMax) {
    const pad = Math.max(500, rawMin * 0.02);
    return { yMin: rawMin - pad, yMax: rawMax + pad };
  }
  const span = rawMax - rawMin;
  const pad = Math.max(span * 0.08, 1);
  return { yMin: rawMin - pad, yMax: rawMax + pad };
}

export function buildValuationHistoryChartLayout(
  series: ValuationHistoryChartSeriesPoint[],
): ValuationHistoryChartLayout | null {
  if (series.length < 2) return null;

  const { width, height } = VALUATION_HISTORY_CHART_VIEWBOX;
  const pad = VALUATION_HISTORY_CHART_PADDING;
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const { yMin, yMax } = yRangePadding(series.map((point) => point.value));
  const ySpan = yMax - yMin || 1;
  const labelIndices = new Set(
    authorityMillsChartYearLabelIndices(series.length),
  );

  const points: ValuationHistoryChartLayoutPoint[] = series.map(
    (point, index) => {
      const x =
        pad.left +
        (series.length === 1
          ? plotWidth / 2
          : (index / (series.length - 1)) * plotWidth);
      const y =
        pad.top + plotHeight - ((point.value - yMin) / ySpan) * plotHeight;
      const yearLabelAnchor =
        index === 0 ? "start" : index === series.length - 1 ? "end" : "middle";
      return {
        ...point,
        x,
        y,
        showYearLabel: labelIndices.has(index),
        yearLabelAnchor,
      };
    },
  );

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return {
    points,
    linePath,
    fillBaselineY: height - pad.bottom,
  };
}

export function valuationHistoryChartAriaLabel(
  series: ValuationHistoryChartSeriesPoint[],
  valueLabel: string,
): string {
  if (series.length === 0) {
    return `No ${valueLabel.toLowerCase()} history available.`;
  }
  const first = series[0]!;
  const last = series[series.length - 1]!;
  return `${valueLabel} from Tax Year ${first.taxYear} to Tax Year ${last.taxYear}. Year markers on the chart open that year's value.`;
}
