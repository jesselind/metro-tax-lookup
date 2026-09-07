// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Mill-history chart footer rules (levy modal `AuthorityMillsHistoryChart`).
 * County-agnostic: `priorYearValuesGap` is the confirmed-policy opt-in from
 * `CountyConfig.features`; do not hardcode county ids here.
 */

/**
 * Show Prior years missing badge on the oldest endpoint when dollars are
 * absent there, but only when the newest endpoint already has dollars (current
 * assessed × mills). A gap badge with no current dollars is noise.
 */
export function showPriorYearGapOnMillsChartFooter(input: {
  priorYearValuesGap: boolean;
  oldestEndpointHasDollars: boolean;
  newestEndpointHasDollars: boolean;
  countyId: string | null | undefined;
}): boolean {
  const county = String(input.countyId ?? "").trim();
  return (
    input.priorYearValuesGap &&
    !input.oldestEndpointHasDollars &&
    input.newestEndpointHasDollars &&
    county.length > 0
  );
}

/** Ledger rule between mills row and dollars / gap row when either endpoint has money or gap. */
export function showMillsChartFooterLedger(input: {
  showPriorYearGap: boolean;
  oldestEndpointHasDollars: boolean;
  newestEndpointHasDollars: boolean;
}): boolean {
  return (
    input.showPriorYearGap ||
    input.oldestEndpointHasDollars ||
    input.newestEndpointHasDollars
  );
}
