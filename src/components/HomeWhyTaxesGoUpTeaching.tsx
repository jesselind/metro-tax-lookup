// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Unlocked home: teaching block for why property taxes go up (valuation + mill levy).
 * Generic only — no property numbers.
 */
import type { ComponentType, SVGProps } from "react";
import { ChartPieIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import { GlossaryTermPopover } from "@/components/GlossaryTermPopover";

export const HOME_WHY_TAXES_GO_UP_HEADING =
  "Two numbers make your property tax go up";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

type LeverSegment = {
  title: string;
  subtext: string;
  termId: "term-actual-value" | "term-mill-levy-total";
  textTriggerId: string;
  whatsThisAriaLabel: string;
  barClassName: string;
  Icon: HeroIcon;
};

const SEGMENTS: LeverSegment[] = [
  {
    title: "Property value",
    subtext: "What the county says your property is worth",
    termId: "term-actual-value",
    textTriggerId: "home-why-taxes-property-value",
    whatsThisAriaLabel: "Brief definition of property value",
    barClassName: "bg-slate-700",
    Icon: HomeModernIcon,
  },
  {
    title: "Mill levy",
    subtext: "Everyone on your bill, added up",
    termId: "term-mill-levy-total",
    textTriggerId: "home-why-taxes-mill-levy",
    whatsThisAriaLabel: "Brief definition of mill levy total",
    barClassName: "bg-rose-700",
    Icon: ChartPieIcon,
  },
];

const CELL_PAD_X = "px-4 sm:px-8";

export function HomeWhyTaxesGoUpTeaching() {
  const headingId = "home-why-taxes-go-up-heading";

  return (
    <section className="mt-8 text-center" aria-labelledby={headingId}>
      <div className="mx-auto w-full max-w-3xl">
        <h2
          id={headingId}
          className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          {HOME_WHY_TAXES_GO_UP_HEADING}
        </h2>

        {/*
          Parent rows + subgrid columns: icons / title / subtext / What's this?
          share one horizontal baseline across both segments.
        */}
        <div
          className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg [grid-template-rows:auto_auto_auto_auto]"
          role="list"
        >
          {SEGMENTS.map((segment) => {
            const Icon = segment.Icon;
            return (
              <div
                key={segment.title}
                role="listitem"
                className={`col-span-1 row-span-4 grid min-w-0 grid-rows-subgrid text-left text-white ${segment.barClassName}`}
              >
                <div className={`pt-6 sm:pt-8 ${CELL_PAD_X}`}>
                  <Icon
                    className="h-9 w-9 shrink-0 text-white sm:h-11 sm:w-11"
                    aria-hidden="true"
                  />
                </div>
                <p
                  className={`pt-3 text-xl font-bold tracking-tight sm:pt-4 sm:text-2xl ${CELL_PAD_X}`}
                >
                  {segment.title}
                </p>
                <p
                  className={`pt-2 text-base font-medium leading-snug text-white/95 sm:text-lg ${CELL_PAD_X}`}
                >
                  {segment.subtext}
                </p>
                <p className={`pb-6 pt-3 sm:pb-8 sm:pt-4 ${CELL_PAD_X}`}>
                  <GlossaryTermPopover
                    termId={segment.termId}
                    textTrigger="What's this?"
                    textTriggerId={segment.textTriggerId}
                    textTriggerClassName="text-sm font-semibold text-white underline decoration-white/80 underline-offset-2 hover:decoration-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent"
                    ariaLabel={segment.whatsThisAriaLabel}
                  />
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
