// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { InfoHintPopover } from "@/components/InfoHintPopover";
import { GlossaryFullDefinitionLink } from "@/components/GlossaryFullDefinitionLink";
import {
  PARCEL_GLOSSARY_POPOVER_PANEL_CLASS,
  ParcelTermPopoverPanel,
  TermDebtFreeSchoolsMillLevyBriefBody,
  TermDeBrucingBriefBody,
  TermEligibleElectorsBriefBody,
  TermAggregateDebtBriefBody,
  TermLevyBriefBody,
  TermPinBriefBody,
  TermTagBriefBody,
  TermTaborBriefBody,
  levyModalTermRegistry,
  parcelGlossaryTermBriefRegistry,
  type ParcelGlossaryTermId,
} from "@/content/termDefinitionBodies";
import type { LevyModalTermId } from "@/lib/levyModalTermIds";
import { hasGlossaryFullEntry } from "@/lib/glossary";
import {
  PARCEL_RECORD_GLOSSARY_LINK_CLASS,
  PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS,
  TOOL_LINK_UNDERLINE_CLASS,
} from "@/lib/toolFlowStyles";
import type { FC, ReactNode } from "react";

/** Extra flow briefs not already in parcel or levy-modal registries. */
type ExtraFlowGlossaryTermId =
  | "term-mill-levy"
  | "term-pin"
  | "term-tag"
  | "term-debt-free-schools-mill-levy"
  | "term-de-brucing"
  | "term-tabor"
  | "term-eligible-electors"
  | "term-aggregate-debt";

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
    body = <ParcelTermPopoverPanel termId={termId as ParcelGlossaryTermId} />;
  } else {
    body = <Brief />;
  }

  const showGlossaryLink = hasGlossaryFullEntry(termId);

  return (
    <InfoHintPopover
      textTrigger={textTrigger}
      textTriggerId={textTriggerId}
      textTriggerClassName={textTriggerClassName ?? defaultTriggerClass}
      ariaLabel={ariaLabel ?? `Brief definition of ${title}.`}
      panelClassName={panelClassName ?? PARCEL_GLOSSARY_POPOVER_PANEL_CLASS}
      disabled={disabled}
    >
      <div className={showGlossaryLink ? "space-y-3" : undefined}>
        {body}
        {showGlossaryLink ? (
          <p className="border-t border-slate-200 pt-2 text-sm leading-snug">
            <GlossaryFullDefinitionLink termId={termId} />
          </p>
        ) : null}
      </div>
    </InfoHintPopover>
  );
}
