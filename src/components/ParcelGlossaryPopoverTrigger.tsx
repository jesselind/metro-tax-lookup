// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  GlossaryTermPopover,
  type FlowGlossaryTermId,
} from "@/components/GlossaryTermPopover";
import type { ParcelGlossaryTermId } from "@/content/termDefinitionBodies";
import {
  PARCEL_RECORD_SECTION_TITLE_GLOSSARY_LINK_CLASS,
  PARCEL_RECORD_TABLE_HEADER_GLOSSARY_LINK_CLASS,
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
 * Parcel / property-details glossary popover (brief; More in Glossary only when a full aside exists).
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
  const flowVariant =
    variant === "summary-tile" || variant === "parcel-record"
      ? variant
      : "inline";
  const headingClass =
    variant === "column-header"
      ? PARCEL_RECORD_TABLE_HEADER_GLOSSARY_LINK_CLASS
      : variant === "section-title"
        ? PARCEL_RECORD_SECTION_TITLE_GLOSSARY_LINK_CLASS
        : undefined;

  return (
    <GlossaryTermPopover
      termId={termId as FlowGlossaryTermId}
      textTrigger={textTrigger}
      textTriggerId={textTriggerId}
      ariaLabel={ariaLabel}
      textTriggerClassName={textTriggerClassName ?? headingClass}
      panelClassName={panelClassName}
      disabled={disabled}
      countyParcelRecordUrl={countyParcelRecordUrl}
      variant={flowVariant}
    />
  );
}
