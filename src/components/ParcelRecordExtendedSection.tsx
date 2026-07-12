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
import type { ArapahoeParcelRecordRow } from "@/lib/arapahoeParcelLevyData";
import { useDisplayParcelRecord } from "@/hooks/useDisplayParcelRecord";
import { PARCEL_RECORD_LOAD_FAILED_MESSAGE } from "@/lib/parcelRecordLoadFailedMessage";
import {
  PARCEL_RECORD_EXTENDED_SHELL_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
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
  demoMode?: boolean;
};

/**
 * Extended county tables below the levy + property grid (county field order):
 * Values → Sale → Building/Area/Land Line (one table, shared column widths) → Permits.
 * No outer card chrome; loadFailed shows a status here as well as in the sidebar.
 */
export function ParcelRecordExtendedSection({
  loading,
  loadFailed,
  record,
  demoMode = false,
}: ParcelRecordExtendedSectionProps) {
  const displayRecord = useDisplayParcelRecord(record, demoMode);

  if (!shouldShowParcelRecordExtendedSection(loading, loadFailed, record)) {
    return null;
  }

  return (
    <section
      id={PARCEL_RECORD_EXTENDED_SECTION_ID}
      tabIndex={-1}
      className="scroll-mt-6 space-y-3 sm:scroll-mt-8"
      aria-labelledby="parcel-record-extended-heading"
      aria-busy={loading}
    >
      <h3
        id="parcel-record-extended-heading"
        className={`${DASHBOARD_SECTION_HEADING_CLASS} hidden lg:block`}
      >
        Property details cont.
      </h3>
      <div
        className={`${PARCEL_RECORD_EXTENDED_SHELL_CLASS} space-y-6 overflow-x-auto`}
        aria-live={loading ? "polite" : undefined}
      >
        {loading ? (
          <>
            <div className={TABLE_SKELETON} />
            <div className={`${TABLE_SKELETON} h-48`} />
          </>
        ) : loadFailed ? (
          <p
            className="text-base leading-relaxed text-slate-700"
            aria-hidden="true"
          >
            {PARCEL_RECORD_LOAD_FAILED_MESSAGE}
          </p>
        ) : displayRecord ? (
          <>
            <ParcelRecordValueSection record={displayRecord} />
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
      </div>
    </section>
  );
}
