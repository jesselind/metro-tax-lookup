// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { InfoHintPopover } from "@/components/InfoHintPopover";
import {
  PARCEL_GLOSSARY_POPOVER_PANEL_CLASS,
  ParcelTermPopoverPanel,
  parcelGlossaryTermBriefRegistry,
  type ParcelGlossaryTermId,
} from "@/content/termDefinitionBodies";
import {
  PARCEL_RECORD_GLOSSARY_LINK_CLASS,
  PARCEL_RECORD_SECTION_TITLE_GLOSSARY_LINK_CLASS,
  PARCEL_RECORD_TABLE_HEADER_GLOSSARY_LINK_CLASS,
  PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS,
} from "@/lib/toolFlowStyles";

export type ParcelGlossaryPopoverTriggerProps = {
  termId: ParcelGlossaryTermId;
  /** County UI label or tile label shown as the underlined trigger. */
  textTrigger: string;
  textTriggerId: string;
  /** Summary tiles use uppercase glossary styling; property details use sentence case. */
  variant?: "summary-tile" | "parcel-record" | "section-title" | "column-header";
  textTriggerClassName?: string;
  ariaLabel?: string;
  panelClassName?: string;
  disabled?: boolean;
  /** When set, school-value popover links to this county PPINum.aspx URL. */
  countyParcelRecordUrl?: string | null;
};

/**
 * Shared parcel glossary popover: InfoHintPopover + brief from `parcelGlossaryTermBriefRegistry`.
 * Used on home summary tiles and the property details panel.
 */
export function ParcelGlossaryPopoverTrigger({
  termId,
  textTrigger,
  textTriggerId,
  variant = "summary-tile",
  textTriggerClassName,
  ariaLabel,
  panelClassName,
  disabled,
  countyParcelRecordUrl,
}: ParcelGlossaryPopoverTriggerProps) {
  const { title } = parcelGlossaryTermBriefRegistry[termId];
  const defaultTriggerClass =
    variant === "column-header"
      ? PARCEL_RECORD_TABLE_HEADER_GLOSSARY_LINK_CLASS
      : variant === "section-title"
        ? PARCEL_RECORD_SECTION_TITLE_GLOSSARY_LINK_CLASS
        : variant === "parcel-record"
          ? PARCEL_RECORD_GLOSSARY_LINK_CLASS
          : PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS;

  return (
    <InfoHintPopover
      textTrigger={textTrigger}
      textTriggerId={textTriggerId}
      textTriggerClassName={textTriggerClassName ?? defaultTriggerClass}
      ariaLabel={ariaLabel ?? `Brief definition of ${title}.`}
      panelClassName={panelClassName ?? PARCEL_GLOSSARY_POPOVER_PANEL_CLASS}
      disabled={disabled}
    >
      <ParcelTermPopoverPanel
        termId={termId}
        countyParcelRecordUrl={countyParcelRecordUrl}
      />
    </InfoHintPopover>
  );
}
