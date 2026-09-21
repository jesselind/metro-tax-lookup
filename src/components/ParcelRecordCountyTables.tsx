// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import { ParcelRecordMissingValue } from "@/components/ParcelRecordMissingValue";
import type { ParcelGlossaryTermId } from "@/content/termDefinitionBodies";
import { PARCEL_RECORD_BUILDING_ATTRIBUTE_TERM_IDS } from "@/content/parcelRecordBuildingAttributeTerms";
import {
  VALUATION_HISTORY_ACTUAL_CHANGED_HIGHER_SR,
  VALUATION_HISTORY_ACTUAL_CHANGED_LOWER_SR,
  VALUATION_HISTORY_CHANGED_HIGHER_SR,
  VALUATION_HISTORY_CHANGED_LOWER_SR,
  VALUATION_HISTORY_OPEN_ARIA_ACTUAL,
  VALUATION_HISTORY_OPEN_ARIA_ASSESSED,
} from "@/content/valuationHistoryCopy";
import type {
  CountyParcelRecordRow,
  ParcelRecordBuilding,
  ParcelRecordPermit,
  ParcelRecordTransfer,
} from "@/lib/countyParcelLevyData";
import { formatUsdWhole } from "@/lib/formatUsd";
import {
  HOME_APPRAISED_ASSESSED_ID,
  HOME_AREA_ID,
  HOME_BUILDINGS_ID,
  HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS,
  HOME_LAND_LINE_ID,
  HOME_PERMITS_ID,
  HOME_SALE_HISTORY_ID,
} from "@/lib/homeDashboardJumps";
import { buildParcelValueTableRows } from "@/lib/parcelAssessmentRates";
import { parcelRecordCellText } from "@/lib/parcelRecordCellText";
import { parcelTaxAssessmentYearNote } from "@/lib/parcelRecordDisplay";
import {
  countyParcelRecordLookupValue,
  type CountyConfig,
} from "@/lib/countyConfig";
import {
  safeCountyClerkRecorderSearchUrl,
  safeCountyParcelRecordUrl,
} from "@/lib/safeExternalHref";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  DASHBOARD_SECTION_ARRIVE_TARGET_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
  DASHBOARD_SECTION_LEAD_STACK_CLASS,
  PARCEL_VALUE_DELTA_INLINE_CLASS,
  PARCEL_VALUE_HISTORY_LINK_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";
import {
  DashboardHScrollTable,
  DASHBOARD_HSCROLL_TABLE_FOCUS_RING_CLASS,
  dashboardHScrollTableKeyDown,
  type DashboardHScrollTableProps,
} from "@/components/DashboardHScrollTable";
import type { ValuationValueKind } from "@/lib/valuationHistoryYoY";

/** Arrive + focus shell for a county table section (ring outside overflow scrollport). */
function ParcelRecordTableArriveSection({
  id,
  className = "",
  heading = null,
  beforeTable = null,
  scrollClassName,
  scrollProps,
  children,
}: {
  id: string;
  className?: string;
  /** Large dashboard section title (TOC siblings of Property details). */
  heading?: ReactNode;
  /** Optional note above the scrollport (kept outside overflow-x-auto). */
  beforeTable?: ReactNode;
  scrollClassName?: string;
  scrollProps?: DashboardHScrollTableProps["scrollProps"];
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      tabIndex={-1}
      className={`${HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS} ${DASHBOARD_SECTION_ARRIVE_TARGET_CLASS} outline-none ${className}`}
    >
      {heading}
      {beforeTable}
      <DashboardHScrollTable
        scrollClassName={scrollClassName}
        scrollProps={scrollProps}
      >
        {children}
      </DashboardHScrollTable>
    </div>
  );
}

/**
 * Same chrome as Property details / Comparable properties: plain large h3, optional
 * "What is this?" when a parcel glossary brief exists.
 */
function ParcelDashboardSectionHeading({
  title,
  termId,
  helpTriggerId,
  ariaLabel,
}: {
  title: string;
  termId?: ParcelGlossaryTermId;
  helpTriggerId?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <h3 className={DASHBOARD_SECTION_HEADING_CLASS}>{title}</h3>
      {termId != null && helpTriggerId != null ? (
        <ParcelGlossaryPopoverTrigger
          termId={termId}
          textTrigger="What is this?"
          textTriggerId={helpTriggerId}
          variant="parcel-record"
          textTriggerClassName={`text-xs ${TERM_LINK_CLASS} sm:text-sm`}
          ariaLabel={ariaLabel ?? `What ${title} means.`}
        />
      ) : null}
    </div>
  );
}

/** `min-w-full` (not `w-full`): fill the scrollport when narrow; hug content when wide. */
const TABLE_CLASS =
  "min-w-full table-auto border-collapse text-sm leading-snug text-slate-900 sm:text-base";
/**
 * Appraised/assessed uses border-separate so sticky first-column left pin works
 * reliably (border-collapse breaks sticky in common browsers).
 */
const VALUE_TABLE_CLASS =
  "min-w-full table-auto border-separate border-spacing-0 text-sm leading-snug text-slate-900 sm:text-base";
const WRAP_CELL_CLASS = "min-w-0 break-words";
/** Shrink-to-fit index column: as narrow as content allows, still wraps when needed. */
const INDEX_COL_CLASS = `w-[1%] ${WRAP_CELL_CLASS}`;
/** Value row labels: wrap on small screens; one line when there is room (sm+). */
const VALUE_ROW_LABEL_CLASS =
  `w-[1%] min-w-0 break-words sm:w-auto sm:whitespace-nowrap`;
/**
 * Frozen field-name column while Total / Building / Land scroll (same cue as
 * comps last-pinned shadow). Opaque bg so scrolling cells do not show through.
 */
const VALUE_TABLE_STICKY_HEADER_CLASS =
  "sticky left-0 z-20 !bg-slate-50 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.18)]";
const VALUE_TABLE_STICKY_BODY_CLASS =
  "sticky left-0 z-20 !bg-white shadow-[2px_0_6px_-2px_rgba(15,23,42,0.18)]";
/** Quiet hairline chrome (no full grid boxes). */
const TH_CLASS = `border-0 border-b border-slate-200 bg-slate-50 px-2.5 py-2 text-left text-xs font-semibold tracking-wide text-slate-600 sm:text-sm ${WRAP_CELL_CLASS}`;
/** Body row labels (Appraised / Assessed): readable sentence case, not header chrome. */
const ROW_LABEL_TH_CLASS = `border-0 border-b border-slate-100 bg-white px-2.5 py-2.5 text-left text-sm font-medium leading-snug text-slate-800 sm:text-base ${WRAP_CELL_CLASS}`;
const TD_CLASS = `border-0 border-b border-slate-100 px-2.5 py-2.5 align-top text-slate-900 ${WRAP_CELL_CLASS}`;
/** Money cells hug dollar text (like Permits Est. value). */
const MONEY_TH_CLASS =
  "w-[1%] whitespace-nowrap border-0 border-b border-slate-200 bg-slate-50 px-2.5 py-2 text-right text-xs font-semibold tracking-wide text-slate-600 tabular-nums sm:text-sm";
const MONEY_TH_TOTAL_CLASS =
  "w-[1%] whitespace-nowrap border-0 border-b border-slate-200 bg-slate-50 px-2.5 py-2 text-right text-xs font-bold tracking-wide text-slate-800 tabular-nums sm:text-sm";
const MONEY_TD_CLASS =
  "w-[1%] whitespace-nowrap border-0 border-b border-slate-100 px-2.5 py-2.5 text-right align-top tabular-nums text-slate-700";
const MONEY_TD_TOTAL_CLASS =
  "w-[1%] whitespace-nowrap border-0 border-b border-slate-100 px-2.5 py-2.5 text-right align-top tabular-nums text-slate-900";
const MONEY_TOTAL_FIGURE_CLASS =
  "text-base font-semibold tabular-nums tracking-tight text-slate-900 sm:text-lg";
type GlossaryLabelSpec = {
  text: string;
  termId: ParcelGlossaryTermId;
  triggerIdSuffix: string;
  variant?: "parcel-record" | "section-title" | "column-header";
};

function ParcelRecordTableGlossaryLabel({
  text,
  termId,
  triggerIdSuffix,
  variant = "parcel-record",
}: GlossaryLabelSpec) {
  return (
    <ParcelGlossaryPopoverTrigger
      termId={termId}
      textTrigger={text}
      textTriggerId={`parcel-record-table-${triggerIdSuffix}`}
      variant={variant}
    />
  );
}

function glossaryLabelOrText(
  spec: GlossaryLabelSpec | null,
  fallback: string,
): ReactNode {
  if (spec) {
    return <ParcelRecordTableGlossaryLabel {...spec} />;
  }
  return parcelRecordCellText(fallback);
}

const VALUE_ROW_GLOSSARY: Record<
  string,
  {
    termId: ParcelGlossaryTermId;
    label: string;
    triggerIdSuffix: string;
  }
> = {
  appraised: {
    termId: "term-appraised-total",
    label: "Appraised Value",
    triggerIdSuffix: "appraised-value",
  },
  assessed: {
    termId: "term-assessed-total",
    label: "Assessed Value",
    triggerIdSuffix: "assessed-value",
  },
  "assessed-school": {
    termId: "term-assessed-school-value",
    label: "Assessed School Value",
    triggerIdSuffix: "assessed-school-value",
  },
};

const VALUE_COLUMN_GLOSSARY: Record<
  string,
  { termId: ParcelGlossaryTermId; triggerIdSuffix: string }
> = {
  Total: { termId: "term-parcel-value-total", triggerIdSuffix: "col-total" },
  Building: {
    termId: "term-parcel-value-building",
    triggerIdSuffix: "col-building",
  },
  Land: { termId: "term-parcel-value-land", triggerIdSuffix: "col-land" },
};

const BUILDING_TABLE_COLUMN_GLOSSARY: Partial<
  Record<string, { termId: ParcelGlossaryTermId; triggerIdSuffix: string }>
> = {
  Units: { termId: "term-parcel-land-units", triggerIdSuffix: "hdr-units" },
  "Land Use": {
    termId: "term-parcel-land-line-land-use",
    triggerIdSuffix: "hdr-land-use",
  },
};

const SALE_TABLE_COLUMN_GLOSSARY: Partial<
  Record<string, { termId: ParcelGlossaryTermId; triggerIdSuffix: string }>
> = {
  "Book Page": {
    termId: "term-parcel-book-page",
    triggerIdSuffix: "hdr-book-page",
  },
  Grantor: {
    termId: "term-parcel-sale-grantor",
    triggerIdSuffix: "hdr-grantor",
  },
  Grantee: {
    termId: "term-parcel-sale-grantee",
    triggerIdSuffix: "hdr-grantee",
  },
};

/** In-table section title for follow-on blocks (extra Building/Area). */
const SECTION_TITLE_ROW_CLASS =
  "border-0 bg-transparent px-0 pb-2 text-left text-base font-semibold leading-snug text-slate-800 sm:text-lg";
/**
 * First title in a table block: light top pad.
 * Following titles (Area, Land Line): match the visual gap between separate tables
 * (extended section `space-y-6`) plus that first-title pad → pt-8.
 */
const SECTION_TITLE_FIRST_PT_CLASS = "pt-2";
const SECTION_TITLE_FOLLOWING_PT_CLASS = "pt-8";

function columnHeaderClass(
  index: number,
  moneyColumns: boolean,
  shrinkFirstColumn: boolean,
): string {
  if (moneyColumns && index > 0) {
    return index === 1 ? MONEY_TH_TOTAL_CLASS : MONEY_TH_CLASS;
  }
  if (index === 0 && shrinkFirstColumn) {
    return `${TH_CLASS} ${INDEX_COL_CLASS}`;
  }
  return TH_CLASS;
}

function SectionTitleRow({
  title,
  isFirst = false,
  colSpan = 3,
}: {
  title: string;
  isFirst?: boolean;
  colSpan?: number;
}) {
  const titleClass = `${SECTION_TITLE_ROW_CLASS} ${
    isFirst ? SECTION_TITLE_FIRST_PT_CLASS : SECTION_TITLE_FOLLOWING_PT_CLASS
  }`;
  return (
    <tr>
      <th colSpan={colSpan} scope="colgroup" className={titleClass}>
        {title}
      </th>
    </tr>
  );
}

type ColumnHeaderLabel = string | GlossaryLabelSpec;

function ColumnHeaderRow({
  labels,
  blankHeader = "sr-only",
  blankHeaderSrOnly = "Row",
  moneyColumns = false,
  shrinkFirstColumn = true,
  stickyFirstColumn = false,
}: {
  labels: ColumnHeaderLabel[];
  blankHeader?: "sr-only" | "hidden";
  blankHeaderSrOnly?: string;
  moneyColumns?: boolean;
  /** Building/land index columns shrink; sale/permit tables keep equal headers. */
  shrinkFirstColumn?: boolean;
  /** Appraised/assessed: freeze the blank field-name header with the row labels. */
  stickyFirstColumn?: boolean;
}) {
  return (
    <tr>
      {labels.map((label, index) => {
        const labelText = typeof label === "string" ? label : label.text;
        const stickyClass =
          stickyFirstColumn && index === 0
            ? ` ${VALUE_TABLE_STICKY_HEADER_CLASS}`
            : "";
        return (
          <th
            key={`${labelText}-${index}`}
            scope="col"
            className={`${columnHeaderClass(index, moneyColumns, shrinkFirstColumn)}${stickyClass}`}
            aria-hidden={!labelText && blankHeader === "hidden" ? true : undefined}
          >
            {labelText ? (
              typeof label === "string" ? (
                label
              ) : (
                <ParcelRecordTableGlossaryLabel
                  {...label}
                  variant={label.variant ?? "parcel-record"}
                />
              )
            ) : blankHeader === "hidden" ? null : (
              <span className="sr-only">{blankHeaderSrOnly}</span>
            )}
          </th>
        );
      })}
    </tr>
  );
}

function valueColumnHeaderLabels(totalOnly: boolean): ColumnHeaderLabel[] {
  const labels = totalOnly ? ["", "Total"] : ["", "Total", "Building", "Land"];
  return labels.map((label) => {
    if (!label) {
      return label;
    }
    const glossary = VALUE_COLUMN_GLOSSARY[label];
    if (!glossary) {
      return label;
    }
    return {
      text: label,
      termId: glossary.termId,
      triggerIdSuffix: glossary.triggerIdSuffix,
    };
  });
}

function tableColumnHeaderLabel(
  glossaryMap: Partial<
    Record<string, { termId: ParcelGlossaryTermId; triggerIdSuffix: string }>
  >,
  label: string,
): ColumnHeaderLabel {
  const glossary = glossaryMap[label];
  if (!glossary) {
    return label;
  }
  return {
    text: label,
    termId: glossary.termId,
    triggerIdSuffix: glossary.triggerIdSuffix,
    variant: "column-header" as const,
  };
}

function buildingTableHeaderLabel(label: string): ColumnHeaderLabel {
  return tableColumnHeaderLabel(BUILDING_TABLE_COLUMN_GLOSSARY, label);
}

function saleTableHeaderLabel(label: string): ColumnHeaderLabel {
  return tableColumnHeaderLabel(SALE_TABLE_COLUMN_GLOSSARY, label);
}

function valueRowDisplayLabel(
  year: string,
  kind: "appraised" | "assessed" | "assessed-school",
  rateLabel?: string | null,
): string {
  const glossary = VALUE_ROW_GLOSSARY[kind];
  const base = year ? `${year} ${glossary.label}` : glossary.label;
  return rateLabel ? `${base} (${rateLabel})` : base;
}

function ValueRowLabel({
  year,
  kind,
  rateLabel,
}: {
  year: string;
  kind: "appraised" | "assessed" | "assessed-school";
  rateLabel?: string | null;
}) {
  const glossary = VALUE_ROW_GLOSSARY[kind];
  return (
    <ParcelRecordTableGlossaryLabel
      text={valueRowDisplayLabel(year, kind, rateLabel)}
      termId={glossary.termId}
      triggerIdSuffix={glossary.triggerIdSuffix}
    />
  );
}

function formatValueCell(
  value: number | null | undefined,
  fieldLabel: string,
  triggerIdSuffix: string,
  emphasize = false,
): ReactNode {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return (
      <ParcelRecordMissingValue
        fieldLabel={fieldLabel}
        triggerIdSuffix={triggerIdSuffix}
      />
    );
  }
  const formatted = formatUsdWhole(value);
  if (!emphasize) {
    return formatted;
  }
  return <span className={MONEY_TOTAL_FIGURE_CLASS}>{formatted}</span>;
}

function formatValueDeltaInline(delta: number): string {
  if (delta > 0) {
    return `+${formatUsdWhole(delta)}`;
  }
  return formatUsdWhole(delta);
}

function ParcelValueTable({
  record,
  totalOnly = false,
  actualAffordance = null,
  assessedAffordance = null,
  taxYearNoteOverride = null,
}: {
  record: CountyParcelRecordRow;
  /** Business personal property: totals only (no Building / Land columns). */
  totalOnly?: boolean;
  /** Transferred Actual value summary-tile affordances (delta + YoY opener). */
  actualAffordance?: ParcelValueHistoryAffordance | null;
  /** Transferred Assessed value summary-tile affordances (delta + YoY + gap). */
  assessedAffordance?: ParcelValueHistoryAffordance | null;
  /**
   * When the parcel-record row lacks TaxYear/AssessmentYear but the locked report
   * still knows they differ (e.g. from valuation / levy summary years), show that note.
   */
  taxYearNoteOverride?: string | null;
}) {
  const year = (record.assessmentYear ?? "").trim();
  const yearNote =
    parcelTaxAssessmentYearNote(
      record.parcelTaxYear,
      record.assessmentYear,
    ) ?? taxYearNoteOverride;
  const rows = buildParcelValueTableRows(record);
  const sectionStatusChrome = assessedAffordance?.statusChrome ?? null;

  const hasAnyValue = rows.some(
    (row) =>
      row.values.total != null ||
      (!totalOnly &&
        (row.values.building != null || row.values.land != null)),
  );
  const rowsToShow = hasAnyValue
    ? rows
    : rows.filter((row) => row.kind === "appraised");
  if (rowsToShow.length === 0) {
    return (
      <p>
        <ParcelRecordMissingValue
          fieldLabel="Appraised and assessed values"
          triggerIdSuffix="values-empty"
        />
      </p>
    );
  }

  const beforeTableNotes =
    yearNote != null || sectionStatusChrome != null ? (
      <div className="space-y-2">
        {yearNote ? (
          <p
            className="text-sm leading-relaxed text-slate-600 sm:text-base"
            role="note"
          >
            {yearNote}
          </p>
        ) : null}
        {sectionStatusChrome ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {sectionStatusChrome}
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <ParcelRecordTableArriveSection
      id={HOME_APPRAISED_ASSESSED_ID}
      className={DASHBOARD_SECTION_LEAD_STACK_CLASS}
      heading={
        <ParcelDashboardSectionHeading
          title="Appraised and assessed values"
        />
      }
      beforeTable={beforeTableNotes}
      scrollClassName={DASHBOARD_HSCROLL_TABLE_FOCUS_RING_CLASS}
      scrollProps={{
        role: "region",
        tabIndex: 0,
        "aria-label":
          "Appraised and assessed values table. Field names stay fixed on the left. Use arrow keys, Page Up, Page Down, Home, or End to scroll other columns horizontally when they extend past the screen.",
        onKeyDown: dashboardHScrollTableKeyDown,
      }}
    >
      <table className={VALUE_TABLE_CLASS}>
      <caption className="sr-only">
        {totalOnly
          ? "Appraised and assessed values"
          : "Appraised and assessed values by total, building, and land"}
      </caption>
      <tbody>
        <ColumnHeaderRow
          labels={valueColumnHeaderLabels(totalOnly)}
          blankHeader="hidden"
          moneyColumns
          stickyFirstColumn
        />
        {rowsToShow.map((row) => {
          const rowLabel = valueRowDisplayLabel(year, row.kind, row.rateLabel);
          const affordance =
            row.kind === "appraised"
              ? actualAffordance
              : row.kind === "assessed"
                ? assessedAffordance
                : null;
          return (
            <tr key={row.kind}>
              <th
                scope="row"
                className={`${ROW_LABEL_TH_CLASS} ${VALUE_ROW_LABEL_CLASS} ${VALUE_TABLE_STICKY_BODY_CLASS}`}
              >
                <ValueRowLabel
                  year={year}
                  kind={row.kind}
                  rateLabel={row.rateLabel}
                />
              </th>
              <td className={MONEY_TD_TOTAL_CLASS}>
                <div className="inline-flex flex-col items-end gap-0.5">
                  {formatValueCell(
                    row.values.total,
                    `${rowLabel} (Total)`,
                    `${row.kind}-total`,
                    true,
                  )}
                  {affordance != null && row.values.total != null ? (
                    <ValueHistoryAffordanceRow
                      valueKind={
                        row.kind === "appraised" ? "actual" : "assessed"
                      }
                      value={row.values.total}
                      affordance={affordance}
                    />
                  ) : null}
                </div>
              </td>
              {!totalOnly ? (
                <>
                  <td className={MONEY_TD_CLASS}>
                    {formatValueCell(
                      row.values.building,
                      `${rowLabel} (Building)`,
                      `${row.kind}-building`,
                    )}
                  </td>
                  <td className={MONEY_TD_CLASS}>
                    {formatValueCell(
                      row.values.land,
                      `${rowLabel} (Land)`,
                      `${row.kind}-land`,
                    )}
                  </td>
                </>
              ) : null}
            </tr>
          );
        })}
      </tbody>
      </table>
    </ParcelRecordTableArriveSection>
  );
}

/**
 * Affordances transferred into Appraised and assessed Total cells:
 * signed dollar delta + valuation-history opener. Prior-year gap / in-progress
 * sit under the section title (see {@link ParcelValueTable} beforeTable).
 */
export type ParcelValueHistoryAffordance = {
  valueDelta: number | null;
  hasHistory: boolean;
  onOpen: () => void;
  statusChrome?: ReactNode;
};

function valueHistoryOpenAriaLabel(
  valueKind: ValuationValueKind,
  formattedValue: string,
  valueDelta: number | null,
): string {
  const base =
    valueKind === "assessed"
      ? VALUATION_HISTORY_OPEN_ARIA_ASSESSED
      : VALUATION_HISTORY_OPEN_ARIA_ACTUAL;
  const parts = [`${base} ${formattedValue}.`];
  // Visual delta is aria-hidden; announce signed $ with direction for SR.
  if (
    valueDelta != null &&
    Number.isFinite(valueDelta) &&
    valueDelta !== 0
  ) {
    parts.push(`${formatValueDeltaInline(valueDelta)}.`);
    parts.push(
      valueDelta > 0
        ? valueKind === "assessed"
          ? VALUATION_HISTORY_CHANGED_HIGHER_SR
          : VALUATION_HISTORY_ACTUAL_CHANGED_HIGHER_SR
        : valueKind === "assessed"
          ? VALUATION_HISTORY_CHANGED_LOWER_SR
          : VALUATION_HISTORY_ACTUAL_CHANGED_LOWER_SR,
    );
  }
  return parts.join(" ");
}

function ValueHistoryAffordanceRow({
  valueKind,
  value,
  affordance,
}: {
  valueKind: ValuationValueKind;
  value: number;
  affordance: ParcelValueHistoryAffordance;
}) {
  const formattedValue = formatUsdWhole(value);
  const showDelta =
    affordance.valueDelta != null &&
    Number.isFinite(affordance.valueDelta) &&
    affordance.valueDelta !== 0;
  const showHistory = affordance.hasHistory;
  if (!showDelta && !showHistory) {
    return null;
  }
  return (
    <div className="flex max-w-[12rem] flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5 sm:max-w-none">
      {showDelta ? (
        <span className={PARCEL_VALUE_DELTA_INLINE_CLASS} aria-hidden>
          {formatValueDeltaInline(affordance.valueDelta!)}
        </span>
      ) : null}
      {showHistory ? (
        <button
          type="button"
          className={PARCEL_VALUE_HISTORY_LINK_CLASS}
          aria-label={valueHistoryOpenAriaLabel(
            valueKind,
            formattedValue,
            affordance.valueDelta,
          )}
          onClick={affordance.onOpen}
        >
          Year over year
        </button>
      ) : null}
    </div>
  );
}

function buildingHasDetail(building: ParcelRecordBuilding): boolean {
  return (
    (building.attributes?.length ?? 0) > 0 ||
    (building.areas?.length ?? 0) > 0 ||
    Boolean((building.totalArea ?? "").trim())
  );
}

/** One county-style table family: Building, Area, and Land Line as separate
 * arrive targets (ring on a block wrapper; overflow-x-auto only around each table). */
export function ParcelRecordBuildingAndLandTable({
  buildings,
  landLines,
}: {
  buildings: ParcelRecordBuilding[] | null | undefined;
  landLines: CountyParcelRecordRow["landLines"];
}) {
  const buildingList = buildings ?? [];
  const landLineList = landLines ?? [];
  const buildingsWithDetail = buildingList.filter(buildingHasDetail);
  const hasContent = buildingsWithDetail.length > 0 || landLineList.length > 0;

  if (!hasContent) {
    return (
      <p>
        <ParcelRecordMissingValue
          fieldLabel="Building and Land Line"
          triggerIdSuffix="building-land-empty"
        />
      </p>
    );
  }

  const sections: ReactNode[] = [];
  let buildingsSectionIdAssigned = false;
  let areaSectionIdAssigned = false;

  for (const building of buildingsWithDetail) {
    const buildingNum = building.buildingNum || "1";
    const attributes = building.attributes ?? [];
    const areas = building.areas ?? [];
    const showAreaSection =
      areas.length > 0 || Boolean((building.totalArea ?? "").trim());

    if (attributes.length > 0) {
      const sectionId = buildingsSectionIdAssigned
        ? undefined
        : HOME_BUILDINGS_ID;
      buildingsSectionIdAssigned = true;
      const attrRows: ReactNode[] = [];
      for (const [index, attr] of attributes.entries()) {
        const attrTermId = PARCEL_RECORD_BUILDING_ATTRIBUTE_TERM_IDS[attr.label];
        const attrLabelSpec: GlossaryLabelSpec | null = attrTermId
          ? {
              text: attr.label,
              termId: attrTermId,
              triggerIdSuffix: `attr-${attr.label.replace(/\s+/g, "-").toLowerCase()}`,
            }
          : null;
        attrRows.push(
          <tr key={`${buildingNum}-attr-${attr.label}`}>
            <td className={`${TD_CLASS} ${INDEX_COL_CLASS}`}>
              {index === 0 ? buildingNum : ""}
            </td>
            <td className={TD_CLASS}>
              {glossaryLabelOrText(attrLabelSpec, attr.label)}
            </td>
            <td className={TD_CLASS}>
              {attr.value.trim() ? (
                parcelRecordCellText(attr.value)
              ) : (
                <ParcelRecordMissingValue
                  fieldLabel={attr.label}
                  triggerIdSuffix={`attr-${buildingNum}-${attr.label.replace(/\s+/g, "-").toLowerCase()}-value`}
                />
              )}
            </td>
          </tr>,
        );
      }
      const table = (
        <table className={TABLE_CLASS}>
          <caption className="sr-only">
            Building {buildingNum} attributes
          </caption>
          <tbody>
            {sectionId == null ? (
              <SectionTitleRow title="Building" isFirst />
            ) : null}
            <ColumnHeaderRow labels={["Building", "Attributes", "Recorded"]} />
            {attrRows}
          </tbody>
        </table>
      );
      sections.push(
        sectionId != null ? (
          <ParcelRecordTableArriveSection
            key={`building-${buildingNum}`}
            id={sectionId}
            className="space-y-3"
            heading={<ParcelDashboardSectionHeading title="Building(s)" />}
          >
            {table}
          </ParcelRecordTableArriveSection>
        ) : (
          <DashboardHScrollTable key={`building-${buildingNum}`}>
            {table}
          </DashboardHScrollTable>
        ),
      );
    }

    if (showAreaSection) {
      const sectionId = areaSectionIdAssigned ? undefined : HOME_AREA_ID;
      areaSectionIdAssigned = true;
      const areaRows: ReactNode[] = [];
      for (const [index, area] of areas.entries()) {
        areaRows.push(
          <tr key={`${buildingNum}-area-${area.description}-${index}`}>
            <td className={`${TD_CLASS} ${INDEX_COL_CLASS}`}>
              {index === 0 ? buildingNum : ""}
            </td>
            <td className={TD_CLASS}>
              {parcelRecordCellText(area.description)}
            </td>
            <td className={TD_CLASS}>
              {area.sqFt ? (
                area.sqFt
              ) : (
                <ParcelRecordMissingValue
                  fieldLabel={`${area.description || "Area"} SqFt`}
                  triggerIdSuffix={`area-sqft-${buildingNum}-${index}`}
                />
              )}
            </td>
          </tr>,
        );
      }
      if (building.totalArea) {
        areaRows.push(
          <tr key={`${buildingNum}-total-area`}>
            <td className={`${TD_CLASS} ${INDEX_COL_CLASS}`} />
            <td className={`${TD_CLASS} font-semibold text-slate-800`}>
              Bldg Total Area:
            </td>
            <td className={`${TD_CLASS} font-semibold text-slate-900`}>
              {building.totalArea}
            </td>
          </tr>,
        );
      }
      const table = (
        <table className={TABLE_CLASS}>
          <caption className="sr-only">Building {buildingNum} area</caption>
          <tbody>
            {sectionId == null ? <SectionTitleRow title="Area" isFirst /> : null}
            <ColumnHeaderRow labels={["Building", "Description", "SqFt"]} />
            {areaRows}
          </tbody>
        </table>
      );
      sections.push(
        sectionId != null ? (
          <ParcelRecordTableArriveSection
            key={`area-${buildingNum}`}
            id={sectionId}
            className="space-y-3"
            heading={<ParcelDashboardSectionHeading title="Area" />}
          >
            {table}
          </ParcelRecordTableArriveSection>
        ) : (
          <DashboardHScrollTable key={`area-${buildingNum}`}>
            {table}
          </DashboardHScrollTable>
        ),
      );
    }
  }

  if (landLineList.length > 0) {
    const landRows: ReactNode[] = [];
    for (const [index, line] of landLineList.entries()) {
      landRows.push(
        <tr key={`land-line-${index}`}>
          <td className={`${TD_CLASS} ${INDEX_COL_CLASS}`} />
          <td className={TD_CLASS}>
            {line.units?.trim() ? (
              parcelRecordCellText(line.units.trim())
            ) : (
              <ParcelRecordMissingValue
                fieldLabel="Land Line Units"
                triggerIdSuffix={`land-units-${index}`}
              />
            )}
          </td>
          <td className={TD_CLASS}>
            {line.landUse?.trim() ? (
              parcelRecordCellText(line.landUse.trim())
            ) : (
              <ParcelRecordMissingValue
                fieldLabel="Land Line Land Use"
                triggerIdSuffix={`land-use-${index}`}
              />
            )}
          </td>
        </tr>,
      );
    }
    sections.push(
      <ParcelRecordTableArriveSection
        key="land-line"
        id={HOME_LAND_LINE_ID}
        className="space-y-3"
        heading={
          <ParcelDashboardSectionHeading
            title="Land Line"
            termId="term-parcel-land-line"
            helpTriggerId="parcel-land-line-heading-help"
            ariaLabel="What Land Line means."
          />
        }
      >
        <table className={TABLE_CLASS}>
          <caption className="sr-only">Land line</caption>
          <tbody>
            <ColumnHeaderRow
              labels={[
                "",
                buildingTableHeaderLabel("Units"),
                buildingTableHeaderLabel("Land Use"),
              ]}
              blankHeader="hidden"
            />
            {landRows}
          </tbody>
        </table>
      </ParcelRecordTableArriveSection>,
    );
  }

  return <div className="space-y-8">{sections}</div>;
}

function textOrMissing(
  value: string | null | undefined,
  fieldLabel: string,
  triggerIdSuffix: string,
): ReactNode {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return (
      <ParcelRecordMissingValue
        fieldLabel={fieldLabel}
        triggerIdSuffix={triggerIdSuffix}
      />
    );
  }
  return parcelRecordCellText(trimmed);
}

/** Focus target for dashboard jumps to this table (Assessed value gap popover). */
export const PARCEL_RECORD_SALE_HISTORY_ID = HOME_SALE_HISTORY_ID;

/** County-style Sale history (Book Page / Date / Price / Type). */
export function ParcelRecordSaleTable({
  transfers,
  ain,
  pin = null,
  linkClerkRecorder = true,
  countyConfig,
}: {
  transfers: ParcelRecordTransfer[] | null | undefined;
  /** Public parcel id (AIN) when the county uses that for hosted record links. */
  ain?: string | null;
  /** Account id when the county parcel-record URL keys on account number. */
  pin?: string | null;
  /**
   * When false (demo mode), show Book Page as plain text so clerk links do not
   * reveal the hidden real demo source parcel via recorded documents.
   */
  linkClerkRecorder?: boolean;
  /** Resolved county for hosted parcel-record / clerk links (required). */
  countyConfig: CountyConfig;
}) {
  const rows = transfers ?? [];
  const showParties = rows.some(
    (sale) => (sale.grantor ?? "").trim() || (sale.grantee ?? "").trim(),
  );
  const columnCount = showParties ? 6 : 4;
  const headerLabels = showParties
    ? ["Book Page", "Date", "Price", "Type", "Grantor", "Grantee"]
    : ["Book Page", "Date", "Price", "Type"];
  const countyParcelRecordUrl = safeCountyParcelRecordUrl(
    countyParcelRecordLookupValue(countyConfig, {
      accountId: pin,
      publicParcelId: ain,
    }),
    countyConfig,
  );

  return (
    <div
      id={PARCEL_RECORD_SALE_HISTORY_ID}
      tabIndex={-1}
      className={`${HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS} ${DASHBOARD_SECTION_LEAD_STACK_CLASS} ${DASHBOARD_SECTION_ARRIVE_TARGET_CLASS} outline-none`}
    >
      <ParcelDashboardSectionHeading
        title="Sale history"
        termId="term-parcel-sale"
        helpTriggerId="parcel-sale-history-heading-help"
        ariaLabel="What sale history means."
      />
      <DashboardHScrollTable>
        <table className={TABLE_CLASS}>
          <caption className="sr-only">
            Sale history from county transfer records
          </caption>
          <tbody>
            <ColumnHeaderRow
              labels={headerLabels.map(saleTableHeaderLabel)}
              shrinkFirstColumn={false}
            />
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className={TD_CLASS}>
                  <ParcelRecordMissingValue
                    fieldLabel="Sale"
                    triggerIdSuffix="sale-empty"
                  />
                </td>
              </tr>
            ) : (
              rows.map((sale, index) => {
                const typeText = (sale.type ?? "").trim();
                const bookPage = (sale.bookPage ?? "").trim();
                const clerkHref =
                  linkClerkRecorder && bookPage
                    ? safeCountyClerkRecorderSearchUrl(bookPage, countyConfig)
                    : null;
                return (
                  <tr key={`sale-${sale.bookPage}-${sale.date ?? ""}-${index}`}>
                    <td className={TD_CLASS}>
                      {bookPage ? (
                        clerkHref ? (
                          <a
                            href={clerkHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={COUNTY_EXTERNAL_LINK_CLASS}
                          >
                            {parcelRecordCellText(bookPage)}
                            <span className="sr-only">
                              {" "}
                              (Clerk and Recorder search, opens in a new tab)
                            </span>
                          </a>
                        ) : (
                          parcelRecordCellText(bookPage)
                        )
                      ) : (
                        <ParcelRecordMissingValue
                          fieldLabel="Book Page"
                          triggerIdSuffix={`sale-book-page-${index}`}
                        />
                      )}
                    </td>
                    <td className={`${TD_CLASS} whitespace-nowrap`}>
                      {textOrMissing(
                        sale.date,
                        "Sale Date",
                        `sale-date-${index}`,
                      )}
                    </td>
                    <td className={MONEY_TD_CLASS}>
                      {formatValueCell(
                        sale.price,
                        "Sale Price",
                        `sale-price-${index}`,
                      )}
                    </td>
                    <td className={TD_CLASS}>
                      {typeText ? parcelRecordCellText(typeText) : null}
                    </td>
                    {showParties ? (
                      <>
                        <td className={TD_CLASS}>
                          {textOrMissing(
                            sale.grantor,
                            "Grantor",
                            `sale-grantor-${index}`,
                          )}
                        </td>
                        <td className={TD_CLASS}>
                          {textOrMissing(
                            sale.grantee,
                            "Grantee",
                            `sale-grantee-${index}`,
                          )}
                        </td>
                      </>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DashboardHScrollTable>
      {countyParcelRecordUrl && linkClerkRecorder ? (
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          If a Book Page search finds no document, check the same sale list on your{" "}
          <a
            href={countyParcelRecordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={COUNTY_EXTERNAL_LINK_CLASS}
          >
            official county {countyConfig.hostedPropertyPageName}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>.
        </p>
      ) : null}
    </div>
  );
}

/** Mart permit rows (optional; not always on PPINum.aspx). */
export function ParcelRecordPermitTable({
  permits,
}: {
  permits: ParcelRecordPermit[] | null | undefined;
}) {
  const rows = permits ?? [];
  if (rows.length === 0) {
    return null;
  }
  return (
    <ParcelRecordTableArriveSection
      id={HOME_PERMITS_ID}
      className="space-y-3"
      heading={
        <ParcelDashboardSectionHeading
          title="Permits"
          termId="term-parcel-permit"
          helpTriggerId="parcel-permits-heading-help"
          ariaLabel="What permits means."
        />
      }
    >
      <table className={TABLE_CLASS}>
        <caption className="sr-only">
          Building permits from county permit records
        </caption>
        <tbody>
          <ColumnHeaderRow
            labels={[
              "Permit #",
              "Status",
              "Description",
              "Issue date",
              "Final date",
              "Est. value",
            ]}
            shrinkFirstColumn={false}
          />
          {rows.map((permit, index) => (
            <tr key={`permit-${permit.permitNum ?? "row"}-${index}`}>
              <td className={TD_CLASS}>
                {textOrMissing(
                  permit.permitNum,
                  "Permit #",
                  `permit-num-${index}`,
                )}
              </td>
              <td className={TD_CLASS}>
                {textOrMissing(
                  permit.status,
                  "Permit Status",
                  `permit-status-${index}`,
                )}
              </td>
              <td className={TD_CLASS}>
                {textOrMissing(
                  permit.description,
                  "Permit Description",
                  `permit-desc-${index}`,
                )}
              </td>
              <td className={`${TD_CLASS} whitespace-nowrap`}>
                {textOrMissing(
                  permit.issueDate,
                  "Permit Issue date",
                  `permit-issue-${index}`,
                )}
              </td>
              <td className={`${TD_CLASS} whitespace-nowrap`}>
                {textOrMissing(
                  permit.finalDate,
                  "Permit Final date",
                  `permit-final-${index}`,
                )}
              </td>
              <td className={MONEY_TD_CLASS}>
                {formatValueCell(
                  permit.estimatedValue,
                  "Permit Est. value",
                  `permit-value-${index}`,
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ParcelRecordTableArriveSection>
  );
}

/** County-style value grid (Total / Building / Land columns). */
export function ParcelRecordValueSection({
  record,
  totalOnly = false,
  actualAffordance = null,
  assessedAffordance = null,
  taxYearNoteOverride = null,
}: {
  record: CountyParcelRecordRow;
  /** Business personal property: totals only (no Building / Land columns). */
  totalOnly?: boolean;
  actualAffordance?: ParcelValueHistoryAffordance | null;
  assessedAffordance?: ParcelValueHistoryAffordance | null;
  taxYearNoteOverride?: string | null;
}) {
  return (
    <ParcelValueTable
      record={record}
      totalOnly={totalOnly}
      actualAffordance={actualAffordance}
      assessedAffordance={assessedAffordance}
      taxYearNoteOverride={taxYearNoteOverride}
    />
  );
}
