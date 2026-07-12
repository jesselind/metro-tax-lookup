// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { InfoHintPopover } from "@/components/InfoHintPopover";
import { PARCEL_GLOSSARY_POPOVER_PANEL_CLASS } from "@/content/termDefinitionBodies";
import { buildMissingParcelDataMailtoHref } from "@/lib/contact";
import { PARCEL_RECORD_NO_DATA } from "@/lib/parcelRecordNoData";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";

type ParcelRecordReportIds = {
  pin?: string | null;
  ain?: string | null;
};

const ParcelRecordReportIdsContext = createContext<ParcelRecordReportIds>({});

const BRIEF_P = "text-sm leading-relaxed text-slate-800 sm:text-base";

/** Default trigger look for missing values in the property panel and tables. */
export const PARCEL_RECORD_MISSING_VALUE_TRIGGER_CLASS =
  "inline italic text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700 hover:decoration-slate-500";

export function ParcelRecordReportIdsProvider({
  pin,
  ain,
  children,
}: ParcelRecordReportIds & { children: ReactNode }) {
  return (
    <ParcelRecordReportIdsContext.Provider value={{ pin, ain }}>
      {children}
    </ParcelRecordReportIdsContext.Provider>
  );
}

export type ParcelRecordMissingValueProps = {
  /** County UI field label included in the report mailto. */
  fieldLabel: string;
  /** Unique suffix for the popover trigger id. */
  triggerIdSuffix: string;
  className?: string;
};

/**
 * "No data found" as a popover trigger: short why + prefilled mailto (field, PIN, AIN).
 */
export function ParcelRecordMissingValue({
  fieldLabel,
  triggerIdSuffix,
  className = PARCEL_RECORD_MISSING_VALUE_TRIGGER_CLASS,
}: ParcelRecordMissingValueProps) {
  const { pin, ain } = useContext(ParcelRecordReportIdsContext);
  const label = fieldLabel.trim() || "this field";
  const mailtoHref = buildMissingParcelDataMailtoHref({
    fieldLabel: label,
    pin,
    ain,
  });

  return (
    <InfoHintPopover
      textTrigger={PARCEL_RECORD_NO_DATA}
      textTriggerId={`parcel-missing-${triggerIdSuffix}`}
      textTriggerClassName={className}
      textTriggerAriaLabel={`${PARCEL_RECORD_NO_DATA} for ${label}. Open for details and how to report it.`}
      ariaLabel={`Why ${label} shows no data found, and how to report it.`}
      panelClassName={PARCEL_GLOSSARY_POPOVER_PANEL_CLASS}
    >
      <p className={BRIEF_P}>
        Our copy of the county export does not include a value for{" "}
        <strong className="font-semibold text-slate-900">{label}</strong>
        {" "}
        on this parcel. The official county parcel record may still show it.
      </p>
      <p className={`${BRIEF_P} mt-3`}>
        Think this looks wrong?{" "}
        <a href={mailtoHref} className={COUNTY_EXTERNAL_LINK_CLASS}>
          Email us about this missing field
        </a>
        .
      </p>
    </InfoHintPopover>
  );
}
