"use client";

import Image from "next/image";
import { useState } from "react";
import propertyPageImg from "@/assets/images/mill-levy-property-page.png";
import millLevyDetailImg from "@/assets/images/mill-levy-detail.png";
import { HelpPillButton } from "@/components/HelpPillButton";

/**
 * Toggle screenshots for **2025 Mill Levy** on the county parcel page and a sample row
 * on **Tax District Levies**. Shared by metro "Having trouble?", PIN lookup help, and
 * the manual levy stack intro.
 */
export function CountyAssessorMillLevyFigures() {
  const [showCountyMillScreenshot, setShowCountyMillScreenshot] =
    useState(false);
  const [showLevyTableScreenshot, setShowLevyTableScreenshot] =
    useState(false);

  return (
    <div className="space-y-4">
      <div>
        <HelpPillButton
          onClick={() => setShowCountyMillScreenshot((prev) => !prev)}
          aria-expanded={showCountyMillScreenshot}
        >
          {showCountyMillScreenshot
            ? "Hide where to find total mills"
            : "Show where to find total mills on the county site"}
        </HelpPillButton>
        {showCountyMillScreenshot ? (
          <div className="mt-3 rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
            <figure>
              <a
                href={propertyPageImg.src}
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer"
              >
                <Image
                  src={propertyPageImg}
                  alt="Arapahoe County property page with 2025 Mill Levy highlighted."
                  className="w-full rounded border border-slate-400"
                  width={800}
                  height={500}
                />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <figcaption className="mt-1 text-sm text-slate-500 sm:text-base">
                Tap image to open full size.
              </figcaption>
            </figure>
          </div>
        ) : null}
      </div>
      <div>
        <HelpPillButton
          onClick={() => setShowLevyTableScreenshot((prev) => !prev)}
          aria-expanded={showLevyTableScreenshot}
        >
          {showLevyTableScreenshot
            ? "Hide county levy table example"
            : "Show Tax District Levies table on the county site"}
        </HelpPillButton>
        {showLevyTableScreenshot ? (
          <div className="mt-3 rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
            <figure>
              <a
                href={millLevyDetailImg.src}
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer"
              >
                <Image
                  src={millLevyDetailImg}
                  alt="County Tax District Levies table with a sample district row highlighted."
                  className="w-full rounded border border-slate-400"
                  width={800}
                  height={500}
                />
                <span className="sr-only"> (opens in a new tab)</span>
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
