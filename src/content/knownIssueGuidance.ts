// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Shared KNOWN ISSUE chrome (not COUNTY DATA GAP, not sky IN PROGRESS).
 * Use when this app ships figures that can disagree with the county site and
 * we need an amber honesty note until fixed. Per-incident copy stays in
 * content modules; {@link KnownIssueBanner} / {@link KnownIssueCallout} are
 * the reusable shells.
 */

/** In-banner and callout title on every KNOWN ISSUE note. */
export const KNOWN_ISSUE_CALLOUT_TITLE = "KNOWN ISSUE";

/**
 * In-page anchors for contextual KNOWN ISSUE callouts on /sources (not the
 * COUNTY DATA GAP hub).
 */
export const KNOWN_ISSUE_SOURCES_ANCHOR = {
  /** Douglas tax-year / estimated-tax honesty (2026-09). */
  douglasPropertyDataAccuracy: "county-property-data-accuracy-warning",
} as const;
