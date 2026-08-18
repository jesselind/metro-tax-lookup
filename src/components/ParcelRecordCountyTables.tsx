// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import { ParcelRecordMissingValue } from "@/components/ParcelRecordMissingValue";
import type { ParcelGlossaryTermId } from "@/content/termDefinitionBodies";
import { PARCEL_RECORD_BUILDING_ATTRIBUTE_TERM_IDS } from "@/content/parcelRecordBuildingAttributeTerms";
import type {
  ArapahoeParcelRecordRow,
  ParcelRecordBuilding,
  ParcelRecordPermit,
  ParcelRecordTransfer,
} from "@/lib/arapahoeParcelLevyData";
import { formatUsdWhole } from "@/lib/formatUsd";
import { buildParcelValueTableRows } from "@/lib/parcelAssessmentRates";
import { parcelRecordCellText } from "@/lib/parcelRecordCellText";
import { parcelTaxAssessmentYearNote } from "@/lib/parcelRecordDisplay";
import {
  safeArapahoeClerkRecorderSearchUrl,
  safeArapahoeParcelRecordUrl,
} from "@/lib/safeExternalHref";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  DASHBOARD_SECTION_ARRIVE_TARGET_CLASS,
} from "@/lib/toolFlowStyles";

const TABLE_CLASS =
  "w-full max-w-full table-auto border-collapse text-sm leading-snug text-slate-900 sm:text-base";
const WRAP_CELL_CLASS = "min-w-0 break-words";
/** Shrink-to-fit index column: as narrow as content allows, still wraps when needed. */
const INDEX_COL_CLASS = `w-[1%] ${WRAP_CELL_CLASS}`;
/** Value row labels: shrink on small screens; one line when there is room (sm+). */
const VALUE_ROW_LABEL_CLASS =
  `w-[1%] min-w-0 break-words sm:w-auto sm:whitespace-nowrap`;
const TH_CLASS = `border border-slate-200 bg-slate-100/90 px-2 py-1.5 text-left font-medium text-slate-700 ${WRAP_CELL_CLASS}`;
const TD_CLASS = `border border-slate-200 px-2 py-1.5 align-top text-slate-900 ${WRAP_CELL_CLASS}`;
const MONEY_TH_CLASS =
  "whitespace-nowrap border border-slate-200 bg-slate-100/90 px-2 py-1.5 text-right font-medium tabular-nums text-slate-700";
const MONEY_TD_CLASS =
  "border border-slate-200 px-2 py-1.5 text-right align-top tabular-nums text-slate-900";
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

const SECTION_TITLE_GLOSSARY: Partial<
  Record<string, { termId: ParcelGlossaryTermId; triggerIdSuffix: string }>
> = {
  "Land Line": {
    termId: "term-parcel-land-line",
    triggerIdSuffix: "section-land-line",
  },
  Sale: {
    termId: "term-parcel-sale",
    triggerIdSuffix: "section-sale",
  },
  Permits: {
    termId: "term-parcel-permit",
    triggerIdSuffix: "section-permits",
  },
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
};

/** In-table section title (Values, Sale, Building, Area, Land Line, Permits): label only, no cell chrome. */
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
    return MONEY_TH_CLASS;
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
  const glossary = SECTION_TITLE_GLOSSARY[title];
  return (
    <tr>
      <th
        colSpan={colSpan}
        scope="colgroup"
        className={`${SECTION_TITLE_ROW_CLASS} ${
          isFirst ? SECTION_TITLE_FIRST_PT_CLASS : SECTION_TITLE_FOLLOWING_PT_CLASS
        }`}
      >
        {glossary ? (
          <ParcelRecordTableGlossaryLabel
            text={title}
            termId={glossary.termId}
            triggerIdSuffix={glossary.triggerIdSuffix}
            variant="section-title"
          />
        ) : (
          title
        )}
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
}: {
  labels: ColumnHeaderLabel[];
  blankHeader?: "sr-only" | "hidden";
  blankHeaderSrOnly?: string;
  moneyColumns?: boolean;
  /** Building/land index columns shrink; sale/permit tables keep equal headers. */
  shrinkFirstColumn?: boolean;
}) {
  return (
    <tr>
      {labels.map((label, index) => {
        const labelText = typeof label === "string" ? label : label.text;
        return (
          <th
            key={`${labelText}-${index}`}
            scope="col"
            className={columnHeaderClass(index, moneyColumns, shrinkFirstColumn)}
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
): ReactNode {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return (
      <ParcelRecordMissingValue
        fieldLabel={fieldLabel}
        triggerIdSuffix={triggerIdSuffix}
      />
    );
  }
  return formatUsdWhole(value);
}

function ParcelValueTable({
  record,
  totalOnly = false,
}: {
  record: ArapahoeParcelRecordRow;
  /** Business personal property: totals only (no Building / Land columns). */
  totalOnly?: boolean;
}) {
  const year = (record.assessmentYear ?? "").trim();
  const yearNote = parcelTaxAssessmentYearNote(
    record.parcelTaxYear,
    record.assessmentYear,
  );
  const rows = buildParcelValueTableRows(record);

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

  const colSpan = totalOnly ? 2 : 4;

  return (
    <div className="space-y-2">
      {yearNote ? (
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base" role="note">
          {yearNote}
        </p>
      ) : null}
      <table className={TABLE_CLASS}>
      <caption className="sr-only">
        {totalOnly
          ? "Appraised and assessed values"
          : "Appraised and assessed values by total, building, and land"}
      </caption>
      <tbody>
        <SectionTitleRow
          title="Appraised and assessed values"
          isFirst
          colSpan={colSpan}
        />
        <ColumnHeaderRow
          labels={valueColumnHeaderLabels(totalOnly)}
          blankHeader="hidden"
          moneyColumns
        />
        {rowsToShow.map((row) => {
          const rowLabel = valueRowDisplayLabel(year, row.kind, row.rateLabel);
          return (
            <tr key={row.kind}>
              <th scope="row" className={`${TH_CLASS} ${VALUE_ROW_LABEL_CLASS} font-medium`}>
                <ValueRowLabel
                  year={year}
                  kind={row.kind}
                  rateLabel={row.rateLabel}
                />
              </th>
              <td className={MONEY_TD_CLASS}>
                {formatValueCell(
                  row.values.total,
                  `${rowLabel} (Total)`,
                  `${row.kind}-total`,
                )}
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

/** One county-style table: Building, Area, and Land Line share column widths. */
export function ParcelRecordBuildingAndLandTable({
  buildings,
  landLines,
}: {
  buildings: ParcelRecordBuilding[] | null | undefined;
  landLines: ArapahoeParcelRecordRow["landLines"];
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

  const rows: ReactNode[] = [];
  let isFirstTitle = true;

  const pushTitle = (title: string) => {
    rows.push(
      <SectionTitleRow
        key={`title-${title}-${rows.length}`}
        title={title}
        isFirst={isFirstTitle}
      />,
    );
    isFirstTitle = false;
  };

  for (const building of buildingsWithDetail) {
    const buildingNum = building.buildingNum || "1";
    const attributes = building.attributes ?? [];
    const areas = building.areas ?? [];
    const showAreaSection =
      areas.length > 0 || Boolean((building.totalArea ?? "").trim());

    if (attributes.length > 0) {
      pushTitle("Building");
      rows.push(
        <ColumnHeaderRow
          key={`hdr-building-${buildingNum}`}
          labels={["Building", "Attributes", "Recorded"]}
        />,
      );
      for (const [index, attr] of attributes.entries()) {
        const attrTermId = PARCEL_RECORD_BUILDING_ATTRIBUTE_TERM_IDS[attr.label];
        const attrLabelSpec: GlossaryLabelSpec | null = attrTermId
          ? {
              text: attr.label,
              termId: attrTermId,
              triggerIdSuffix: `attr-${attr.label.replace(/\s+/g, "-").toLowerCase()}`,
            }
          : null;
        rows.push(
          <tr key={`${buildingNum}-attr-${attr.label}`}>
            <td className={`${TD_CLASS} ${INDEX_COL_CLASS}`}>{index === 0 ? buildingNum : ""}</td>
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
    }

    if (showAreaSection) {
      pushTitle("Area");
      rows.push(
        <ColumnHeaderRow
          key={`hdr-area-${buildingNum}`}
          labels={["Building", "Description", "SqFt"]}
        />,
      );
      for (const [index, area] of areas.entries()) {
        rows.push(
          <tr key={`${buildingNum}-area-${area.description}-${index}`}>
            <td className={`${TD_CLASS} ${INDEX_COL_CLASS}`}>{index === 0 ? buildingNum : ""}</td>
            <td className={TD_CLASS}>{parcelRecordCellText(area.description)}</td>
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
        rows.push(
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
    }
  }

  if (landLineList.length > 0) {
    pushTitle("Land Line");
    rows.push(
      <ColumnHeaderRow
        key="hdr-land-line"
        labels={[
          "",
          buildingTableHeaderLabel("Units"),
          buildingTableHeaderLabel("Land Use"),
        ]}
        blankHeader="hidden"
      />,
    );
    for (const [index, line] of landLineList.entries()) {
      rows.push(
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
  }

  return (
    <table className={TABLE_CLASS}>
      <caption className="sr-only">
        Building attributes, area breakdown, and land line
      </caption>
      <tbody>{rows}</tbody>
    </table>
  );
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
export const PARCEL_RECORD_SALE_HISTORY_ID = "home-parcel-sale-history";

/** County-style Sale history (Book Page / Date / Price / Type). */
export function ParcelRecordSaleTable({
  transfers,
  ain,
  linkClerkRecorder = true,
}: {
  transfers: ParcelRecordTransfer[] | null | undefined;
  /** AIN for the short note linking to this parcel's county record. */
  ain?: string | null;
  /**
   * When false (demo mode), show Book Page as plain text so clerk links do not
   * reveal the hidden real demo source parcel via recorded documents.
   */
  linkClerkRecorder?: boolean;
}) {
  const rows = transfers ?? [];
  const countyParcelRecordUrl = safeArapahoeParcelRecordUrl(ain);

  return (
    <div
      id={PARCEL_RECORD_SALE_HISTORY_ID}
      tabIndex={-1}
      className={`scroll-mt-6 space-y-2 sm:scroll-mt-8 ${DASHBOARD_SECTION_ARRIVE_TARGET_CLASS}`}
    >
      <table className={TABLE_CLASS}>
        <caption className="sr-only">
          Sale history from county transfer records
        </caption>
        <tbody>
          <SectionTitleRow title="Sale" isFirst colSpan={4} />
          <ColumnHeaderRow
            labels={["Book Page", "Date", "Price", "Type"].map(saleTableHeaderLabel)}
            shrinkFirstColumn={false}
          />
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className={TD_CLASS}>
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
                  ? safeArapahoeClerkRecorderSearchUrl(bookPage)
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
                    {textOrMissing(sale.date, "Sale Date", `sale-date-${index}`)}
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
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {countyParcelRecordUrl && linkClerkRecorder ? (
        <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
          If a Book Page search finds no document, check the same sale list on your{" "}
          <a
            href={countyParcelRecordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={COUNTY_EXTERNAL_LINK_CLASS}
          >
            official county parcel record<span className="sr-only"> (opens in a new tab)</span>
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
    <table className={TABLE_CLASS}>
      <caption className="sr-only">Building permits from county permit records</caption>
      <tbody>
        <SectionTitleRow title="Permits" isFirst colSpan={6} />
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
  );
}

/** County-style value grid (Total / Building / Land columns). */
export function ParcelRecordValueSection({
  record,
  totalOnly = false,
}: {
  record: ArapahoeParcelRecordRow;
  /** Business personal property: totals only (no Building / Land columns). */
  totalOnly?: boolean;
}) {
  return <ParcelValueTable record={record} totalOnly={totalOnly} />;
}
