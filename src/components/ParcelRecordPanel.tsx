// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useMemo, useState } from "react";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import type { ArapahoeParcelRecordRow } from "@/lib/arapahoeParcelLevyData";
import type { ParcelGlossaryTermId } from "@/content/termDefinitionBodies";
import { obfuscateParcelRecordRow } from "@/lib/demoProperty";
import { parcelRecordCellText } from "@/lib/parcelRecordCellText";
import { safeArapahoeParcelRecordUrl } from "@/lib/safeExternalHref";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  DASHBOARD_PANEL_SHELL_CLASS,
} from "@/lib/toolFlowStyles";

/** Label column ~35%; value column gets the rest (definitions may wrap). */
const ROW_CLASS =
  "grid grid-cols-1 gap-1 border-b border-slate-200/90 py-3 last:border-b-0 sm:grid-cols-[minmax(0,2.5fr)_minmax(0,7.5fr)] sm:gap-x-3 sm:gap-y-0 sm:py-3";
/** 0.875rem labels on small screens; 1rem values (readable body size, respects user zoom). */
const LABEL_CLASS =
  "min-w-0 break-words text-sm font-medium leading-snug text-slate-600 [overflow-wrap:anywhere]";
const VALUE_CLASS =
  "min-w-0 break-words text-base leading-relaxed text-slate-900";
const MISSING_VALUE_CLASS =
  "min-w-0 text-base italic leading-relaxed text-slate-500";
const SKELETON_BAR = "h-[1.125rem] animate-pulse rounded bg-slate-200/90 sm:h-4";

const NO_DATA = "No data found";

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
        {display || NO_DATA}
      </dd>
    </div>
  );
}

export type ParcelRecordPanelProps = {
  loading: boolean;
  loadFailed: boolean;
  record: ArapahoeParcelRecordRow | null;
  demoMode?: boolean;
};

export function ParcelRecordPanel({
  loading,
  loadFailed,
  record,
  demoMode = false,
}: ParcelRecordPanelProps) {
  const [legalExpanded, setLegalExpanded] = useState(false);

  const displayRecord = useMemo(
    () =>
      record ? (demoMode ? obfuscateParcelRecordRow(record) : record) : null,
    [record, demoMode],
  );

  const parcelRecordHref = useMemo(
    () => safeArapahoeParcelRecordUrl(displayRecord?.ain),
    [displayRecord?.ain],
  );

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
          {Array.from({ length: 8 }, (_, i) => (
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
          Property details could not be loaded. Your levy breakdown above is still
          valid. Try refreshing the page.
        </p>
      ) : displayRecord ? (
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
            label="Situs City"
            value={displayRecord.situsCity}
            triggerIdSuffix="situs-city"
          />
          <div className={ROW_CLASS}>
            <dt className={LABEL_CLASS}>
              <ParcelGlossaryPopoverTrigger
                termId="term-photo-sketch"
                textTrigger="Photo / Sketch"
                textTriggerId="parcel-record-photo-sketch"
                variant="parcel-record"
              />
            </dt>
            <dd className={VALUE_CLASS}>
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
                  View on county site
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <span className={MISSING_VALUE_CLASS}>{NO_DATA}</span>
              )}
            </dd>
          </div>
          <ParcelRecordRow
            termId="term-owner-list"
            label="Full Owner List"
            value={displayRecord.ownerList}
            triggerIdSuffix="owner-list"
          />
          <ParcelRecordRow
            label="Ownership Type"
            value={displayRecord.ownershipType}
            triggerIdSuffix="ownership-type"
          />
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
          <ParcelRecordRow
            label="Acreage"
            value={displayRecord.acreage}
            triggerIdSuffix="acreage"
          />
          <ParcelRecordRow
            label="Land Use"
            value={displayRecord.landUse}
            triggerIdSuffix="land-use"
          />
          <div className={ROW_CLASS}>
            <dt className={LABEL_CLASS}>
              <ParcelGlossaryPopoverTrigger
                termId="term-legal-description"
                textTrigger="Legal Desc"
                textTriggerId="parcel-record-legal-desc"
                variant="parcel-record"
              />
            </dt>
            <dd className={VALUE_CLASS}>
              {legalDisplay || legalFull ? (
                <div className="space-y-2">
                  <p>{legalDisplay || legalFull}</p>
                  {legalShowsExpand ? (
                    <div>
                      <button
                        type="button"
                        className="cursor-pointer text-sm font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 sm:text-base"
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
                <span className={MISSING_VALUE_CLASS}>{NO_DATA}</span>
              )}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
