// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Locked property report: same WhyTaxesGoUpBar as unlocked home, with optional
 * property faces when publishable, plus collapsed From appraised value to a
 * tax bill walkthrough when parcel teaching values are available.
 */
import {
  WhyTaxesGoUpBar,
  WHY_TAXES_GO_UP_HEADING,
} from "@/components/WhyTaxesGoUpBar";
import { PropertyTaxMathTeaching } from "@/components/PropertyTaxMathTeaching";
import { DashboardSectionJumpHeading } from "@/components/HomeDashboardJumpIcon";
import {
  HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS,
  HOME_WHY_TAXES_GO_UP_SUMMARY_HEADING_ID,
  HOME_WHY_TAXES_GO_UP_SUMMARY_ID,
} from "@/lib/homeDashboardJumps";
import { jumpToLevyStack } from "@/lib/jumpToLevyStack";
import type { PropertyTaxMathTeachingValues } from "@/lib/propertyTaxMathTeaching";
import type { PropertyWhyTaxesGoUpModel } from "@/lib/propertyWhyTaxesGoUp";
import {
  DASHBOARD_SECTION_ARRIVE_TARGET_CLASS,
  DASHBOARD_SECTION_LEAD_STACK_CLASS,
} from "@/lib/toolFlowStyles";

export function PropertyWhyTaxesGoUpSection({
  model,
  countyId,
  hasSaleHistory = false,
  parcelRecordHref = null,
  teachingValues = null,
}: {
  model: PropertyWhyTaxesGoUpModel;
  countyId: string;
  hasSaleHistory?: boolean;
  parcelRecordHref?: string | null;
  /** Parcel walkthrough values; omit or null when data is incomplete. */
  teachingValues?: PropertyTaxMathTeachingValues | null;
}) {
  const hasTeaching = teachingValues != null;

  return (
    <section
      id={HOME_WHY_TAXES_GO_UP_SUMMARY_ID}
      className={`${DASHBOARD_SECTION_LEAD_STACK_CLASS} ${DASHBOARD_SECTION_ARRIVE_TARGET_CLASS}`}
      aria-labelledby={HOME_WHY_TAXES_GO_UP_SUMMARY_HEADING_ID}
    >
      <DashboardSectionJumpHeading
        jumpId="summary"
        id={HOME_WHY_TAXES_GO_UP_SUMMARY_HEADING_ID}
        tabIndex={-1}
        className={`${HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS} outline-none`}
      >
        {WHY_TAXES_GO_UP_HEADING}
      </DashboardSectionJumpHeading>
      <div
        className={
          hasTeaching
            ? "mt-6 w-full overflow-hidden rounded-lg ring-1 ring-slate-200/90"
            : "w-full"
        }
      >
        <WhyTaxesGoUpBar
          idPrefix="property-why-taxes"
          className={hasTeaching ? "mt-0 rounded-none" : undefined}
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
        {hasTeaching ? (
          <PropertyTaxMathTeaching
            idPrefix="property-tax-math"
            values={teachingValues}
            context="property"
            collapsedByDefault
            attachBelowBar
            className="mt-0"
            onJumpToLevyStack={jumpToLevyStack}
          />
        ) : null}
      </div>
    </section>
  );
}
