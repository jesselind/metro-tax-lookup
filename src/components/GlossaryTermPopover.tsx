// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { InfoHintPopover } from "@/components/InfoHintPopover";
import { GlossaryFullDefinitionLink } from "@/components/GlossaryFullDefinitionLink";
import { QuestionMarkCircleIcon } from "@/components/QuestionMarkCircleIcon";
import {
  PARCEL_GLOSSARY_POPOVER_PANEL_CLASS,
  ParcelTermPopoverPanel,
  TermDebtFreeSchoolsMillLevyBriefBody,
  TermDeBrucingBriefBody,
  TermEligibleElectorsBriefBody,
  TermAggregateDebtBriefBody,
  TermLevyBriefBody,
  TermMillLevyTotalBriefBody,
  TermPinBriefBody,
  TermTagBriefBody,
  TermTaborBriefBody,
  TermFiscalYearBriefBody,
  TermStatuteLimitBriefBody,
  TermPropertyTaxRevenueLimitBriefBody,
  TermBondRepaymentBriefBody,
  levyModalTermRegistry,
  parcelGlossaryTermBriefRegistry,
  type ParcelGlossaryTermId,
} from "@/content/termDefinitionBodies";
import type { LevyModalTermId } from "@/lib/levyModalTermIds";
import { hasGlossaryFullEntry } from "@/lib/glossary";
import {
  PARCEL_RECORD_GLOSSARY_LINK_CLASS,
  PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS,
  PARCEL_SUMMARY_TILE_GLOSSARY_TEXT_CLASS,
  TOOL_LINK_UNDERLINE_CLASS,
} from "@/lib/toolFlowStyles";
import type { FC, ReactNode } from "react";
import type { PropertyTaxEstimateMode } from "@/lib/propertyTaxEstimate";
import {
  DEBT_FREE_SCHOOLS_MILL_LEVY_TERM_ID,
  type DebtFreeSchoolsMillLevyExample,
} from "@/content/debtFreeSchoolsMillLevy";

/** Extra flow briefs not already in parcel or levy-modal registries. */
type ExtraFlowGlossaryTermId =
  | "term-mill-levy"
  | "term-mill-levy-total"
  | "term-pin"
  | "term-tag"
  | "term-debt-free-schools-mill-levy"
  | "term-de-brucing"
  | "term-tabor"
  | "term-eligible-electors"
  | "term-aggregate-debt"
  | "term-fiscal-year"
  | "term-statute-limit"
  | "term-property-tax-revenue-limit"
  | "term-bond-repayment";

/** Terms with a brief popover on the property/levy flow (not only parcel registry). */
export type FlowGlossaryTermId =
  | ParcelGlossaryTermId
  | LevyModalTermId
  | ExtraFlowGlossaryTermId;

const EXTRA_BRIEFS: Record<
  ExtraFlowGlossaryTermId,
  { title: string; Brief: FC }
> = {
  "term-mill-levy": { title: "Mill levy", Brief: TermLevyBriefBody },
  "term-mill-levy-total": {
    title: "Mill levy",
    Brief: TermMillLevyTotalBriefBody,
  },
  "term-pin": { title: "PIN", Brief: TermPinBriefBody },
  "term-tag": { title: "TAG", Brief: TermTagBriefBody },
  "term-debt-free-schools-mill-levy": {
    title: "Debt-free schools mill levy",
    Brief: TermDebtFreeSchoolsMillLevyBriefBody,
  },
  "term-de-brucing": {
    title: "De-Brucing",
    Brief: TermDeBrucingBriefBody,
  },
  "term-tabor": { title: "TABOR", Brief: TermTaborBriefBody },
  "term-eligible-electors": {
    title: "Eligible electors",
    Brief: TermEligibleElectorsBriefBody,
  },
  "term-aggregate-debt": {
    title: "Aggregate debt",
    Brief: TermAggregateDebtBriefBody,
  },
  "term-fiscal-year": {
    title: "Fiscal year",
    Brief: TermFiscalYearBriefBody,
  },
  "term-statute-limit": {
    title: "Statute limit",
    Brief: TermStatuteLimitBriefBody,
  },
  "term-property-tax-revenue-limit": {
    title: "Property tax revenue limit",
    Brief: TermPropertyTaxRevenueLimitBriefBody,
  },
  "term-bond-repayment": {
    title: "Bond repayment",
    Brief: TermBondRepaymentBriefBody,
  },
};

/** True when {@link GlossaryTermPopover} can resolve a brief for this id. */
export function isFlowGlossaryTermId(id: string): id is FlowGlossaryTermId {
  return (
    id in EXTRA_BRIEFS ||
    id in parcelGlossaryTermBriefRegistry ||
    id in levyModalTermRegistry
  );
}

function resolveBrief(termId: FlowGlossaryTermId): { title: string; Brief: FC } {
  if (termId in EXTRA_BRIEFS) {
    return EXTRA_BRIEFS[termId as keyof typeof EXTRA_BRIEFS];
  }
  if (termId in parcelGlossaryTermBriefRegistry) {
    return parcelGlossaryTermBriefRegistry[termId as ParcelGlossaryTermId];
  }
  if (termId in levyModalTermRegistry) {
    return levyModalTermRegistry[termId as LevyModalTermId];
  }
  throw new Error(`No brief for glossary term: ${termId}`);
}

/** Inline prose: inherit surrounding type; indigo underline is the affordance. */
const INLINE_GLOSSARY_TRIGGER_CLASS = `text-inherit ${TOOL_LINK_UNDERLINE_CLASS}`;

type GlossaryTermPopoverProps = {
  termId: FlowGlossaryTermId;
  textTrigger: string;
  textTriggerId: string;
  ariaLabel?: string;
  /** Default: indigo underline only (inline prose). */
  textTriggerClassName?: string;
  panelClassName?: string;
  disabled?: boolean;
  /** When true, use summary-tile / parcel-record underline classes. */
  variant?: "inline" | "summary-tile" | "parcel-record";
  /** Extra brief copy after the registry body (e.g. this property's mill example). */
  afterBrief?: ReactNode;
  /** Face-tile mode for `term-property-tax` (Douglas `realwareTaxDollars` vs default stack). */
  propertyTaxEstimateMode?: PropertyTaxEstimateMode;
  /**
   * District ballot/budget example for `term-debt-free-schools-mill-levy`.
   * Required when that term appears on an authority-chain trail (see
   * `termBriefExamples` on the entry JSON).
   */
  debtFreeSchoolsExample?: DebtFreeSchoolsMillLevyExample;
};

/**
 * Popover-first term help: brief in place; "More in Glossary" only when a full aside exists.
 */
export function GlossaryTermPopover({
  termId,
  textTrigger,
  textTriggerId,
  ariaLabel,
  textTriggerClassName,
  panelClassName,
  disabled,
  variant = "inline",
  afterBrief,
  propertyTaxEstimateMode,
  debtFreeSchoolsExample,
}: GlossaryTermPopoverProps) {
  const { title, Brief } = resolveBrief(termId);
  const defaultTriggerClass =
    variant === "summary-tile"
      ? PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS
      : variant === "parcel-record"
        ? PARCEL_RECORD_GLOSSARY_LINK_CLASS
        : INLINE_GLOSSARY_TRIGGER_CLASS;

  let body: ReactNode;
  if (termId in parcelGlossaryTermBriefRegistry) {
    body = (
      <ParcelTermPopoverPanel
        termId={termId as ParcelGlossaryTermId}
        propertyTaxEstimateMode={propertyTaxEstimateMode}
      />
    );
  } else if (termId === DEBT_FREE_SCHOOLS_MILL_LEVY_TERM_ID) {
    body = (
      <TermDebtFreeSchoolsMillLevyBriefBody example={debtFreeSchoolsExample} />
    );
  } else {
    body = <Brief />;
  }

  const showGlossaryLink = hasGlossaryFullEntry(termId);
  const triggerClass = textTriggerClassName ?? defaultTriggerClass;
  const isSummaryTile = variant === "summary-tile";

  const panel = (
    <div className={showGlossaryLink || afterBrief ? "space-y-3" : undefined}>
      {body}
      {afterBrief}
      {showGlossaryLink ? (
        <p className="border-t border-slate-200 pt-2 text-base leading-snug">
          <GlossaryFullDefinitionLink termId={termId} />
        </p>
      ) : null}
    </div>
  );

  if (isSummaryTile) {
    return (
      <InfoHintPopover
        customTrigger={
          <>
            <span className={PARCEL_SUMMARY_TILE_GLOSSARY_TEXT_CLASS}>
              {textTrigger}
            </span>
            <span className="inline-flex size-[1lh] shrink-0">
              <QuestionMarkCircleIcon />
            </span>
          </>
        }
        textTriggerAriaLabel={textTrigger}
        textTriggerId={textTriggerId}
        textTriggerClassName={triggerClass}
        ariaLabel={ariaLabel ?? `Brief definition of ${title}.`}
        panelClassName={panelClassName ?? PARCEL_GLOSSARY_POPOVER_PANEL_CLASS}
        disabled={disabled}
      >
        {panel}
      </InfoHintPopover>
    );
  }

  return (
    <InfoHintPopover
      textTrigger={textTrigger}
      textTriggerId={textTriggerId}
      textTriggerClassName={triggerClass}
      ariaLabel={ariaLabel ?? `Brief definition of ${title}.`}
      panelClassName={panelClassName ?? PARCEL_GLOSSARY_POPOVER_PANEL_CLASS}
      disabled={disabled}
    >
      {panel}
    </InfoHintPopover>
  );
}
