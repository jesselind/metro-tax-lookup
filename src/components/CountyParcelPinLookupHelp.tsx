// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import Image from "next/image";
import { useState } from "react";
import parcelPinImg from "@/assets/images/Parcel-PIN.png";
import { CountyAssessorMillLevyFigures } from "@/components/CountyAssessorMillLevyFigures";
import { ToolOutlinedToggleButton } from "@/components/ToolOutlinedToggleButton";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH } from "@/lib/arapahoeCountyUrls";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  TOOL_DISCLOSURE_ROW_ALIGN_CLASS,
} from "@/lib/toolFlowStyles";

type CountyParcelPinLookupHelpProps = {
  /**
   * When true, adds **Tax District Levies** / **2025 Mill Levy** guidance and screenshot
   * toggles (for Add tile and total mills).
   */
  includeLevyTableScreenshots?: boolean;
};

/**
 * County assessor property search + where to find parcel PIN (shared home-page help body).
 * Used from the home address card when situs lookup has no match (optionally with levy table help).
 */
export function CountyParcelPinLookupHelp({
  includeLevyTableScreenshots = false,
}: CountyParcelPinLookupHelpProps) {
  const [showParcelPinHelp, setShowParcelPinHelp] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-base text-slate-800 sm:text-lg">
        Go to the county{" "}
        <a
          href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
          target="_blank"
          rel="noopener noreferrer"
          className={COUNTY_EXTERNAL_LINK_CLASS}
        >
          property search
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        .
      </p>
      <p className="text-base text-slate-800 sm:text-lg">
        Type your address. Open your property when it comes up. You should see a
        page with details about your land or building &mdash; the county calls
        this your <strong>parcel record</strong>.
      </p>
      <p className="text-base text-slate-800 sm:text-lg">
        On the parcel record, find your <strong>parcel PIN</strong>.
      </p>
      <div className="space-y-3 pt-1">
        <div className={TOOL_DISCLOSURE_ROW_ALIGN_CLASS}>
          <ToolOutlinedToggleButton
            onClick={() => setShowParcelPinHelp((prev) => !prev)}
            aria-expanded={showParcelPinHelp}
          >
            {showParcelPinHelp
              ? "Hide PIN screenshot"
              : "Show where to find your PIN"}
          </ToolOutlinedToggleButton>
        </div>
        {showParcelPinHelp ? (
          <div className="rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
            <figure>
              <a
                href={parcelPinImg.src}
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer"
              >
                <Image
                  src={parcelPinImg}
                  alt="County parcel record screenshot with the parcel PIN location highlighted."
                  className="w-full rounded-md border border-slate-400"
                  width={800}
                  height={650}
                  sizes="(max-width: 768px) 100vw, 42rem"
                />
              </a>
              <figcaption className="mt-1 text-sm text-slate-500 sm:text-base">
                Tap image to open full size.
              </figcaption>
            </figure>
          </div>
        ) : null}
      </div>
      {includeLevyTableScreenshots ? (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <h4 className="text-sm font-semibold text-slate-900 sm:text-base">
            Levy table and total mills (same parcel page)
          </h4>
          <p className="text-base text-slate-800 sm:text-lg">
            On that parcel record, open{" "}
            <strong>Tax District Levies</strong> (sidebar link) for the table you
            can copy into <strong>Add tile</strong> here.{" "}
            <strong>2025 Mill Levy</strong> on the page is your total mills if you
            need to check or type it.
          </p>
          <CountyAssessorMillLevyFigures />
        </div>
      ) : null}
    </div>
  );
}
