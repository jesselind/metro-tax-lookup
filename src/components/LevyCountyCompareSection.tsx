// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useMemo } from "react";
import { btnOutlinePrimaryMd, btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH } from "@/lib/arapahoeCountyUrls";
import { formatTaxAreaShortDescrDisplay } from "@/lib/arapahoeParcelLevyData";
import {
  safeArapahoeLevyAspxUrl,
  safeArapahoeParcelRecordUrl,
} from "@/lib/safeExternalHref";
import { COUNTY_EXTERNAL_LINK_CLASS, TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

export type LevyCountyCompareSectionProps = {
  pin: string;
  tagId: string;
  tagShortDescr: string;
  levyAspxUrl: string;
  ain?: string | null;
  /** Demo property: show parcel record control disabled (no county link-out). */
  demoMode?: boolean;
};

export function LevyCountyCompareSection({
  pin,
  tagId,
  tagShortDescr,
  levyAspxUrl,
  ain,
  demoMode = false,
}: LevyCountyCompareSectionProps) {
  const safeLevyTableHref = useMemo(
    () => safeArapahoeLevyAspxUrl(levyAspxUrl),
    [levyAspxUrl],
  );

  const safeParcelRecordHref = useMemo(
    () => safeArapahoeParcelRecordUrl(ain),
    [ain],
  );

  const pinTermHref = "#term-pin";
  const tagTermHref = "#term-tag";

  const showParcelRecordLink = !demoMode && safeParcelRecordHref != null;
  const showParcelRecordDemoControl = demoMode;
  const showCountyActionRow =
    showParcelRecordLink ||
    showParcelRecordDemoControl ||
    safeLevyTableHref != null;

  return (
    <section
      className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/90 px-4 py-4 shadow-sm sm:px-5"
      aria-labelledby="levy-county-compare-heading"
    >
      <div>
        <h4
          id="levy-county-compare-heading"
          className="text-sm font-semibold text-slate-900 sm:text-base"
        >
          See how the county displays your data
        </h4>
        <p className="mt-1.5 text-xs leading-snug text-slate-600 sm:text-sm">
          <span className="sr-only">Property match. </span>
          Matched{" "}
          <a id="pin-term-first" href={pinTermHref} className={TERM_LINK_CLASS}>
            PIN
          </a>{" "}
          <span className="font-mono font-semibold tabular-nums text-slate-800">
            {pin}
          </span>
          {" · "}
          <a id="tag-term-first" href={tagTermHref} className={TERM_LINK_CLASS}>
            TAG ID
          </a>{" "}
          <span className="font-mono font-semibold tabular-nums text-slate-800">
            {tagId}
          </span>
          {" · "}
          Taxing authority{" "}
          <span className="font-medium text-slate-700">
            {formatTaxAreaShortDescrDisplay(tagShortDescr)}
          </span>
        </p>
      </div>
      {showCountyActionRow ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
          {showParcelRecordDemoControl ? (
            <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto">
              <button
                type="button"
                disabled
                className={`${btnOutlinePrimaryMd} w-full justify-center sm:w-auto`}
                aria-describedby="levy-county-parcel-record-demo-hint"
              >
                Open county parcel record
              </button>
              <p
                id="levy-county-parcel-record-demo-hint"
                className="text-center text-xs leading-snug text-slate-600 sm:text-left sm:text-sm"
              >
                Not available in demo mode.
              </p>
            </div>
          ) : showParcelRecordLink ? (
            <a
              href={safeParcelRecordHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnOutlinePrimaryMd} w-full cursor-pointer justify-center sm:w-auto`}
            >
              Open county parcel record
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
          {safeLevyTableHref ? (
            <a
              href={safeLevyTableHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${
                showParcelRecordLink || showParcelRecordDemoControl
                  ? btnOutlineSecondaryMd
                  : btnOutlinePrimaryMd
              } w-full cursor-pointer justify-center sm:w-auto`}
            >
              Open county levy table
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      ) : null}
      <p className="text-xs leading-snug text-slate-600 sm:text-sm">
        <a
          href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          County property search
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {showParcelRecordLink ? (
          <>
            {" "}
            — look up a different parcel by address or PIN.
          </>
        ) : (
          <>
            {" "}
            — find the full parcel record (legal description, sales, notices).
          </>
        )}
      </p>
    </section>
  );
}
