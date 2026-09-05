// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  VALUATION_HISTORY_COLUMN_ACTUAL,
  VALUATION_HISTORY_COLUMN_ASSESSED,
  VALUATION_HISTORY_COLUMN_YEAR,
  VALUATION_HISTORY_SECTION_ID,
  VALUATION_HISTORY_SECTION_LEAD,
  VALUATION_HISTORY_SECTION_TITLE,
  VALUATION_HISTORY_TABLE_CAPTION,
} from "@/content/valuationHistoryCopy";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";
import { formatUsdWhole } from "@/lib/formatUsd";
import { formatTaxYearLabel } from "@/lib/metroLevyYearOverYear";
import {
  DASHBOARD_SECTION_HEADING_SPACED_CLASS,
  PARCEL_RECORD_EXTENDED_SHELL_CLASS,
} from "@/lib/toolFlowStyles";

export type ValuationHistoryTableProps = {
  series: CountyValuationHistoryPoint[];
  loading?: boolean;
  /** When true, render only the scrollable table (modal disclosure). */
  embedded?: boolean;
};

function ValuationHistoryTableBody({
  rows,
}: {
  rows: CountyValuationHistoryPoint[];
}) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-slate-200/90">
      <table className="min-w-full text-left text-sm tabular-nums text-slate-900">
        <caption className="sr-only">{VALUATION_HISTORY_TABLE_CAPTION}</caption>
        <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th scope="col" className="px-3 py-2">
              {VALUATION_HISTORY_COLUMN_YEAR}
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              {VALUATION_HISTORY_COLUMN_ACTUAL}
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              {VALUATION_HISTORY_COLUMN_ASSESSED}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.taxYear}
              className="border-t border-slate-100 odd:bg-white even:bg-slate-50/60"
            >
              <th scope="row" className="px-3 py-2 font-medium">
                {formatTaxYearLabel(row.taxYear)}
              </th>
              <td className="px-3 py-2 text-right">
                {formatUsdWhole(row.actualValue)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatUsdWhole(row.assessedValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ValuationHistoryTable({
  series,
  loading = false,
  embedded = false,
}: ValuationHistoryTableProps) {
  if (loading) {
    if (embedded) {
      return <div className="h-24 animate-pulse rounded bg-slate-200/70" />;
    }
    return (
      <div
        id={VALUATION_HISTORY_SECTION_ID}
        className={PARCEL_RECORD_EXTENDED_SHELL_CLASS}
        aria-busy="true"
      >
        <h3 className={DASHBOARD_SECTION_HEADING_SPACED_CLASS}>
          {VALUATION_HISTORY_SECTION_TITLE}
        </h3>
        <div className="h-24 animate-pulse rounded bg-slate-200/70" />
      </div>
    );
  }

  if (series.length < 2) return null;

  const rows = [...series].sort((a, b) => b.taxYear - a.taxYear);

  if (embedded) {
    return <ValuationHistoryTableBody rows={rows} />;
  }

  return (
    <section
      id={VALUATION_HISTORY_SECTION_ID}
      className={PARCEL_RECORD_EXTENDED_SHELL_CLASS}
      aria-labelledby="valuation-history-heading"
    >
      <h3
        id="valuation-history-heading"
        className={DASHBOARD_SECTION_HEADING_SPACED_CLASS}
      >
        {VALUATION_HISTORY_SECTION_TITLE}
      </h3>
      <p className="text-sm leading-snug text-slate-700">
        {VALUATION_HISTORY_SECTION_LEAD}
      </p>
      <div className="mt-3">
        <ValuationHistoryTableBody rows={rows} />
      </div>
    </section>
  );
}
