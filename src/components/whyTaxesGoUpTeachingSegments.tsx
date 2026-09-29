// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { ChartPieIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import { GlossaryTermPopover } from "@/components/GlossaryTermPopover";
import {
  type WhyTaxesGoUpBarSegment,
  WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS,
} from "@/components/WhyTaxesGoUpTwoSegmentBar";
import {
  MILL_LEVY_TEACHING_SUBTEXT,
  PROPERTY_VALUE_TEACHING_SUBTEXT,
} from "@/lib/propertyWhyTaxesGoUp";

/** Generic Property value | Mill levy faces (unlocked home + property-report fallback). */
export function buildWhyTaxesGoUpTeachingSegments(
  idPrefix: string,
): WhyTaxesGoUpBarSegment[] {
  return [
    {
      key: "property-value",
      title: "Property value",
      barClassName: "bg-slate-700",
      Icon: HomeModernIcon,
      body: PROPERTY_VALUE_TEACHING_SUBTEXT,
      footer: (
        <GlossaryTermPopover
          termId="term-actual-value"
          textTrigger="What's this?"
          textTriggerId={`${idPrefix}-property-value`}
          textTriggerClassName={WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS}
          ariaLabel="Brief definition of property value"
        />
      ),
    },
    {
      key: "mill-levy",
      title: "Mill levy",
      barClassName: "bg-rose-700",
      Icon: ChartPieIcon,
      body: MILL_LEVY_TEACHING_SUBTEXT,
      footer: (
        <GlossaryTermPopover
          termId="term-mill-levy-total"
          textTrigger="What's this?"
          textTriggerId={`${idPrefix}-mill-levy`}
          textTriggerClassName={WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS}
          ariaLabel="Brief definition of mill levy total"
        />
      ),
    },
  ];
}
