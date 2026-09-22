// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Property details valuation history anchor (legacy id; section is Appraised and assessed values). */
export const VALUATION_HISTORY_SECTION_ID = "home-parcel-valuation-history";

export const VALUATION_HISTORY_CHART_HEADING_ASSESSED =
  "Assessed value over time";
export const VALUATION_HISTORY_CHART_HEADING_ACTUAL =
  "Appraised value over time";

export const VALUATION_HISTORY_TABLE_CAPTION =
  "Appraised and assessed values by tax year";

export const VALUATION_HISTORY_COLUMN_YEAR = "Year";
export const VALUATION_HISTORY_COLUMN_ACTUAL = "Appraised value";
export const VALUATION_HISTORY_COLUMN_ASSESSED = "Assessed value";

export const VALUATION_HISTORY_TABLE_SHOW = "See data in table form";
export const VALUATION_HISTORY_TABLE_HIDE = "Hide table";

/** @deprecated Use chart headings; kept for tests migrating off the old section heading. */
export const VALUATION_HISTORY_SECTION_TITLE = "Valuation history";

/** @deprecated Table now lives behind See data in table form. */
export const VALUATION_HISTORY_SECTION_LEAD =
  "Year-by-year appraised and assessed values from county Assessor records on this account.";

export const VALUATION_HISTORY_TAX_IMPACT_LEAD =
  "At your current mill levy, that is about";

export const VALUATION_HISTORY_TAX_IMPACT_MORE = "more per year in property tax.";
export const VALUATION_HISTORY_TAX_IMPACT_LESS = "less per year in property tax.";
