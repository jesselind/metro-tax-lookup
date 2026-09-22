// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useId, useState, type ReactNode } from "react";
import {
  ParcelRecordBuildingAndLandTable,
  ParcelRecordPermitTable,
  ParcelRecordSaleTable,
  ParcelRecordValueSection,
} from "@/components/ParcelRecordCountyTables";
import { ParcelRecordReportIdsProvider } from "@/components/ParcelRecordMissingValue";
import { ToolOutlinedToggleButton } from "@/components/ToolOutlinedToggleButton";
import type { CountyParcelRecordRow } from "@/lib/countyParcelLevyData";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";
import { useDisplayParcelRecord } from "@/hooks/useDisplayParcelRecord";
import {
  type CountyConfig,
} from "@/lib/countyConfig";
import { PARCEL_RECORD_LOAD_FAILED_MESSAGE } from "@/lib/parcelRecordLoadFailedMessage";
import { isBusinessPersonalPropertyAccount } from "@/lib/situsMultiPinChooser";
import {
  PARCEL_RECORD_EXTENDED_SHELL_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
  DASHBOARD_SECTION_LEAD_STACK_CLASS,
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
  countyConfig: CountyConfig;
  /**
   * Coming soon (IN PROGRESS) under Appraised and assessed (when values
   * render inside this section). Prior-year COUNTY DATA GAP uses
   * {@link priorYearValuesGap} inside kind cards instead.
   */
  sectionStatusChrome?: ReactNode;
  /**
   * Always-visible prior-year COUNTY DATA GAP in Appraised / Assessed cards
   * when values render inside this section.
   */
  priorYearValuesGap?: {
    countyId: string;
    parcelRecordHref?: string | null;
    hasSaleHistory: boolean;
  } | null;
  valuationHistory?: CountyValuationHistoryPoint[] | null;
  currentTaxYear?: number | null;
  totalMills?: number | null;
  /**
   * When TaxYear and AssessmentYear differ but the shard omitted them, pass the
   * locked-report note so Appraised and assessed values still explain the gap.
   */
  taxYearNoteOverride?: string | null;
  /**
   * When false, skip the values section (parent renders Appraised and assessed
   * above Property details). Sale / building / land / permits still mount here.
   */
  includeValueSection?: boolean;
};

/**
 * Extended county tables after Appraised and assessed values: Sale → Building /
 * Area / Land Line → Permits. On the locked report, values render as their own
 * section above Property details; pass {@link includeValueSection}`={false}`.
 * Business personal property keeps Values (totals only) when included here.
 * When `omitContinuationHeading` is set (home report), the parent section
 * heading covers the block — no "Property details cont." label.
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
  countyConfig,
  sectionStatusChrome = null,
  priorYearValuesGap = null,
  valuationHistory = null,
  currentTaxYear = null,
  totalMills = null,
  taxYearNoteOverride = null,
  includeValueSection = true,
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

  if (
    !shouldShowParcelRecordExtendedSection(
      loading,
      loadFailed,
      record,
    )
  ) {
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
      className={`scroll-mt-6 ${DASHBOARD_SECTION_LEAD_STACK_CLASS} sm:scroll-mt-8`}
      aria-labelledby={
        omitContinuationHeading
          ? undefined
          : "parcel-record-extended-heading"
      }
      aria-label={
        omitContinuationHeading && includeValueSection
          ? "Appraised and assessed values"
          : undefined
      }
      aria-busy={loading}
    >
      {!omitContinuationHeading ? (
        <h3
          id="parcel-record-extended-heading"
          className={`${DASHBOARD_SECTION_HEADING_CLASS} hidden lg:block`}
        >
          Property details cont.
        </h3>
      ) : null}

      {loading || loadFailed || displayRecord == null ? (
        <div
          className={`${PARCEL_RECORD_EXTENDED_SHELL_CLASS} space-y-6`}
          aria-live={loading ? "polite" : undefined}
        >
          {loading ? (
            <>
              {includeValueSection ? (
                <div className={TABLE_SKELETON} />
              ) : null}
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
          <div className={`${PARCEL_RECORD_EXTENDED_SHELL_CLASS} space-y-8`}>
            {includeValueSection ? (
              <ParcelRecordValueSection
                record={displayRecord}
                totalOnly={isBusinessPersonal}
                sectionStatusChrome={sectionStatusChrome}
                priorYearValuesGap={priorYearValuesGap}
                taxYearNoteOverride={taxYearNoteOverride}
                valuationHistory={valuationHistory}
                currentTaxYear={currentTaxYear}
                totalMills={totalMills}
              />
            ) : null}
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
                className="space-y-6 border-t border-slate-200 pt-4"
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
