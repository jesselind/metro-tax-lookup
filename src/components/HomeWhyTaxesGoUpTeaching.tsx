// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Unlocked home: teaching block for why property taxes go up (valuation + mill levy).
 * Same bar as locked Own Summary; no property faces.
 */
import {
  WhyTaxesGoUpBar,
  WHY_TAXES_GO_UP_HEADING,
} from "@/components/WhyTaxesGoUpBar";
import {
  HOME_LANDING_JUMP_SCROLL_MT_CLASS,
  HOME_WHY_TAXES_GO_UP_SECTION_ID,
} from "@/lib/homeLandingJumps";

export const HOME_WHY_TAXES_GO_UP_HEADING = WHY_TAXES_GO_UP_HEADING;

export function HomeWhyTaxesGoUpTeaching() {
  const headingId = "home-why-taxes-go-up-heading";

  return (
    <section
      id={HOME_WHY_TAXES_GO_UP_SECTION_ID}
      tabIndex={-1}
      className={`mt-8 text-center outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${HOME_LANDING_JUMP_SCROLL_MT_CLASS}`}
      aria-labelledby={headingId}
    >
      <div className="mx-auto w-full max-w-3xl">
        <h2
          id={headingId}
          className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          {WHY_TAXES_GO_UP_HEADING}
        </h2>

        <WhyTaxesGoUpBar idPrefix="home-why-taxes" />
      </div>
    </section>
  );
}
