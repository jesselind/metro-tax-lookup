// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useMemo } from "react";
import { GlossaryTermPopover } from "@/components/GlossaryTermPopover";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import {
  COUNTY_CONFIG,
  countyFeatureAvailable,
} from "@/lib/countyConfig";
import { formatTaxAreaShortDescrDisplay } from "@/lib/arapahoeParcelLevyData";
import {
  safeCountyBppAccountDetailsUrl,
  safeCountyLevyAspxUrl,
  safeCountyParcelRecordUrl,
} from "@/lib/safeExternalHref";

const COUNTY_ACTION_CLASS = `${btnOutlineSecondaryMd} w-full justify-center sm:w-auto`;

export type LevyCountyCompareSectionProps = {
  pin: string;
  tagId: string;
  tagShortDescr: string;
  levyAspxUrl: string;
  ain?: string | null;
  /** Demo property: show parcel record control disabled (no county link-out). */
  demoMode?: boolean;
  /**
   * Business personal property: Details.aspx on personalpropertysearch; search
   * form is the BPP search (not Real property search / PPINum).
   */
  businessPersonal?: boolean;
};

export function LevyCountyCompareSection({
  pin,
  tagId,
  tagShortDescr,
  levyAspxUrl,
  ain,
  demoMode = false,
  businessPersonal = false,
}: LevyCountyCompareSectionProps) {
  const bppOn = countyFeatureAvailable("bpp");
  const useBppLinks = businessPersonal && bppOn;
  const safeLevyTableHref = useMemo(
    () => safeCountyLevyAspxUrl(levyAspxUrl),
    [levyAspxUrl],
  );

  const safeParcelRecordHref = useMemo(
    () => safeCountyParcelRecordUrl(ain),
    [ain],
  );

  const safeBppDetailsHref = useMemo(
    () => (bppOn ? safeCountyBppAccountDetailsUrl(ain) : null),
    [ain, bppOn],
  );

  const accountRecordHref = useBppLinks
    ? safeBppDetailsHref
    : safeParcelRecordHref;
  const accountRecordLabel = useBppLinks
    ? "Open county business personal property record"
    : "Open county parcel record";

  const showAccountRecordLink = !demoMode && accountRecordHref != null;
  const showAccountRecordDemoControl = demoMode;
  const propertySearchHref = useBppLinks
    ? (COUNTY_CONFIG.residentLinks.bppSearch ??
      COUNTY_CONFIG.residentLinks.propertySearch)
    : COUNTY_CONFIG.residentLinks.propertySearch;
  const propertySearchLabel = useBppLinks
    ? "County business personal property search"
    : "County property search";

  return (
    <section
      className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/90 px-4 py-4 shadow-sm sm:px-5"
      aria-labelledby="levy-county-compare-heading"
    >
      <div>
        <h4
          id="levy-county-compare-heading"
          className="text-base font-semibold leading-snug text-slate-900 sm:text-lg"
        >
          See how the county displays your data
        </h4>
        <div className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:text-base">
          <span className="sr-only">Property match. </span>
          Matched{" "}
          <GlossaryTermPopover
            termId="term-pin"
            textTrigger="PIN"
            textTriggerId="pin-term-first"
          />
          {" "}
          <span className="font-mono font-semibold tabular-nums text-slate-800">
            {pin}
          </span>
          {" · "}
          <GlossaryTermPopover
            termId="term-tag"
            textTrigger="TAG ID"
            textTriggerId="tag-term-first"
          />
          {" "}
          <span className="font-mono font-semibold tabular-nums text-slate-800">
            {tagId}
          </span>
          {" · "}
          Taxing authority{" "}
          <span className="font-medium text-slate-700">
            {formatTaxAreaShortDescrDisplay(tagShortDescr)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
        {showAccountRecordDemoControl ? (
          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto">
            <button
              type="button"
              disabled
              className={COUNTY_ACTION_CLASS}
              aria-describedby="levy-county-parcel-record-demo-hint"
            >
              {accountRecordLabel}
            </button>
            <p
              id="levy-county-parcel-record-demo-hint"
              className="text-center text-sm leading-relaxed text-slate-600 sm:text-left"
            >
              Not available in demo mode.
            </p>
          </div>
        ) : showAccountRecordLink ? (
          <a
            href={accountRecordHref}
            target="_blank"
            rel="noopener noreferrer"
            className={COUNTY_ACTION_CLASS}
          >
            {accountRecordLabel}<span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
        {safeLevyTableHref ? (
          <a
            href={safeLevyTableHref}
            target="_blank"
            rel="noopener noreferrer"
            className={COUNTY_ACTION_CLASS}
          >
            Open county levy table<span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
        <a
          href={propertySearchHref}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_ACTION_CLASS}
        >
          {propertySearchLabel}<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </section>
  );
}
