"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import parcelPinImg from "@/assets/images/Parcel-PIN.png";
import { LevyDefinitionInfoDetails } from "@/components/propertyTaxInfoDetails";
import { HelpPillButton } from "@/components/HelpPillButton";
import { PageHero } from "@/components/PageHero";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH as ASSESSOR_SEARCH_URL } from "@/lib/arapahoeCountyUrls";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
import { LevyStackManualEntry } from "@/components/LevyStackManualEntry";
import { UnderConstructionBanner } from "@/components/UnderConstructionBanner";
import {
  CARD_BODY_CLASS,
  CARD_CLASS_CLIPPED,
  CARD_HEADER_CLASS,
  COUNTY_EXTERNAL_LINK_CLASS,
  TOOL_PAGE_HERO_INTRO_GROUP_CLASS,
  TOOL_PAGE_INNER_CLASS_TOOL,
  TOOL_PAGE_INTRO_PARAGRAPH_CLASS,
} from "@/lib/toolFlowStyles";

export function LevyBreakdownToolPageContent() {
  const [levyEntryResetKey, setLevyEntryResetKey] = useState(0);
  const [showParcelPinHelp, setShowParcelPinHelp] = useState(false);

  function handleStartOver() {
    setShowParcelPinHelp(false);
    setLevyEntryResetKey((k) => k + 1);
  }

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <div className={TOOL_PAGE_INNER_CLASS_TOOL}>
        <div className={TOOL_PAGE_HERO_INTRO_GROUP_CLASS}>
          <PageHero title="Property tax levy breakdown" />
          <p className={TOOL_PAGE_INTRO_PARAGRAPH_CLASS}>
            Find your parcel record and PIN to get your property tax breakdown.
          </p>
        </div>
        <UnderConstructionBanner />
        <section aria-labelledby="levy-flow-heading" className="">
          <h2 id="levy-flow-heading" className="sr-only">
            Steps: find your property and parcel PIN, enter your tax info in the tool
          </h2>
          <ol className="space-y-6 sm:space-y-8">
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>
                  Step 1 - Look up your property
                </div>
                <div className={`${CARD_BODY_CLASS} space-y-3`}>
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
                    Type your address. Open your property when it comes up. You should
                    see a page with details about your land or building &mdash; the
                    county calls this your <strong>parcel record</strong>.
                  </p>
                  <p className="text-base text-slate-800 sm:text-lg">
                    On the parcel record, find your <strong>parcel PIN</strong>.
                  </p>
                  <div className="space-y-3 pt-1">
                    <HelpPillButton
                      onClick={() => setShowParcelPinHelp((prev) => !prev)}
                      aria-expanded={showParcelPinHelp}
                    >
                      {showParcelPinHelp ? "Hide" : "Show"} where to find your PIN
                    </HelpPillButton>
                    {showParcelPinHelp && (
                      <div className="rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
                        <figure>
                          <a
                            href={parcelPinImg.src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
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
                    )}
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>
                  Step 2 - Enter your levy stack
                </div>
                <div className={`${CARD_BODY_CLASS} space-y-3`}>
                  <LevyDefinitionInfoDetails />
                  <LevyStackManualEntry key={levyEntryResetKey} />
                </div>
              </div>
            </li>
          </ol>
        </section>
        <div
          className="flex flex-wrap items-center justify-center gap-3"
          role="group"
          aria-label="Start over or return to tools menu"
        >
          <button
            type="button"
            onClick={handleStartOver}
            className={btnOutlinePrimaryMd}
          >
            Start over
          </button>
          <Link href="/" className={btnOutlinePrimaryMd}>
            Back to tools
          </Link>
        </div>
      </div>
    </main>
  );
}
