// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { LevyLineFromJson } from "@/lib/levyTypes";

/** Ignore floating noise from JSON mill rates. */
export const METRO_LEVY_RATE_EPS = 1e-12;

export type MetroLevyBarSegment = {
  key: string;
  /** Mill levy name / purpose from the county PDF column. */
  label: string;
  mills: number;
  purposeCategory: string;
  rawRowIndex: number;
};

/** Tailwind background classes for stacked bar segments (cycles if many lines). */
export const METRO_BAR_SEGMENT_COLOR_CLASSES = [
  "bg-emerald-600",
  "bg-red-700",
  "bg-amber-500",
  "bg-violet-600",
  "bg-sky-600",
  "bg-fuchsia-600",
  "bg-lime-600",
  "bg-orange-600",
  "bg-cyan-600",
  "bg-indigo-600",
] as const;

export function metroBarSegmentColorClass(index: number): string {
  return METRO_BAR_SEGMENT_COLOR_CLASSES[
    index % METRO_BAR_SEGMENT_COLOR_CLASSES.length
  ];
}

/**
 * Bar + legend swatch from PDF purpose: bonds → red (was contractual slot), contractual
 * obligation → amber (was general operating slot), general operating → green (was bonds slot).
 * Other lines keep index-based cycling.
 */
export function metroBarSegmentPurposeSwatchClass(
  seg: MetroLevyBarSegment,
  segmentIndex: number,
): string {
  const raw = seg.label.trim();
  const p = raw.toLowerCase();

  if (p.includes("contractual obligation")) {
    return "bg-amber-500";
  }
  if (
    /\bbonds?\b/i.test(raw) ||
    /\bbond\s+redemption\b/i.test(p) ||
    /\bbond\s+pension\b/i.test(p) ||
    /\bbonds\s+debt\b/i.test(p) ||
    /\bbonds\s+aurora\b/i.test(p)
  ) {
    return "bg-red-700";
  }
  if (
    /\bgeneral\s+operating\b/i.test(p) ||
    /\btotal\s+program\b/i.test(p) ||
    /operations\s*&\s*technology/i.test(p) ||
    /operations\s+and\s+technology/i.test(p)
  ) {
    return "bg-emerald-600";
  }

  return metroBarSegmentColorClass(segmentIndex);
}

/**
 * UI label for the stacked bar and related copy. Every metro segment starts with
 * "Metro." (or "Metro total:" for the certified-only fallback) so "Everything else"
 * reads clearly as non-metro.
 */
export function metroBarSegmentDisplayLabel(seg: MetroLevyBarSegment): string {
  if (seg.key === "certified-fallback") {
    return "Metro total: certified";
  }
  const raw = seg.label.trim();
  if (raw === "") return "Metro. Levy line";
  if (/^metro\.\s/i.test(raw)) return raw;
  if (/^metro\s+total:/i.test(raw)) return raw;
  if (/^metro\b/i.test(raw)) return raw;
  return `Metro. ${raw}`;
}

/** Matches mill-levy purpose text that is clearly debt-related when the extractor used "other". */
const DEBT_PURPOSE_HINT =
  /\b(bonds?|debt\s*service|contractual\s+obligation|bond\s+redemption|pension\s+plan|regional\s+improvements)\b/i;

/**
 * Debt rows show the DEBT badge and debt-service subtitle. Uses extractor category
 * first; also treats obvious debt wording when the classifier used "other".
 */
export function isMetroLevyDebtService(seg: MetroLevyBarSegment): boolean {
  if (seg.purposeCategory === "debt_service") return true;
  const raw = seg.label.trim();
  if (/^total$/i.test(raw)) return false;
  return DEBT_PURPOSE_HINT.test(raw);
}

/** Short hint under the levy purpose, from extractor category. */
export function metroPurposeCategoryHint(category: string): string {
  switch (category) {
    case "operations":
      return "Grouped as operations on the county form";
    case "debt_service":
      return "Grouped as debt service on the county form";
    default:
      return "Other or mixed line on the county form";
  }
}

/** Subtitle under the legend; debt rows use the debt-service line (including keyword fallback). */
export function metroPurposeCategoryHintForSegment(
  seg: MetroLevyBarSegment,
): string {
  if (isMetroLevyDebtService(seg)) {
    return metroPurposeCategoryHint("debt_service");
  }
  return metroPurposeCategoryHint(seg.purposeCategory);
}

/**
 * One bar segment per PDF levy line with a positive current rate.
 * Sorted by mills (largest first), then PDF row index.
 */
export function buildMetroLevyBarSegments(
  levies: LevyLineFromJson[],
  rateToMills: number,
): MetroLevyBarSegment[] {
  return levies
    .filter((l) => (l.rateMillsCurrent ?? 0) > METRO_LEVY_RATE_EPS)
    .map((l) => {
      const raw = (l.purposeRaw ?? "").trim();
      return {
        key: `levy-row-${l.rawRowIndex}`,
        label: raw.length > 0 ? raw : "Levy line",
        mills: (l.rateMillsCurrent ?? 0) * rateToMills,
        purposeCategory: l.purposeCategory,
        rawRowIndex: l.rawRowIndex,
      };
    })
    .sort((a, b) => {
      if (b.mills !== a.mills) return b.mills - a.mills;
      return a.rawRowIndex - b.rawRowIndex;
    });
}
