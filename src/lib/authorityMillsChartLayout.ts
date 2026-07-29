// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Pure SVG layout helpers for the levy modal mill-rate history chart.
 * Keeps coordinate math testable without a chart library.
 */

import type { AuthorityMillsSeriesPoint } from "@/lib/authorityMillsHistory";

export const AUTHORITY_MILLS_CHART_VIEWBOX = {
  width: 320,
  height: 116,
} as const;

export const AUTHORITY_MILLS_CHART_PADDING = {
  top: 8,
  right: 10,
  bottom: 24,
  left: 10,
} as const;

export type AuthorityMillsChartLayoutPoint = AuthorityMillsSeriesPoint & {
  x: number;
  y: number;
  showYearLabel: boolean;
};

export type AuthorityMillsChartLayout = {
  points: AuthorityMillsChartLayoutPoint[];
  linePath: string;
  fillBaselineY: number;
};

/** Pick year labels that stay readable on narrow screens (always first and last). */
export function authorityMillsChartYearLabelIndices(pointCount: number): number[] {
  if (pointCount <= 0) return [];
  if (pointCount <= 5) {
    return Array.from({ length: pointCount }, (_, index) => index);
  }
  const indices = new Set<number>([0, pointCount - 1]);
  const innerSlots = 3;
  for (let slot = 1; slot <= innerSlots; slot += 1) {
    indices.add(Math.round((slot * (pointCount - 1)) / (innerSlots + 1)));
  }
  return [...indices].sort((a, b) => a - b);
}

function yRangePadding(millsValues: number[]): { yMin: number; yMax: number } {
  const rawMin = Math.min(...millsValues);
  const rawMax = Math.max(...millsValues);
  if (rawMin === rawMax) {
    const pad = Math.max(0.5, rawMin * 0.02);
    return { yMin: rawMin - pad, yMax: rawMax + pad };
  }
  const span = rawMax - rawMin;
  const pad = Math.max(span * 0.08, 0.04);
  return { yMin: rawMin - pad, yMax: rawMax + pad };
}

/**
 * Map mill-rate series into SVG coordinates for a fixed viewBox.
 * Y increases downward in SVG; mills increase upward on the chart.
 */
export function buildAuthorityMillsChartLayout(
  series: AuthorityMillsSeriesPoint[],
): AuthorityMillsChartLayout | null {
  if (series.length < 2) return null;

  const { width, height } = AUTHORITY_MILLS_CHART_VIEWBOX;
  const pad = AUTHORITY_MILLS_CHART_PADDING;
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const { yMin, yMax } = yRangePadding(series.map((point) => point.mills));
  const ySpan = yMax - yMin || 1;
  const labelIndices = new Set(authorityMillsChartYearLabelIndices(series.length));

  const points: AuthorityMillsChartLayoutPoint[] = series.map((point, index) => {
    const x =
      pad.left +
      (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth);
    const y =
      pad.top + plotHeight - ((point.mills - yMin) / ySpan) * plotHeight;
    return {
      ...point,
      x,
      y,
      showYearLabel: labelIndices.has(index),
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return {
    points,
    linePath,
    fillBaselineY: height - pad.bottom,
  };
}

/** Screen-reader summary when the chart is rendered as role="img". */
export function authorityMillsChartAriaLabel(
  series: AuthorityMillsSeriesPoint[],
): string {
  if (series.length === 0) {
    return "No mill rate history available.";
  }
  const first = series[0]!;
  const last = series[series.length - 1]!;
  return `Mill rate from ${first.mills} mills in Tax Year ${first.taxYear} to ${last.mills} mills in Tax Year ${last.taxYear}.`;
}
