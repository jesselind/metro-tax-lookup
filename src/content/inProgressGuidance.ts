// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Shared IN PROGRESS chrome (not COUNTY DATA GAP). Use when we are still
 * working to obtain or ship data and have not confirmed a county failure.
 * Reusable badge / popover / callout tones live in toolFlowStyles + components.
 */

/** In-callout and popover title on every IN PROGRESS note. */
export const IN_PROGRESS_CALLOUT_TITLE = "IN PROGRESS";

/**
 * In-page anchors for contextual IN PROGRESS callouts on /sources (not the
 * COUNTY DATA GAP hub).
 */
export const IN_PROGRESS_SOURCES_ANCHOR = {
  priorYearValues: "county-prior-year-values-in-progress",
} as const;
