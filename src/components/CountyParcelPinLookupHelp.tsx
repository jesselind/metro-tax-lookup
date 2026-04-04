"use client";

import Image from "next/image";
import { useState } from "react";
import parcelPinImg from "@/assets/images/Parcel-PIN.png";
import { HelpPillButton } from "@/components/HelpPillButton";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH as ASSESSOR_SEARCH_URL } from "@/lib/arapahoeCountyUrls";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";

/**
 * County assessor property search + where to find parcel PIN (shared home-page help body).
 * Shared by the levy breakdown flow and the home address card when situs lookup has no match.
 */
export function CountyParcelPinLookupHelp() {
  const [showParcelPinHelp, setShowParcelPinHelp] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-base text-slate-800 sm:text-lg">
        Go to the county{" "}
        <a
          href={ASSESSOR_SEARCH_URL}
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
        <HelpPillButton
          onClick={() => setShowParcelPinHelp((prev) => !prev)}
          aria-expanded={showParcelPinHelp}
        >
          {showParcelPinHelp
            ? "Hide PIN screenshot"
            : "Show where to find your PIN"}
        </HelpPillButton>
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
                  className="w-full rounded border border-slate-400"
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
    </div>
  );
}
