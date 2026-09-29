// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Unlocked home: teaching block for why property taxes go up (valuation + mill levy).
 * Generic only — no property numbers.
 */
import { WhyTaxesGoUpTwoSegmentBar } from "@/components/WhyTaxesGoUpTwoSegmentBar";
import { buildWhyTaxesGoUpTeachingSegments } from "@/components/whyTaxesGoUpTeachingSegments";

export const HOME_WHY_TAXES_GO_UP_HEADING =
  "Two numbers make your property tax go up";

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

        <WhyTaxesGoUpTwoSegmentBar
          className="mt-6"
          segments={buildWhyTaxesGoUpTeachingSegments("home-why-taxes")}
        />
      </div>
    </section>
  );
}
