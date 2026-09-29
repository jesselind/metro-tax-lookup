// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Locked property report: two-lever Summary bar (property-specific when
 * publishable; otherwise same generic faces as unlocked home teaching).
 * Jump label is temporary "Summary"; heading matches home sentence in
 * dashboard section-title style. Mobile-first.
 */
import { useId } from "react";
import { ChartPieIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import {
  CountyServiceGapHeader,
  CountyServiceGapWarningIcon,
} from "@/components/CountyServiceGapHeader";
import { GlossaryTermPopover } from "@/components/GlossaryTermPopover";
import { HOME_WHY_TAXES_GO_UP_HEADING } from "@/components/HomeWhyTaxesGoUpTeaching";
import {
  InfoHintPopover,
  useInfoHintPopoverDismiss,
} from "@/components/InfoHintPopover";
import {
  WhyTaxesGoUpTwoSegmentBar,
  WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS,
} from "@/components/WhyTaxesGoUpTwoSegmentBar";
import { buildWhyTaxesGoUpTeachingSegments } from "@/components/whyTaxesGoUpTeachingSegments";
import { CountyPriorYearValuesGapDashboardNote } from "@/content/countyPriorYearValuesGapNote";
import { COUNTY_SERVICE_GAP_CALLOUT_TITLE } from "@/content/countyServiceGapGuidance";
import { PARCEL_GLOSSARY_POPOVER_PANEL_CLASS } from "@/content/termDefinitionBodies";
import { jumpToParcelSaleHistory } from "@/lib/jumpToParcelSaleHistory";
import {
  HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS,
  HOME_WHY_TAXES_GO_UP_SUMMARY_HEADING_ID,
  HOME_WHY_TAXES_GO_UP_SUMMARY_ID,
} from "@/lib/homeDashboardJumps";
import {
  formatAppraisedChangeFaceLine,
  formatMillsChangeFaceLine,
  PROPERTY_VALUE_COUNTY_GAP_FACE,
  PROPERTY_VALUE_PROPERTY_MISSING_FACE,
  PROPERTY_VALUE_TEACHING_SUBTEXT,
  type PropertyWhyTaxesGoUpModel,
} from "@/lib/propertyWhyTaxesGoUp";
import {
  COUNTY_SERVICE_GAP_STACK_CLASS,
  DASHBOARD_SECTION_ARRIVE_TARGET_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
  DASHBOARD_SECTION_LEAD_STACK_CLASS,
} from "@/lib/toolFlowStyles";

function PriorYearValuesGapWhatsThisBody({
  hasSaleHistory,
  countyId,
  parcelRecordHref,
}: {
  hasSaleHistory: boolean;
  countyId: string;
  parcelRecordHref?: string | null;
}) {
  const dismiss = useInfoHintPopoverDismiss();
  const titleId = useId();
  return (
    <div
      className={COUNTY_SERVICE_GAP_STACK_CLASS}
      role="note"
      aria-labelledby={titleId}
    >
      <CountyServiceGapHeader density="compact" titleId={titleId} />
      <CountyPriorYearValuesGapDashboardNote
        countyId={countyId}
        parcelRecordHref={parcelRecordHref}
        valueKind="appraised"
        onSaleHistoryJump={
          hasSaleHistory
            ? () => {
                jumpToParcelSaleHistory();
                dismiss?.();
              }
            : undefined
        }
      />
    </div>
  );
}

function PropertyValueGapWhatsThis({
  hasSaleHistory,
  countyId,
  parcelRecordHref,
}: {
  hasSaleHistory: boolean;
  countyId: string;
  parcelRecordHref?: string | null;
}) {
  return (
    <InfoHintPopover
      variant="county-data-gap"
      textTrigger="What's this?"
      textTriggerId="property-why-taxes-property-value-gap"
      textTriggerClassName={WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS}
      textTriggerAriaLabel="Why prior-year property values from the county are missing"
      ariaLabel="Why prior-year property values from the county are missing"
      panelClassName={PARCEL_GLOSSARY_POPOVER_PANEL_CLASS}
    >
      <PriorYearValuesGapWhatsThisBody
        hasSaleHistory={hasSaleHistory}
        countyId={countyId}
        parcelRecordHref={parcelRecordHref}
      />
    </InfoHintPopover>
  );
}

function PropertyWhyTaxesGoUpPropertyBar({
  model,
  countyId,
  hasSaleHistory,
  parcelRecordHref,
}: {
  model: Extract<PropertyWhyTaxesGoUpModel, { mode: "property" }>;
  countyId: string;
  hasSaleHistory: boolean;
  parcelRecordHref?: string | null;
}) {
  const propertyBody =
    model.propertyValue.kind === "change" ? (
      <p>{formatAppraisedChangeFaceLine(model.propertyValue.face)}</p>
    ) : model.propertyValue.kind === "county_gap" ? (
      <div className="flex flex-col gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <CountyServiceGapWarningIcon className="h-6 w-6 shrink-0 text-red-300 sm:h-7 sm:w-7" />
          <p className="min-w-0 text-sm font-bold leading-snug tracking-wide text-red-300 sm:text-base">
            {COUNTY_SERVICE_GAP_CALLOUT_TITLE}
          </p>
        </div>
        <p className="font-bold leading-snug text-white">
          {PROPERTY_VALUE_COUNTY_GAP_FACE}
        </p>
      </div>
    ) : model.propertyValue.kind === "property_missing" ? (
      <p>{PROPERTY_VALUE_PROPERTY_MISSING_FACE}</p>
    ) : (
      <p>{PROPERTY_VALUE_TEACHING_SUBTEXT}</p>
    );

  const propertyFooter =
    model.propertyValue.kind === "county_gap" ? (
      <PropertyValueGapWhatsThis
        hasSaleHistory={hasSaleHistory}
        countyId={countyId}
        parcelRecordHref={parcelRecordHref}
      />
    ) : (
      <GlossaryTermPopover
        termId="term-actual-value"
        textTrigger="What's this?"
        textTriggerId="property-why-taxes-property-value"
        textTriggerClassName={WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS}
        ariaLabel="Brief definition of property value"
      />
    );

  return (
    <WhyTaxesGoUpTwoSegmentBar
      segments={[
        {
          key: "property-value",
          title: "Property value",
          barClassName: "bg-slate-700",
          Icon: HomeModernIcon,
          body: propertyBody,
          footer: propertyFooter,
          listitemAriaLabel:
            model.propertyValue.kind === "county_gap"
              ? `Property value. ${COUNTY_SERVICE_GAP_CALLOUT_TITLE}. ${PROPERTY_VALUE_COUNTY_GAP_FACE}`
              : model.propertyValue.kind === "property_missing"
                ? `Property value. ${PROPERTY_VALUE_PROPERTY_MISSING_FACE}`
                : model.propertyValue.kind === "change"
                  ? `Property value. ${formatAppraisedChangeFaceLine(model.propertyValue.face)}`
                  : undefined,
        },
        {
          key: "mill-levy",
          title: "Mill levy",
          barClassName: "bg-rose-700",
          Icon: ChartPieIcon,
          body: <p>{formatMillsChangeFaceLine(model.millLevy)}</p>,
          footer: (
            <GlossaryTermPopover
              termId="term-mill-levy-total"
              textTrigger="What's this?"
              textTriggerId="property-why-taxes-mill-levy"
              textTriggerClassName={WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS}
              ariaLabel="Brief definition of mill levy total"
            />
          ),
          listitemAriaLabel: `Mill levy. ${formatMillsChangeFaceLine(model.millLevy)}`,
        },
      ]}
    />
  );
}

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
        {HOME_WHY_TAXES_GO_UP_HEADING}
      </h3>
      <div className="w-full max-w-3xl">
        {model.mode === "generic" ? (
          <WhyTaxesGoUpTwoSegmentBar
            segments={buildWhyTaxesGoUpTeachingSegments(
              "property-why-taxes-generic",
            )}
          />
        ) : (
          <PropertyWhyTaxesGoUpPropertyBar
            model={model}
            countyId={countyId}
            hasSaleHistory={hasSaleHistory}
            parcelRecordHref={parcelRecordHref}
          />
        )}
      </div>
    </section>
  );
}
