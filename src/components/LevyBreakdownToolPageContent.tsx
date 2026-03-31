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
import { PageHero } from "@/components/PageHero";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH as ASSESSOR_SEARCH_URL } from "@/lib/arapahoeCountyUrls";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
import {
  CARD_BODY_CLASS,
  CARD_CLASS_CLIPPED,
  CARD_HEADER_CLASS,
  COUNTY_EXTERNAL_LINK_CLASS,
  HELP_PILL_CLASS,
} from "@/lib/toolFlowStyles";

export function LevyBreakdownToolPageContent() {
  const [showParcelRecordHelp, setShowParcelRecordHelp] = useState(false);
  const [showLevyTableHelp, setShowLevyTableHelp] = useState(false);

  function handleStartOver() {
    setShowParcelRecordHelp(false);
    setShowLevyTableHelp(false);
  }

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 pt-0 pb-4 sm:pb-6">
        <PageHero title="Property tax levy breakdown" />
        <p className="max-w-prose text-base leading-relaxed text-slate-700 sm:text-lg">
          Your property tax bill is split among schools, the county, fire
          protection, and other local services. This walkthrough helps you pull up
          that split on the county website.
        </p>
        <section aria-labelledby="levy-flow-heading" className="">
          <h2 id="levy-flow-heading" className="sr-only">
            Steps: find your property, open the county list, see your levy breakdown
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
                  Step 2 - Get the list
                </div>
                <div className={`${CARD_BODY_CLASS} space-y-3`}>
                  <p className="text-base text-slate-800 sm:text-lg">
                    On your property page, click the link that says{" "}
                    <strong>Tax District Levies</strong>.
                  </p>
                  <button
                    type="button"
                    className={HELP_PILL_CLASS}
                    onClick={() => setShowParcelRecordHelp((prev) => !prev)}
                    aria-expanded={showParcelRecordHelp}
                  >
                    {showParcelRecordHelp ? "Hide" : "Show"} where to find it
                  </button>
                  {showParcelRecordHelp && (
                    <div className="rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
                      <p className="mb-3">
                        The image shows where the <strong>Tax District Levies</strong>{" "}
                        link is on your property page.
                      </p>
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
                </div>
              </div>
            </li>
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>
                  Step 3 - Here is your levy breakdown
                </div>
                <div className={`${CARD_BODY_CLASS} space-y-3`}>
                  <p className="text-base text-slate-800 sm:text-lg">
                    This screen is your levy breakdown: how your property tax is split,
                    one line at a time, with a total at the bottom.
                  </p>
                  <button
                    type="button"
                    className={HELP_PILL_CLASS}
                    onClick={() => setShowLevyTableHelp((prev) => !prev)}
                    aria-expanded={showLevyTableHelp}
                  >
                    {showLevyTableHelp ? "Hide" : "Show"} example
                  </button>
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
                  <p
                    className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 sm:text-base"
                    role="status"
                  >
                    <strong className="font-semibold">Under construction.</strong> This
                    tool is not finished yet. The steps above help you open your levy
                    list on the county site; more here soon.
                  </p>
                </div>
              </div>
            </li>
          </ol>
          <div className="mt-6">
            <MillsDefinitionInfoDetails />
          </div>
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
