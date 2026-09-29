// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Locked property report: same WhyTaxesGoUpBar as unlocked home, with optional
 * property faces when publishable. Jump label is temporary "Summary"; heading
 * matches home sentence in dashboard section-title style.
 */
import {
  WhyTaxesGoUpBar,
  WHY_TAXES_GO_UP_HEADING,
} from "@/components/WhyTaxesGoUpBar";
import {
  HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS,
  HOME_WHY_TAXES_GO_UP_SUMMARY_HEADING_ID,
  HOME_WHY_TAXES_GO_UP_SUMMARY_ID,
} from "@/lib/homeDashboardJumps";
import type { PropertyWhyTaxesGoUpModel } from "@/lib/propertyWhyTaxesGoUp";
import {
  DASHBOARD_SECTION_ARRIVE_TARGET_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
  DASHBOARD_SECTION_LEAD_STACK_CLASS,
} from "@/lib/toolFlowStyles";

export function PropertyWhyTaxesGoUpSection({
  model,
  countyId,
  hasSaleHistory = false,
  parcelRecordHref = null,
}: {
  model: PropertyWhyTaxesGoUpModel;
  countyId: string;
  hasSaleHistory?: boolean;
  parcelRecordHref?: string | null;
}) {
  return (
    <section
      id={HOME_WHY_TAXES_GO_UP_SUMMARY_ID}
      className={`${DASHBOARD_SECTION_LEAD_STACK_CLASS} ${DASHBOARD_SECTION_ARRIVE_TARGET_CLASS}`}
      aria-labelledby={HOME_WHY_TAXES_GO_UP_SUMMARY_HEADING_ID}
    >
      <h3
        id={HOME_WHY_TAXES_GO_UP_SUMMARY_HEADING_ID}
        tabIndex={-1}
        className={`${DASHBOARD_SECTION_HEADING_CLASS} ${HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS} outline-none`}
      >
        {WHY_TAXES_GO_UP_HEADING}
      </h3>
      <div className="w-full">
        <WhyTaxesGoUpBar
          idPrefix="property-why-taxes"
          property={
            model.mode === "property"
              ? {
                  model,
                  countyId,
                  hasSaleHistory,
                  parcelRecordHref,
                }
              : undefined
          }
        />
      </div>
    </section>
  );
}
