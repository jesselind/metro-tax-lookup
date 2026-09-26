// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Home search form: latest curated Arapahoe-related Who authorized this?
 * trails, each with the tax authority name above the same slate panel used
 * on levy rows ({@link LevyAuthorityChainSection}).
 */
import { LevyAuthorityChainSection } from "@/components/LevyAuthorityChainSection";
import {
  latestArapahoeAuthorityChainCardsForHome,
  type HomeLatestArapahoeAuthorityChainCard,
} from "@/lib/levyAuthorityChain";
import { levyYoYSurfaceClasses } from "@/lib/metroLevyYearOverYear";

/** Section lead (blog-style) above the home authority-chain cards. */
export const HOME_LATEST_AUTHORITY_CHAIN_SECTION_LEAD =
  "We're constantly digging into why your property taxes are changing.";

export const HOME_LATEST_AUTHORITY_CHAIN_SECTION_SUPPORT =
  "Here are the latest updates.";

type Props = {
  cards?: HomeLatestArapahoeAuthorityChainCard[];
};

export function HomeLatestAuthorityChainCards({ cards }: Props) {
  const list = cards ?? latestArapahoeAuthorityChainCardsForHome();
  if (list.length === 0) return null;

  const headingId = "home-latest-authority-chains-heading";

  return (
    <section
      className="mt-6 text-left"
      aria-labelledby={headingId}
    >
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h2
            id={headingId}
            className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
          >
            {HOME_LATEST_AUTHORITY_CHAIN_SECTION_LEAD}
          </h2>
          <p className="mt-2 text-base font-medium tracking-tight text-slate-800 sm:text-lg">
            {HOME_LATEST_AUTHORITY_CHAIN_SECTION_SUPPORT}
          </p>
        </div>
        {list.map((card) => {
          const yoySurface =
            card.lastYearDirection != null
              ? levyYoYSurfaceClasses(card.lastYearDirection)
              : null;
          return (
            <div key={card.entry.id} className="min-w-0">
              <h3 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                <span className="block">{card.authorityDisplayName}</span>
                {card.lastYearPercentLabel && yoySurface ? (
                  <span
                    className={`mt-2 block w-full rounded-md border-2 px-3 py-1.5 text-center text-lg font-semibold tracking-tight sm:inline-block sm:w-auto sm:text-xl ${yoySurface.box} ${yoySurface.headline}`}
                  >
                    {card.lastYearPercentLabel}
                  </span>
                ) : null}
              </h3>
              <div className="mt-2">
                <LevyAuthorityChainSection
                  entry={card.entry}
                  countyId="arapahoe"
                  levyLineCode={card.levyLineCode}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
