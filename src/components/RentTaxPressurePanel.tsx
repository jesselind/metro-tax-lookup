// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { formatUsdWhole } from "@/lib/formatUsd";
import type { DwellingCountResolution } from "@/lib/resolveDwellingCount";
import {
  DASHBOARD_SECTION_META_CLASS,
  HOME_AUDIENCE_STACK_GAP_CLASS,
  RENT_SUMMARY_ROW_CLASS,
  RENT_SUMMARY_TILE_BODY_CLASS,
  RENT_SUMMARY_TILE_LABEL_CLASS,
  RENT_SUMMARY_TILE_TAX_ANNUAL_CLASS,
  RENT_SUMMARY_TILE_TAX_MONTHLY_CLASS,
  RENT_SUMMARY_TILE_UNITS_CLASS,
  RENT_SUMMARY_TILE_VALUE_CLASS,
  RENT_SUMMARY_TILE_VALUE_SUFFIX_CLASS,
} from "@/lib/toolFlowStyles";

const RENT_MONTHLY_TILE_LABEL = "Your estimated property tax";

export type RentTaxPressurePanelProps = {
  /** Whole-property estimated annual tax (same as owner Property tax tile). */
  estimatedAnnualDollars: number;
  /** Whole-property monthly (annual / 12, whole dollars). */
  estimatedMonthlyDollars: number;
  dwelling: DwellingCountResolution | null;
  equalSplit: {
    annualPerUnitDollars: number;
    monthlyPerUnitDollars: number;
  } | null;
  /** True while the parcel-record shard is still loading (avoid a false "unknown N" flash). */
  dwellingPending?: boolean;
};

/**
 * Rent-mode tax summary: monthly potential tax, all tax /yr, unit count when N is known.
 * Pierce heading sits above the aside. Gap uses {@link HOME_AUDIENCE_STACK_GAP_CLASS}
 * (same token as the home section under Own|Rent) so toggle→heading === heading→tiles.
 */
export function RentTaxPressurePanel({
  estimatedAnnualDollars,
  estimatedMonthlyDollars,
  dwelling,
  equalSplit,
  dwellingPending = false,
}: RentTaxPressurePanelProps) {
  const hasPerHomeSplit = dwelling != null && equalSplit != null;

  return (
    <div className={`w-full min-w-0 max-w-full ${HOME_AUDIENCE_STACK_GAP_CLASS}`}>
      <h2
        id="home-parcel-rent-tax-pressure-heading"
        className="text-center text-balance text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl"
      >
        You&apos;re still paying property tax if you rent.
      </h2>
      <aside
        id="home-parcel-rent-tax-pressure"
        className="w-full min-w-0 max-w-full"
        aria-labelledby="home-parcel-rent-tax-pressure-heading"
      >
        <div className={RENT_SUMMARY_ROW_CLASS}>
          {dwellingPending ? (
            <div
              className={RENT_SUMMARY_TILE_TAX_MONTHLY_CLASS}
              aria-live="polite"
            >
              <div className={RENT_SUMMARY_TILE_BODY_CLASS}>
                <p className={RENT_SUMMARY_TILE_LABEL_CLASS}>
                  {RENT_MONTHLY_TILE_LABEL}
                </p>
                <p className={RENT_SUMMARY_TILE_VALUE_CLASS}>Checking…</p>
              </div>
            </div>
          ) : hasPerHomeSplit ? (
            <div
              className={RENT_SUMMARY_TILE_TAX_MONTHLY_CLASS}
              id="home-parcel-rent-per-home-monthly"
            >
              <div className={RENT_SUMMARY_TILE_BODY_CLASS}>
                <p className={RENT_SUMMARY_TILE_LABEL_CLASS}>
                  {RENT_MONTHLY_TILE_LABEL}
                </p>
                <p className={RENT_SUMMARY_TILE_VALUE_CLASS}>
                  {formatUsdWhole(equalSplit.monthlyPerUnitDollars)}
                  <span className={RENT_SUMMARY_TILE_VALUE_SUFFIX_CLASS}>
                    /mo
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div
              className={RENT_SUMMARY_TILE_TAX_MONTHLY_CLASS}
              id="home-parcel-rent-building-monthly"
            >
              <div className={RENT_SUMMARY_TILE_BODY_CLASS}>
                <p className={RENT_SUMMARY_TILE_LABEL_CLASS}>
                  Estimated property tax for this property
                </p>
                <p className={RENT_SUMMARY_TILE_VALUE_CLASS}>
                  {formatUsdWhole(estimatedMonthlyDollars)}
                  <span className={RENT_SUMMARY_TILE_VALUE_SUFFIX_CLASS}>
                    /mo
                  </span>
                </p>
              </div>
            </div>
          )}

          <div
            className={RENT_SUMMARY_TILE_TAX_ANNUAL_CLASS}
            id="home-parcel-rent-building-annual"
          >
            <div className={RENT_SUMMARY_TILE_BODY_CLASS}>
              <p className={RENT_SUMMARY_TILE_LABEL_CLASS}>
                All tax for this property
              </p>
              <p className={RENT_SUMMARY_TILE_VALUE_CLASS}>
                {formatUsdWhole(estimatedAnnualDollars)}
                <span className={RENT_SUMMARY_TILE_VALUE_SUFFIX_CLASS}>/yr</span>
              </p>
            </div>
          </div>

          {hasPerHomeSplit ? (
            <div
              className={RENT_SUMMARY_TILE_UNITS_CLASS}
              id="home-parcel-rent-unit-count"
            >
              <div className={RENT_SUMMARY_TILE_BODY_CLASS}>
                <p className={RENT_SUMMARY_TILE_LABEL_CLASS}>
                  Total number of units
                </p>
                <p className={RENT_SUMMARY_TILE_VALUE_CLASS}>{dwelling.n}</p>
              </div>
            </div>
          ) : null}
        </div>

        {dwellingPending ? (
          <p className={`mt-4 ${DASHBOARD_SECTION_META_CLASS}`}>
            Checking how many homes share this tax account…
          </p>
        ) : hasPerHomeSplit ? (
          <p className={`mt-4 ${DASHBOARD_SECTION_META_CLASS}`}>
            The monthly figure splits this tax account evenly across units. It
            does not account for different unit sizes or rents, and your landlord
            may not pass tax through dollar for dollar.
          </p>
        ) : (
          <p className={`mt-4 ${DASHBOARD_SECTION_META_CLASS}`}>
            We do not know how many homes share this tax account, so there is no
            per-home split. Your landlord may not pass tax through dollar for
            dollar.
          </p>
        )}
      </aside>
    </div>
  );
}
