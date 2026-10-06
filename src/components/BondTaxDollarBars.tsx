// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Simple illustration for bonds brief + glossary: direct tax dollars vs
 * bond repayment (services/projects share + interest to lenders). Widths are
 * example only, not a fixed real-world split.
 */

/** Match glossary body type (`FULL_P`: text-base / sm:text-lg). */
const BAR_ROW =
  "flex min-h-16 overflow-hidden rounded-md text-base font-semibold leading-snug sm:min-h-[4.25rem] sm:text-lg";
const SEGMENT =
  "flex min-w-0 items-center justify-center px-2 py-2 text-center text-white sm:px-2.5";

export function BondTaxDollarBars({
  className = "mt-2",
}: {
  className?: string;
}) {
  return (
    <div
      className={`${className} space-y-3`}
      role="img"
      aria-label="Two example bars. When tax money pays for services or projects directly, 100% goes to those services or projects. When tax money pays back a bond, some goes to services or projects and some pays interest to banks and investors. The bond bar is an example only; real shares vary by loan."
    >
      <div>
        <p className="text-base font-semibold uppercase tracking-wide text-slate-700 sm:text-lg">
          When tax money pays for services or projects directly
        </p>
        <div className={`${BAR_ROW} mt-1.5`}>
          <div className={`${SEGMENT} w-full bg-teal-700`}>
            100% goes to services or projects
          </div>
        </div>
      </div>
      <div>
        <p className="text-base font-semibold uppercase tracking-wide text-slate-700 sm:text-lg">
          When tax money pays back a bond
        </p>
        <div className={`${BAR_ROW} mt-1.5`} aria-hidden>
          <div className={`${SEGMENT} w-[60%] bg-teal-700`}>
            Some goes to services or projects
          </div>
          <div className={`${SEGMENT} w-[40%] bg-amber-800`}>
            Some pays interest to banks and investors
          </div>
        </div>
        <p className="mt-1.5 text-sm leading-snug text-slate-600 sm:text-base">
          Example only; real shares vary by loan.
        </p>
      </div>
    </div>
  );
}
