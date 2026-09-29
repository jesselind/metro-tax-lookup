// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * One Property value | Mill levy bar for unlocked home and locked Own Summary.
 * Home / generic: teaching gloss only. Property mode: same chrome + optional
 * bottom-right faces (change / gap / missing). Change teaching copy or bar
 * styles here once for both surfaces.
 */
import { useId } from "react";
import { ChartPieIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
} from "@heroicons/react/24/solid";
import {
  CountyServiceGapHeader,
} from "@/components/CountyServiceGapHeader";
import { GlossaryTermPopover } from "@/components/GlossaryTermPopover";
import {
  InfoHintPopover,
  useInfoHintPopoverDismiss,
} from "@/components/InfoHintPopover";
import {
  WhyTaxesGoUpTwoSegmentBar,
  WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS,
} from "@/components/WhyTaxesGoUpTwoSegmentBar";
import { CountyPriorYearValuesGapDashboardNote } from "@/content/countyPriorYearValuesGapNote";
import { COUNTY_SERVICE_GAP_CALLOUT_TITLE } from "@/content/countyServiceGapGuidance";
import { PARCEL_GLOSSARY_POPOVER_PANEL_CLASS } from "@/content/termDefinitionBodies";
import { jumpToParcelSaleHistory } from "@/lib/jumpToParcelSaleHistory";
import {
  formatAppraisedChangeFaceLine,
  formatAppraisedChangeFaceLines,
  formatMillsChangeFaceLine,
  formatMillsChangeFaceLines,
  MILL_LEVY_TEACHING_SUBTEXT,
  PROPERTY_VALUE_COUNTY_GAP_FACE,
  PROPERTY_VALUE_PROPERTY_MISSING_FACE,
  PROPERTY_VALUE_TEACHING_SUBTEXT,
  type PropertyWhyTaxesGoUpModel,
} from "@/lib/propertyWhyTaxesGoUp";
import { COUNTY_SERVICE_GAP_STACK_CLASS } from "@/lib/toolFlowStyles";

export const WHY_TAXES_GO_UP_HEADING =
  "Two numbers raise your property taxes";

/**
 * Loud $ / % change payoff — scales with segment width (`cqw`).
 * Preferred size a bit above teaching; max ~text-4xl so history half fills.
 */
const WHY_TAXES_PROPERTY_FACE_CLASS =
  "max-w-full text-center font-bold tabular-nums leading-tight tracking-tight text-white text-[clamp(1.5rem,15cqw,2.75rem)]";

/**
 * Arapahoe / missing-history warning — same family, lower max so long copy
 * does not dominate next to a short `%` + direction icon face.
 */
const WHY_TAXES_COUNTY_GAP_FACE_TEXT_CLASS =
  "max-w-full text-center font-bold leading-tight tracking-tight text-white text-[clamp(1.25rem,11cqw,1.875rem)]";

/** `since YYYY` — same container scale, one step quieter than the change line. */
const WHY_TAXES_PROPERTY_FACE_SINCE_CLASS =
  "max-w-full text-center font-bold tabular-nums leading-tight tracking-tight text-white text-[clamp(1.125rem,9cqw,1.625rem)]";

const WHY_TAXES_CHANGE_FACE_STACK_CLASS =
  "flex w-full min-w-0 flex-col items-center text-center";

const WHY_TAXES_CHANGE_FACE_AMOUNT_ROW_CLASS = `${WHY_TAXES_PROPERTY_FACE_CLASS} flex flex-wrap items-center justify-center gap-x-2 gap-y-1`;

function WhyTaxesGoUpChangeFaceStack({
  amountLine,
  direction,
  sinceLine,
}: {
  amountLine: string;
  direction: "higher" | "lower" | "unchanged";
  sinceLine: string | null;
}) {
  if (direction === "unchanged") {
    return (
      <div className={WHY_TAXES_CHANGE_FACE_STACK_CLASS}>
        <p className={WHY_TAXES_PROPERTY_FACE_CLASS}>{amountLine}</p>
      </div>
    );
  }

  const DirectionIcon =
    direction === "higher" ? ArrowUpCircleIcon : ArrowDownCircleIcon;

  return (
    <div className={WHY_TAXES_CHANGE_FACE_STACK_CLASS}>
      <p
        className={WHY_TAXES_CHANGE_FACE_AMOUNT_ROW_CLASS}
        aria-label={`${amountLine} ${direction}${sinceLine ? ` ${sinceLine}` : ""}`}
      >
        <span>{amountLine}</span>
        <DirectionIcon
          className="size-[1em] shrink-0"
          aria-hidden="true"
        />
      </p>
      {sinceLine != null ? (
        <p className={WHY_TAXES_PROPERTY_FACE_SINCE_CLASS}>{sinceLine}</p>
      ) : null}
    </div>
  );
}

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
  idPrefix,
  hasSaleHistory,
  countyId,
  parcelRecordHref,
}: {
  idPrefix: string;
  hasSaleHistory: boolean;
  countyId: string;
  parcelRecordHref?: string | null;
}) {
  return (
    <InfoHintPopover
      variant="county-data-gap"
      textTrigger="What's this?"
      textTriggerId={`${idPrefix}-property-value-gap`}
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

export type WhyTaxesGoUpBarPropertyProps = {
  model: Extract<PropertyWhyTaxesGoUpModel, { mode: "property" }>;
  countyId: string;
  hasSaleHistory?: boolean;
  parcelRecordHref?: string | null;
};

/**
 * Shared two-lever bar. Omit `property` for home / generic teaching; pass it
 * for locked Own Summary faces.
 */
export function WhyTaxesGoUpBar({
  idPrefix,
  className,
  property,
}: {
  idPrefix: string;
  className?: string;
  property?: WhyTaxesGoUpBarPropertyProps;
}) {
  const propertyValue = property?.model.propertyValue;
  const millLevy = property?.model.millLevy;
  const countyId = property?.countyId ?? "";
  const hasSaleHistory = property?.hasSaleHistory ?? false;
  const parcelRecordHref = property?.parcelRecordHref ?? null;

  const propertyBody = PROPERTY_VALUE_TEACHING_SUBTEXT;

  const propertyFace =
    propertyValue?.kind === "change" ? (
      <WhyTaxesGoUpChangeFaceStack
        {...formatAppraisedChangeFaceLines(propertyValue.face)}
      />
    ) : propertyValue?.kind === "county_gap" ? (
      <p className={WHY_TAXES_COUNTY_GAP_FACE_TEXT_CLASS}>
        {PROPERTY_VALUE_COUNTY_GAP_FACE}
      </p>
    ) : propertyValue?.kind === "property_missing" ? (
      <p className={WHY_TAXES_COUNTY_GAP_FACE_TEXT_CLASS}>
        {PROPERTY_VALUE_PROPERTY_MISSING_FACE}
      </p>
    ) : undefined;

  const millsFaceLines =
    millLevy != null ? formatMillsChangeFaceLines(millLevy) : null;
  const millsChangeLine =
    millLevy != null ? formatMillsChangeFaceLine(millLevy) : null;

  const propertyFooter =
    propertyValue?.kind === "county_gap" ? (
      <PropertyValueGapWhatsThis
        idPrefix={idPrefix}
        hasSaleHistory={hasSaleHistory}
        countyId={countyId}
        parcelRecordHref={parcelRecordHref}
      />
    ) : (
      <GlossaryTermPopover
        termId="term-actual-value"
        textTrigger="What's this?"
        textTriggerId={`${idPrefix}-property-value`}
        textTriggerClassName={WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS}
        ariaLabel="Brief definition of property value"
      />
    );

  const propertyListitemAriaLabel =
    propertyValue?.kind === "county_gap"
      ? `Property value. ${PROPERTY_VALUE_TEACHING_SUBTEXT}. ${COUNTY_SERVICE_GAP_CALLOUT_TITLE}. ${PROPERTY_VALUE_COUNTY_GAP_FACE}`
      : propertyValue?.kind === "property_missing"
        ? `Property value. ${PROPERTY_VALUE_TEACHING_SUBTEXT}. ${PROPERTY_VALUE_PROPERTY_MISSING_FACE}`
        : propertyValue?.kind === "change"
          ? `Property value. ${PROPERTY_VALUE_TEACHING_SUBTEXT}. ${formatAppraisedChangeFaceLine(propertyValue.face)}`
          : undefined;

  return (
    <WhyTaxesGoUpTwoSegmentBar
      className={className}
      segments={[
        {
          key: "property-value",
          title: "Property value",
          barClassName: "bg-slate-700",
          Icon: HomeModernIcon,
          body: propertyBody,
          face: propertyFace,
          footer: propertyFooter,
          listitemAriaLabel: propertyListitemAriaLabel,
        },
        {
          key: "mill-levy",
          title: "Mill levy",
          barClassName: "bg-rose-700",
          Icon: ChartPieIcon,
          body: MILL_LEVY_TEACHING_SUBTEXT,
          face:
            millsFaceLines != null ? (
              <WhyTaxesGoUpChangeFaceStack {...millsFaceLines} />
            ) : undefined,
          footer: (
            <GlossaryTermPopover
              termId="term-mill-levy-total"
              textTrigger="What's this?"
              textTriggerId={`${idPrefix}-mill-levy`}
              textTriggerClassName={WHY_TAXES_GO_UP_WHATS_THIS_TRIGGER_CLASS}
              ariaLabel="Brief definition of mill levy total"
            />
          ),
          listitemAriaLabel:
            millsChangeLine != null
              ? `Mill levy. ${MILL_LEVY_TEACHING_SUBTEXT}. ${millsChangeLine}`
              : undefined,
        },
      ]}
    />
  );
}
