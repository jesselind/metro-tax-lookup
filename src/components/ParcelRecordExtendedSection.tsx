// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useId, useState } from "react";
import {
  ParcelRecordBuildingAndLandTable,
  ParcelRecordPermitTable,
  ParcelRecordSaleTable,
  ParcelRecordValueSection,
} from "@/components/ParcelRecordCountyTables";
import { ParcelRecordReportIdsProvider } from "@/components/ParcelRecordMissingValue";
import { ToolOutlinedToggleButton } from "@/components/ToolOutlinedToggleButton";
import type { CountyParcelRecordRow } from "@/lib/countyParcelLevyData";
import { useDisplayParcelRecord } from "@/hooks/useDisplayParcelRecord";
import {
  COUNTY_CONFIG,
  type CountyConfig,
} from "@/lib/countyConfig";
import { PARCEL_RECORD_LOAD_FAILED_MESSAGE } from "@/lib/parcelRecordLoadFailedMessage";
import { isBusinessPersonalPropertyAccount } from "@/lib/situsMultiPinChooser";
import {
  PARCEL_RECORD_EXTENDED_SHELL_CLASS,
  DASHBOARD_SECTION_HEADING_SPACED_CLASS,
  TOOL_DISCLOSURE_ROW_ALIGN_CLASS,
} from "@/lib/toolFlowStyles";

export const PARCEL_RECORD_EXTENDED_SECTION_ID = "home-parcel-record-extended";

const TABLE_SKELETON = "h-24 animate-pulse rounded bg-slate-200/70";

export function shouldShowParcelRecordExtendedSection(
  loading: boolean,
  loadFailed: boolean,
  record: CountyParcelRecordRow | null,
): boolean {
  return loading || loadFailed || record != null;
}

export type ParcelRecordExtendedSectionProps = {
  loading: boolean;
  loadFailed: boolean;
  record: CountyParcelRecordRow | null;
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
  /**
   * Rent audience lens: keep Values; collapse sale / building-land / permits
   * under a flat disclosure (not a nested card) so dense tables are not the hero.
   */
  rentMode?: boolean;
  /** Resolved county for hosted record / clerk links. */
  countyConfig?: CountyConfig;
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
  rentMode = false,
  countyConfig = COUNTY_CONFIG,
}: ParcelRecordExtendedSectionProps) {
  const displayRecord = useDisplayParcelRecord(record, demoMode);
  const isBusinessPersonal =
    displayRecord != null
      ? isBusinessPersonalPropertyAccount({
          taxRollDescr: displayRecord.taxRollDescr,
          propertyClassDescr: displayRecord.propertyClassDescr,
        })
      : businessPersonal;
  const [showSaleBuildingLand, setShowSaleBuildingLand] = useState(false);
  const saleBuildingLandToggleId = useId();
  const saleBuildingLandPanelId = useId();

  if (!shouldShowParcelRecordExtendedSection(loading, loadFailed, record)) {
    return null;
  }

  const saleBuildingLandTables =
    displayRecord != null && !isBusinessPersonal ? (
      <>
        <ParcelRecordSaleTable
          transfers={displayRecord.transfers}
          ain={displayRecord.ain}
          pin={pin}
          linkClerkRecorder={!demoMode}
          countyConfig={countyConfig}
        />
        <ParcelRecordBuildingAndLandTable
          buildings={displayRecord.buildings}
          landLines={displayRecord.landLines}
        />
        <ParcelRecordPermitTable permits={displayRecord.permits} />
      </>
    ) : null;

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

      {loading || loadFailed || displayRecord == null ? (
        <div
          className={`${PARCEL_RECORD_EXTENDED_SHELL_CLASS} space-y-6 overflow-x-auto`}
          aria-live={loading ? "polite" : undefined}
        >
          {loading ? (
            <>
              <div className={TABLE_SKELETON} />
              {!isBusinessPersonal && !rentMode ? (
                <div className={`${TABLE_SKELETON} h-48`} />
              ) : null}
            </>
          ) : (
            <p
              className="text-base leading-relaxed text-slate-700"
              aria-hidden="true"
            >
              {PARCEL_RECORD_LOAD_FAILED_MESSAGE}
            </p>
          )}
        </div>
      ) : (
        <ParcelRecordReportIdsProvider pin={pin} ain={displayRecord.ain}>
          <div
            className={`${PARCEL_RECORD_EXTENDED_SHELL_CLASS} space-y-6 overflow-x-auto`}
          >
            <ParcelRecordValueSection
              record={displayRecord}
              totalOnly={isBusinessPersonal}
            />
            {!isBusinessPersonal && !rentMode ? saleBuildingLandTables : null}
          </div>
          {/*
            Rent: same outlined toggle pattern as metro "Check the math"
            (not a floating DisclosureSummary, not a nested card).
          */}
          {!isBusinessPersonal && rentMode ? (
            <div className="mt-4 space-y-3 sm:mt-5">
              <div className={TOOL_DISCLOSURE_ROW_ALIGN_CLASS}>
                <ToolOutlinedToggleButton
                  id={saleBuildingLandToggleId}
                  aria-expanded={showSaleBuildingLand}
                  aria-controls={saleBuildingLandPanelId}
                  onClick={() => setShowSaleBuildingLand((v) => !v)}
                >
                  {showSaleBuildingLand
                    ? "Hide sale, building, and land details"
                    : "Sale, building, and land details"}
                </ToolOutlinedToggleButton>
              </div>
              <div
                id={saleBuildingLandPanelId}
                hidden={!showSaleBuildingLand}
                aria-labelledby={saleBuildingLandToggleId}
                className="space-y-6 overflow-x-auto border-t border-slate-200 pt-4"
              >
                {saleBuildingLandTables}
              </div>
            </div>
          ) : null}
        </ParcelRecordReportIdsProvider>
      )}
    </section>
  );
}
