// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useState } from "react";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import {
  ParcelRecordMissingValue,
  ParcelRecordReportIdsProvider,
  PARCEL_RECORD_MISSING_VALUE_TRIGGER_CLASS,
} from "@/components/ParcelRecordMissingValue";
import type { CountyParcelRecordRow } from "@/lib/countyParcelLevyData";
import type { ParcelGlossaryTermId } from "@/content/termDefinitionBodies";
import { useDisplayParcelRecord } from "@/hooks/useDisplayParcelRecord";
import { PARCEL_RECORD_LOAD_FAILED_MESSAGE } from "@/lib/parcelRecordLoadFailedMessage";
import { parcelRecordCellText } from "@/lib/parcelRecordCellText";
import { formatMartIntegerCodeDisplay, formatParcelFilingDisplay } from "@/lib/parcelRecordDisplay";
import { isBusinessPersonalPropertyAccount } from "@/lib/situsMultiPinChooser";
import { safeCountyParcelRecordUrl } from "@/lib/safeExternalHref";
import {
  COUNTY_CONFIG,
  countyParcelRecordLookupValue,
  type CountyConfig,
} from "@/lib/countyConfig";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  DASHBOARD_PANEL_SHELL_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";

/** Label column ~35%; value column gets the rest. Labels wrap at spaces only. */
const ROW_CLASS =
  "grid grid-cols-1 gap-1 border-b border-slate-200/90 py-3 last:border-b-0 sm:grid-cols-[minmax(0,2.5fr)_minmax(0,7.5fr)] sm:gap-x-3 sm:gap-y-0 sm:py-3";
/** 0.875rem labels on small screens; 1rem values (readable body size, respects user zoom). */
const LABEL_CLASS =
  "min-w-0 text-sm font-medium leading-snug text-slate-600";
const VALUE_CLASS =
  "min-w-0 break-words text-base leading-relaxed text-slate-900";
const MISSING_VALUE_CLASS =
  "min-w-0 text-base italic leading-relaxed text-slate-500";
const MISSING_TRIGGER_CLASS = `${PARCEL_RECORD_MISSING_VALUE_TRIGGER_CLASS} text-base leading-relaxed`;
const SKELETON_BAR = "h-[1.125rem] animate-pulse rounded bg-slate-200/90 sm:h-4";

type ParcelRecordRowProps = {
  termId?: ParcelGlossaryTermId;
  label: string;
  value: string | null | undefined;
  triggerIdSuffix: string;
};

function ParcelRecordRow({
  termId,
  label,
  value,
  triggerIdSuffix,
}: ParcelRecordRowProps) {
  const display = (value ?? "").trim();
  return (
    <div className={ROW_CLASS}>
      <dt className={LABEL_CLASS}>
        {termId ? (
          <ParcelGlossaryPopoverTrigger
            termId={termId}
            textTrigger={label}
            textTriggerId={`parcel-record-${triggerIdSuffix}`}
            variant="parcel-record"
          />
        ) : (
          parcelRecordCellText(label)
        )}
      </dt>
      <dd className={display ? VALUE_CLASS : MISSING_VALUE_CLASS}>
        {display ? (
          display
        ) : (
          <ParcelRecordMissingValue
            fieldLabel={label}
            triggerIdSuffix={triggerIdSuffix}
            className={MISSING_TRIGGER_CLASS}
          />
        )}
      </dd>
    </div>
  );
}

export type ParcelRecordPanelProps = {
  loading: boolean;
  loadFailed: boolean;
  record: CountyParcelRecordRow | null;
  /** Display PIN for missing-data mailto (demo uses the public demo PIN). */
  pin?: string | null;
  demoMode?: boolean;
  /**
   * Rent audience lens: hide owner mailing rows (not a renter primary action).
   * Owner-of-record name stays visible.
   */
  rentMode?: boolean;
  /** Resolved county for hosted parcel-record links. */
  countyConfig?: CountyConfig;
};

export function ParcelRecordPanel({
  loading,
  loadFailed,
  record,
  pin = null,
  demoMode = false,
  rentMode = false,
  countyConfig = COUNTY_CONFIG,
}: ParcelRecordPanelProps) {
  const [legalExpanded, setLegalExpanded] = useState(false);

  const displayRecord = useDisplayParcelRecord(record, demoMode);

  const parcelRecordHref = safeCountyParcelRecordUrl(
    countyParcelRecordLookupValue(countyConfig, {
      accountId: pin,
      publicParcelId: displayRecord?.ain,
    }),
    countyConfig,
  );
  const isBusinessPersonal =
    displayRecord != null &&
    isBusinessPersonalPropertyAccount({
      taxRollDescr: displayRecord.taxRollDescr,
      propertyClassDescr: displayRecord.propertyClassDescr,
    });

  const legalDisplay = (displayRecord?.legalDescrDisplay ?? "").trim();
  const legalFull = (displayRecord?.legalDescrFull ?? "").trim();
  const legalShowsExpand =
    legalDisplay.length > 0 &&
    legalFull.length > 0 &&
    legalFull !== legalDisplay;

  return (
    <div
      className={`${DASHBOARD_PANEL_SHELL_CLASS} p-3 sm:p-4`}
      aria-busy={loading}
    >
      {loading ? (
        <div className="space-y-3" aria-live="polite" aria-label="Loading property details">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <div className={`${SKELETON_BAR} w-24`} />
              <div className={`${SKELETON_BAR} w-full max-w-md`} />
            </div>
          ))}
        </div>
      ) : loadFailed ? (
        <p
          className="text-base leading-relaxed text-slate-700"
          role="status"
          aria-live="polite"
        >
          {PARCEL_RECORD_LOAD_FAILED_MESSAGE}
        </p>
      ) : displayRecord ? (
        <ParcelRecordReportIdsProvider pin={pin} ain={displayRecord.ain}>
          <dl>
            <ParcelRecordRow
              termId="term-ain"
              label="AIN"
              value={displayRecord.ain}
              triggerIdSuffix="ain"
            />
            <ParcelRecordRow
              termId="term-situs-address"
              label="Situs Address"
              value={displayRecord.situsAddress}
              triggerIdSuffix="situs-address"
            />
            <ParcelRecordRow
              termId="term-situs-city"
              label="Situs City"
              value={displayRecord.situsCity}
              triggerIdSuffix="situs-city"
            />
            {!isBusinessPersonal ? (
              <div className={ROW_CLASS}>
                <dt className={LABEL_CLASS}>
                  <ParcelGlossaryPopoverTrigger
                    termId="term-photo-sketch"
                    textTrigger="Photo / Sketch"
                    textTriggerId="parcel-record-photo-sketch"
                    variant="parcel-record"
                  />
                </dt>
                <dd
                  className={
                    demoMode || !parcelRecordHref
                      ? MISSING_VALUE_CLASS
                      : VALUE_CLASS
                  }
                >
                  {demoMode ? (
                    <span className={MISSING_VALUE_CLASS}>
                      Not available in demo mode.
                    </span>
                  ) : parcelRecordHref ? (
                    <a
                      href={parcelRecordHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={COUNTY_EXTERNAL_LINK_CLASS}
                    >
                      View on county site<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <ParcelRecordMissingValue
                      fieldLabel="Photo / Sketch"
                      triggerIdSuffix="photo-sketch"
                      className={MISSING_TRIGGER_CLASS}
                    />
                  )}
                </dd>
              </div>
            ) : null}
            <ParcelRecordRow
              termId="term-owner-list"
              label="Full Owner List"
              value={displayRecord.ownerList}
              triggerIdSuffix="owner-list"
            />
            {!isBusinessPersonal ? (
              <ParcelRecordRow
                termId="term-ownership-type"
                label="Ownership Type"
                value={displayRecord.ownershipType}
                triggerIdSuffix="ownership-type"
              />
            ) : null}
            {/* Rent lens: mailing address is owner-toolkit chrome, not renter payoff. */}
            {!rentMode ? (
              <>
                <ParcelRecordRow
                  label="Owner Address"
                  value={displayRecord.ownerDeliveryAddress}
                  triggerIdSuffix="owner-address"
                />
                <ParcelRecordRow
                  label="City/State/Zip"
                  value={displayRecord.ownerCityStateZip}
                  triggerIdSuffix="owner-city-state-zip"
                />
              </>
            ) : null}
            {!isBusinessPersonal ? (
              <>
                <ParcelRecordRow
                  label="Neighborhood"
                  value={displayRecord.neighborhood}
                  triggerIdSuffix="neighborhood"
                />
                <ParcelRecordRow
                  label="Neighborhood Code"
                  value={displayRecord.neighborhoodCode}
                  triggerIdSuffix="neighborhood-code"
                />
                <ParcelRecordRow
                  label="Acreage"
                  value={displayRecord.acreage}
                  triggerIdSuffix="acreage"
                />
                <ParcelRecordRow
                  termId="term-land-use"
                  label="Land Use"
                  value={displayRecord.landUse}
                  triggerIdSuffix="land-use"
                />
                <ParcelRecordRow
                  termId="term-state-use"
                  label="State Use"
                  value={displayRecord.stateUseLabel}
                  triggerIdSuffix="state-use"
                />
                <ParcelRecordRow
                  termId="term-state-use"
                  label="State Use Code"
                  value={formatMartIntegerCodeDisplay(displayRecord.stateUseCd)}
                  triggerIdSuffix="state-use-code"
                />
              </>
            ) : null}
            <ParcelRecordRow
              termId="term-tax-roll"
              label="Tax Roll"
              value={displayRecord.taxRollDescr}
              triggerIdSuffix="tax-roll"
            />
            {!isBusinessPersonal ? (
              <>
                <ParcelRecordRow
                  termId="term-subdivision"
                  label="Subdivision"
                  value={displayRecord.subdivisionName}
                  triggerIdSuffix="subdivision"
                />
                <ParcelRecordRow
                  termId="term-subdivision"
                  label="Subdivision Code"
                  value={formatMartIntegerCodeDisplay(
                    displayRecord.subdivisionCd,
                  )}
                  triggerIdSuffix="subdivision-code"
                />
                <ParcelRecordRow
                  label="Lot"
                  value={displayRecord.lotNo}
                  triggerIdSuffix="lot"
                />
                <ParcelRecordRow
                  label="Block"
                  value={displayRecord.blockNo}
                  triggerIdSuffix="block"
                />
                <ParcelRecordRow
                  label="Tract"
                  value={displayRecord.tractNo}
                  triggerIdSuffix="tract"
                />
                <ParcelRecordRow
                  label="Filing"
                  value={formatParcelFilingDisplay(
                    displayRecord.filingDescr,
                    displayRecord.filingNo,
                  )}
                  triggerIdSuffix="filing"
                />
              </>
            ) : null}
            <div className={ROW_CLASS}>
              <dt className={LABEL_CLASS}>
                <ParcelGlossaryPopoverTrigger
                  termId="term-legal-description"
                  textTrigger="Legal Desc"
                  textTriggerId="parcel-record-legal-desc"
                  variant="parcel-record"
                />
              </dt>
              <dd
                className={
                  legalDisplay || legalFull ? VALUE_CLASS : MISSING_VALUE_CLASS
                }
              >
                {legalDisplay || legalFull ? (
                  <div className="space-y-2">
                    <p>{legalDisplay || legalFull}</p>
                    {legalShowsExpand ? (
                      <div>
                        <button
                          type="button"
                          className={`text-sm ${TERM_LINK_CLASS} sm:text-base`}
                          aria-expanded={legalExpanded}
                          onClick={() => setLegalExpanded((v) => !v)}
                        >
                          {legalExpanded
                            ? "Hide full export text"
                            : "Show full export text"}
                        </button>
                        {legalExpanded ? (
                          <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                            {legalFull}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <ParcelRecordMissingValue
                    fieldLabel="Legal Desc"
                    triggerIdSuffix="legal-desc"
                    className={MISSING_TRIGGER_CLASS}
                  />
                )}
              </dd>
            </div>
          </dl>
        </ParcelRecordReportIdsProvider>
      ) : null}
    </div>
  );
}
