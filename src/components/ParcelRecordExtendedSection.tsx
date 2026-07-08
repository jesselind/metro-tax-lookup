// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useMemo } from "react";
import {
  ParcelRecordBuildingAndLandTable,
  ParcelRecordValueSection,
} from "@/components/ParcelRecordCountyTables";
import type { ArapahoeParcelRecordRow } from "@/lib/arapahoeParcelLevyData";
import { obfuscateParcelRecordRow } from "@/lib/demoProperty";
import { PARCEL_RECORD_EXTENDED_SHELL_CLASS, DASHBOARD_SECTION_HEADING_CLASS } from "@/lib/toolFlowStyles";

export const PARCEL_RECORD_EXTENDED_SECTION_ID = "home-parcel-record-extended";

const TABLE_SKELETON = "h-24 animate-pulse rounded bg-slate-200/70";

export function shouldShowParcelRecordExtendedSection(
  loading: boolean,
  loadFailed: boolean,
  record: ArapahoeParcelRecordRow | null,
): boolean {
  return !loadFailed && (loading || record != null);
}

export type ParcelRecordExtendedSectionProps = {
  loading: boolean;
  loadFailed: boolean;
  record: ArapahoeParcelRecordRow | null;
  demoMode?: boolean;
};

export function ParcelRecordExtendedSection({
  loading,
  loadFailed,
  record,
  demoMode = false,
}: ParcelRecordExtendedSectionProps) {
  const displayRecord = useMemo(
    () =>
      record ? (demoMode ? obfuscateParcelRecordRow(record) : record) : null,
    [record, demoMode],
  );

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
        className={`${PARCEL_RECORD_EXTENDED_SHELL_CLASS} w-full min-w-0 space-y-6 overflow-x-auto`}
        aria-live={loading ? "polite" : undefined}
      >
        {loading ? (
          <>
            <div className={TABLE_SKELETON} />
            <div className={`${TABLE_SKELETON} h-48`} />
          </>
        ) : displayRecord ? (
          <>
            <ParcelRecordValueSection record={displayRecord} />
            <ParcelRecordBuildingAndLandTable
              buildings={displayRecord.buildings}
              landLines={displayRecord.landLines}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
