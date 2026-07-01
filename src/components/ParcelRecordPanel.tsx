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
import { formatUsdWhole } from "@/lib/formatUsd";
import { safeArapahoeParcelRecordUrl } from "@/lib/safeExternalHref";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  DASHBOARD_TILE_RADIUS_CLASS,
} from "@/lib/toolFlowStyles";

const PANEL_SHELL = `${DASHBOARD_TILE_RADIUS_CLASS} border border-slate-200 bg-slate-50/80`;
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

/** Allow wraps at `/` in county labels like City/State/Zip (no spaces). */
function parcelRecordLabelContent(label: string) {
  if (!label.includes("/")) {
    return label;
  }
  const parts = label.split("/");
  return parts.map((part, index) => (
    <span key={`${index}-${part}`}>
      {index > 0 ? (
        <>
          /
          <wbr />
        </>
      ) : null}
      {part}
    </span>
  ));
}

function formatUsdCell(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return formatUsdWhole(value);
}

/** Prefix county value row labels with AssessmentYear when present (e.g. 2026 Appraised (Total)). */
function countyParcelValueLabel(
  assessmentYear: string | null | undefined,
  baseLabel: string,
): string {
  const year = (assessmentYear ?? "").trim();
  return year ? `${year} ${baseLabel}` : baseLabel;
}

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
          parcelRecordLabelContent(label)
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
      className={`${PANEL_SHELL} p-3 sm:p-4`}
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
        <p className="text-base leading-relaxed text-slate-700" role="status">
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
            label="Owner Address"
            value={displayRecord.ownerDeliveryAddress}
            triggerIdSuffix="owner-address"
          />
          <ParcelRecordRow
            label="City/State/Zip"
            value={displayRecord.ownerCityStateZip}
            triggerIdSuffix="owner-city-state-zip"
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
          <ParcelRecordRow
            termId="term-appraised-total"
            label={countyParcelValueLabel(
              displayRecord.assessmentYear,
              "Appraised (Total)",
            )}
            value={formatUsdCell(displayRecord.totalActual)}
            triggerIdSuffix="appraised-total"
          />
          <ParcelRecordRow
            termId="term-appraised-building"
            label={countyParcelValueLabel(
              displayRecord.assessmentYear,
              "Appraised (Building)",
            )}
            value={formatUsdCell(displayRecord.improvementActual)}
            triggerIdSuffix="appraised-building"
          />
          <ParcelRecordRow
            termId="term-appraised-land"
            label={countyParcelValueLabel(
              displayRecord.assessmentYear,
              "Appraised (Land)",
            )}
            value={formatUsdCell(displayRecord.landActual)}
            triggerIdSuffix="appraised-land"
          />
          <ParcelRecordRow
            termId="term-assessed-total"
            label={countyParcelValueLabel(
              displayRecord.assessmentYear,
              "Assessed (Total)",
            )}
            value={formatUsdCell(displayRecord.totalAssessed)}
            triggerIdSuffix="assessed-total"
          />
          <ParcelRecordRow
            termId="term-assessed-building"
            label={countyParcelValueLabel(
              displayRecord.assessmentYear,
              "Assessed (Building)",
            )}
            value={null}
            triggerIdSuffix="assessed-building"
          />
          <ParcelRecordRow
            termId="term-assessed-land"
            label={countyParcelValueLabel(
              displayRecord.assessmentYear,
              "Assessed (Land)",
            )}
            value={null}
            triggerIdSuffix="assessed-land"
          />
        </dl>
      ) : null}
    </div>
  );
}
