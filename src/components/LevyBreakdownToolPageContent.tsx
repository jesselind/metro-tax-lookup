"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import parcelRecordLevyImg from "@/assets/images/parcel-record-levy.png";
import levyStackExampleImg from "@/assets/images/levy-stack-no-highlight.png";
import {
  LevyDefinitionInfoDetails,
  MillsDefinitionInfoDetails,
} from "@/components/propertyTaxInfoDetails";
import { HelpPillButton } from "@/components/HelpPillButton";
import { PageHero } from "@/components/PageHero";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH as ASSESSOR_SEARCH_URL } from "@/lib/arapahoeCountyUrls";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
import { LevyStackManualEntry } from "@/components/LevyStackManualEntry";
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
  const [showParcelRecordHelp, setShowParcelRecordHelp] = useState(false);
  const [showLevyTableHelp, setShowLevyTableHelp] = useState(false);
  const [levyEntryResetKey, setLevyEntryResetKey] = useState(0);

  function handleStartOver() {
    setShowParcelRecordHelp(false);
    setShowLevyTableHelp(false);
    setLevyEntryResetKey((k) => k + 1);
  }

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <div className={TOOL_PAGE_INNER_CLASS_TOOL}>
        <div className={TOOL_PAGE_HERO_INTRO_GROUP_CLASS}>
          <PageHero title="Property tax levy breakdown" />
          <p className={TOOL_PAGE_INTRO_PARAGRAPH_CLASS}>
            Follow the steps to open your county levy list, then enter it in the tool
            below.
          </p>
        </div>
        <section aria-labelledby="levy-flow-heading" className="">
          <h2 id="levy-flow-heading" className="sr-only">
            Steps: find your property, open Tax District Levies and review the
            breakdown screen, enter your levy lines in the tool
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
                </div>
              </div>
            </li>
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>
                  Step 2 - Tax District Levies
                </div>
                <div className={`${CARD_BODY_CLASS} space-y-3`}>
                  <p className="text-base text-slate-800 sm:text-lg">
                    On your property page, click the link that says{" "}
                    <strong>Tax District Levies</strong>.
                  </p>
                  <HelpPillButton
                    onClick={() => setShowParcelRecordHelp((prev) => !prev)}
                    aria-expanded={showParcelRecordHelp}
                  >
                    {showParcelRecordHelp ? "Hide" : "Show"} where to find it
                  </HelpPillButton>
                  {showParcelRecordHelp && (
                    <div className="rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
                      <figure>
                        <a
                          href={parcelRecordLevyImg.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Image
                            src={parcelRecordLevyImg}
                            alt="County property page with the Tax District Levies link marked."
                            className="w-full rounded border border-slate-400"
                            width={800}
                            height={500}
                          />
                        </a>
                        <figcaption className="mt-1 text-sm text-slate-500 sm:text-base">
                          Tap image to open full size.
                        </figcaption>
                      </figure>
                    </div>
                  )}
                  <p className="text-base text-slate-800 sm:text-lg">
                    That screen lists each taxing district and its levy, with a total
                    at the bottom—what you will copy in the next step.
                  </p>
                  <HelpPillButton
                    onClick={() => setShowLevyTableHelp((prev) => !prev)}
                    aria-expanded={showLevyTableHelp}
                  >
                    {showLevyTableHelp ? "Hide" : "Show"} example
                  </HelpPillButton>
                  {showLevyTableHelp && (
                    <div className="rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
                      <figure>
                        <a
                          href={levyStackExampleImg.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Image
                            src={levyStackExampleImg}
                            alt="Example county tax levies list: districts and rates with a total at the bottom."
                            className="w-full rounded border border-slate-400"
                            width={800}
                            height={500}
                          />
                        </a>
                        <figcaption className="mt-1 text-sm text-slate-500 sm:text-base">
                          Tap image to open full size.
                        </figcaption>
                      </figure>
                    </div>
                  )}
                  <LevyDefinitionInfoDetails />
                </div>
              </div>
            </li>
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>
                  Step 3 - Enter your levy stack
                </div>
                <div className={`${CARD_BODY_CLASS} space-y-3`}>
                  <LevyStackManualEntry key={levyEntryResetKey} />
                  <div className="mt-6">
                    <MillsDefinitionInfoDetails />
                  </div>
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
