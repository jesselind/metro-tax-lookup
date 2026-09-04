// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Message when any authority rate changed year over year (helper payload; not a dashboard banner). */
export const STACK_RATE_CHANGE_CALLOUT_MESSAGE =
  "Your property tax bill changed from last year.";

/**
 * Arapahoe: county bulk table + assessor guidance (no public valuation history).
 * Used for the default county and any wired county without Douglas-shaped copy.
 */
export const YOY_THEORETICAL_DOLLAR_POPOVER_BODY_ARAPAHOE =
  "County-published sources do not include prior-year assessed values. Per the assessor's office, there is no historical information available on the public website. These dollar amounts use this year's assessed value for both years.";

/**
 * @deprecated Prefer {@link yoyTheoreticalDollarPopoverCopy} with a county id.
 * Kept as the Arapahoe string for older imports and Arapahoe-only tests.
 */
export const YOY_THEORETICAL_DOLLAR_POPOVER_BODY =
  YOY_THEORETICAL_DOLLAR_POPOVER_BODY_ARAPAHOE;

/**
 * Douglas: history is on each Assessor property details page; a bulk download
 * of that history does not appear available for use here. Do not claim the
 * public site lacks history. File names and custom-report pricing stay on
 * /sources, not in this resident footnote.
 */
export const YOY_THEORETICAL_DOLLAR_POPOVER_BODY_DOUGLAS =
  "You can see full valuation history on each property's Assessor property details. A bulk download of that history does not appear to be available for use here. These dollar amounts use this year's assessed value for both years.";

/** Lead sentence before an optional property-page link (Douglas). */
export const YOY_THEORETICAL_DOLLAR_POPOVER_DOUGLAS_LEAD_BEFORE_LINK =
  "You can see full valuation history on";

/** Link label when a safe county property-page URL is available. */
export const YOY_THEORETICAL_DOLLAR_POPOVER_DOUGLAS_LINK_LABEL =
  "this property's Assessor property details";

/** Remainder after the Douglas property-page link (or after a plain “Assessor page”). */
export const YOY_THEORETICAL_DOLLAR_POPOVER_DOUGLAS_AFTER_LINK =
  ". A bulk download of that history does not appear to be available for use here. These dollar amounts use this year's assessed value for both years.";

/** Modal mill-rate history chart heading (Levy % AUTH totals). */
export const AUTHORITY_MILLS_HISTORY_CHART_HEADING =
  "Total mills from county property tax tables";

export type YoyTheoreticalDollarPopoverCopy = {
  /** Plain body when no property-page link should be shown. */
  plainBody: string;
  /**
   * When `parcelRecordHref` is set for Douglas, render lead + link + after.
   * Arapahoe (and default) always use `plainBody` only.
   */
  kind: "arapahoe" | "douglas";
};

/**
 * County-specific copy for the YoY “today's assessed value” dollar footnote popover.
 */
export function yoyTheoreticalDollarPopoverCopy(
  countyId: string | null | undefined,
): YoyTheoreticalDollarPopoverCopy {
  const id = String(countyId ?? "")
    .trim()
    .toLowerCase();
  if (id === "douglas") {
    return {
      kind: "douglas",
      plainBody: YOY_THEORETICAL_DOLLAR_POPOVER_BODY_DOUGLAS,
    };
  }
  return {
    kind: "arapahoe",
    plainBody: YOY_THEORETICAL_DOLLAR_POPOVER_BODY_ARAPAHOE,
  };
}
