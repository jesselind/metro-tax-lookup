// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  ParcelRecordBuildingAndLandTable,
  ParcelRecordPermitTable,
  ParcelRecordSaleTable,
  ParcelRecordValueSection,
} from "@/components/ParcelRecordCountyTables";
import { ParcelRecordReportIdsProvider } from "@/components/ParcelRecordMissingValue";
import type { ArapahoeParcelRecordRow } from "@/lib/arapahoeParcelLevyData";
import { useDisplayParcelRecord } from "@/hooks/useDisplayParcelRecord";
import { PARCEL_RECORD_LOAD_FAILED_MESSAGE } from "@/lib/parcelRecordLoadFailedMessage";
import { isBusinessPersonalPropertyAccount } from "@/lib/situsMultiPinChooser";
import {
  PARCEL_RECORD_EXTENDED_SHELL_CLASS,
  DASHBOARD_SECTION_HEADING_SPACED_CLASS,
} from "@/lib/toolFlowStyles";

export const PARCEL_RECORD_EXTENDED_SECTION_ID = "home-parcel-record-extended";

const TABLE_SKELETON = "h-24 animate-pulse rounded bg-slate-200/70";

export function shouldShowParcelRecordExtendedSection(
  loading: boolean,
  loadFailed: boolean,
  record: ArapahoeParcelRecordRow | null,
): boolean {
  return loading || loadFailed || record != null;
}

export type ParcelRecordExtendedSectionProps = {
  loading: boolean;
  loadFailed: boolean;
  record: ArapahoeParcelRecordRow | null;
  /** Display PIN for missing-data mailto (demo uses the public demo PIN). */
  pin?: string | null;
  demoMode?: boolean;
  /**
   * Selected account classification while `record` is still loading.
   * Once `displayRecord` is available, classification comes from the record.
   */
  businessPersonal?: boolean;
  /**
   * When true (BPP continuous property column), omit the lg
   * "Property details cont." heading used for the below-grid Real layout.
   */
  omitContinuationHeading?: boolean;
};

/**
 * Extended county tables: Values → Sale → Building/Area/Land Line → Permits.
 * Renders inside the full-width Property details block below the levy stack.
 * Business personal property keeps Values (totals only). When
 * `omitContinuationHeading` is set (home report), the parent section heading
 * covers the block — no "Property details cont." label.
 */
export function ParcelRecordExtendedSection({
  loading,
  loadFailed,
  record,
  pin = null,
  demoMode = false,
  businessPersonal = false,
  omitContinuationHeading = false,
}: ParcelRecordExtendedSectionProps) {
  const displayRecord = useDisplayParcelRecord(record, demoMode);
  const isBusinessPersonal =
    displayRecord != null
      ? isBusinessPersonalPropertyAccount({
          taxRollDescr: displayRecord.taxRollDescr,
          propertyClassDescr: displayRecord.propertyClassDescr,
        })
      : businessPersonal;

  if (!shouldShowParcelRecordExtendedSection(loading, loadFailed, record)) {
    return null;
  }

  return (
    <section
      id={PARCEL_RECORD_EXTENDED_SECTION_ID}
      tabIndex={-1}
      className="scroll-mt-6 space-y-3 sm:scroll-mt-8"
      aria-labelledby={
        omitContinuationHeading
          ? undefined
          : "parcel-record-extended-heading"
      }
      aria-label={
        omitContinuationHeading ? "Appraised and assessed values" : undefined
      }
      aria-busy={loading}
    >
      {!omitContinuationHeading ? (
        <h3
          id="parcel-record-extended-heading"
          className={`${DASHBOARD_SECTION_HEADING_SPACED_CLASS} hidden lg:block`}
        >
          Property details cont.
        </h3>
      ) : null}
      <div
        className={`${PARCEL_RECORD_EXTENDED_SHELL_CLASS} space-y-6 overflow-x-auto`}
        aria-live={loading ? "polite" : undefined}
      >
        {loading ? (
          <>
            <div className={TABLE_SKELETON} />
            {!isBusinessPersonal ? (
              <div className={`${TABLE_SKELETON} h-48`} />
            ) : null}
          </>
        ) : loadFailed ? (
          <p
            className="text-base leading-relaxed text-slate-700"
            aria-hidden="true"
          >
            {PARCEL_RECORD_LOAD_FAILED_MESSAGE}
          </p>
        ) : displayRecord ? (
          <ParcelRecordReportIdsProvider pin={pin} ain={displayRecord.ain}>
            <ParcelRecordValueSection
              record={displayRecord}
              totalOnly={isBusinessPersonal}
            />
            {!isBusinessPersonal ? (
              <>
                <ParcelRecordSaleTable
                  transfers={displayRecord.transfers}
                  ain={displayRecord.ain}
                  linkClerkRecorder={!demoMode}
                />
                <ParcelRecordBuildingAndLandTable
                  buildings={displayRecord.buildings}
                  landLines={displayRecord.landLines}
                />
                <ParcelRecordPermitTable permits={displayRecord.permits} />
              </>
            ) : null}
          </ParcelRecordReportIdsProvider>
        ) : null}
      </div>
    </section>
  );
}
