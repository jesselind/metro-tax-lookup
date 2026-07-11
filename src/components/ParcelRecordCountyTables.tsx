// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import type { ParcelGlossaryTermId } from "@/content/termDefinitionBodies";
import { PARCEL_RECORD_BUILDING_ATTRIBUTE_TERM_IDS } from "@/content/parcelRecordBuildingAttributeTerms";
import type {
  ArapahoeParcelRecordRow,
  ParcelRecordBuilding,
} from "@/lib/arapahoeParcelLevyData";
import { formatUsdWhole } from "@/lib/formatUsd";
import { parcelRecordCellText } from "@/lib/parcelRecordCellText";
import { safeArapahoeParcelRecordUrl } from "@/lib/safeExternalHref";

const NO_DATA = "No data found";

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
const MISSING_CELL_CLASS = "italic text-slate-500";

type GlossaryLabelSpec = {
  text: string;
  termId: ParcelGlossaryTermId;
  triggerIdSuffix: string;
  variant?: "parcel-record" | "section-title" | "column-header";
  countyParcelRecordUrl?: string | null;
};

function ParcelRecordTableGlossaryLabel({
  text,
  termId,
  triggerIdSuffix,
  variant = "parcel-record",
  countyParcelRecordUrl,
}: GlossaryLabelSpec) {
  return (
    <ParcelGlossaryPopoverTrigger
      termId={termId}
      textTrigger={text}
      textTriggerId={`parcel-record-table-${triggerIdSuffix}`}
      variant={variant}
      countyParcelRecordUrl={countyParcelRecordUrl}
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
  { termId: ParcelGlossaryTermId; label: string; triggerIdSuffix: string }
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

function MissingTableCell() {
  return <span className={MISSING_CELL_CLASS}>{NO_DATA}</span>;
}

/** In-table section title row (Building, Area, Land Line). */
const SECTION_TITLE_ROW_CLASS =
  "border border-slate-200 bg-slate-50/60 px-2 pb-2 text-left text-base font-semibold leading-snug text-slate-800 sm:text-lg";

function columnHeaderClass(index: number, moneyColumns: boolean): string {
  if (moneyColumns && index > 0) {
    return MONEY_TH_CLASS;
  }
  if (index === 0) {
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
        className={`${SECTION_TITLE_ROW_CLASS} ${isFirst ? "pt-2" : "pt-6"}`}
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
}: {
  labels: ColumnHeaderLabel[];
  blankHeader?: "sr-only" | "hidden";
  blankHeaderSrOnly?: string;
  moneyColumns?: boolean;
}) {
  return (
    <tr>
      {labels.map((label, index) => {
        const labelText = typeof label === "string" ? label : label.text;
        return (
          <th
            key={`${labelText}-${index}`}
            scope="col"
            className={columnHeaderClass(index, moneyColumns)}
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

function valueColumnHeaderLabels(): ColumnHeaderLabel[] {
  return ["", "Total", "Building", "Land"].map((label) => {
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

function buildingTableHeaderLabel(label: string): ColumnHeaderLabel {
  const glossary = BUILDING_TABLE_COLUMN_GLOSSARY[label];
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

function ValueRowLabel({
  year,
  kind,
  countyParcelRecordUrl,
}: {
  year: string;
  kind: "appraised" | "assessed" | "assessed-school";
  countyParcelRecordUrl?: string | null;
}) {
  const glossary = VALUE_ROW_GLOSSARY[kind];
  const label = year ? `${year} ${glossary.label}` : glossary.label;
  return (
    <ParcelRecordTableGlossaryLabel
      text={label}
      termId={glossary.termId}
      triggerIdSuffix={glossary.triggerIdSuffix}
      countyParcelRecordUrl={
        kind === "assessed-school" ? countyParcelRecordUrl : undefined
      }
    />
  );
}

function formatValueCell(value: number | null | undefined): ReactNode {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return <MissingTableCell />;
  }
  return formatUsdWhole(value);
}

type ValueColumn = {
  total?: number | null;
  building?: number | null;
  land?: number | null;
};

function ParcelValueTable({ record }: { record: ArapahoeParcelRecordRow }) {
  const year = (record.assessmentYear ?? "").trim();
  const countyParcelRecordUrl = safeArapahoeParcelRecordUrl(record.ain);
  const rows: {
    kind: "appraised" | "assessed" | "assessed-school";
    values: ValueColumn;
  }[] = [
    {
      kind: "appraised",
      values: {
        total: record.totalActual,
        building: record.improvementActual,
        land: record.landActual,
      },
    },
    {
      kind: "assessed",
      values: {
        total: record.totalAssessed,
        building: record.assessedBuilding,
        land: record.assessedLand,
      },
    },
    {
      kind: "assessed-school",
      values: {
        total: record.schoolAssessedTotal,
        building: record.schoolAssessedBuilding,
        land: record.schoolAssessedLand,
      },
    },
  ];

  const hasAnyValue = rows.some(
    (row) =>
      row.values.total != null ||
      row.values.building != null ||
      row.values.land != null,
  );
  const rowsToShow = hasAnyValue
    ? rows
    : rows.filter((row) => row.kind === "appraised");
  if (rowsToShow.length === 0) {
    return <p className={MISSING_CELL_CLASS}>{NO_DATA}</p>;
  }

  return (
    <table className={TABLE_CLASS}>
      <caption className="sr-only">Appraised and assessed values by total, building, and land</caption>
      <tbody>
        <SectionTitleRow
          title="Appraised and assessed values"
          isFirst
          colSpan={4}
        />
        <ColumnHeaderRow
          labels={valueColumnHeaderLabels()}
          blankHeader="hidden"
          moneyColumns
        />
        {rowsToShow.map((row) => (
          <tr key={row.kind}>
            <th scope="row" className={`${TH_CLASS} ${VALUE_ROW_LABEL_CLASS} font-medium`}>
              <ValueRowLabel
                year={year}
                kind={row.kind}
                countyParcelRecordUrl={countyParcelRecordUrl}
              />
            </th>
            <td className={MONEY_TD_CLASS}>{formatValueCell(row.values.total)}</td>
            <td className={MONEY_TD_CLASS}>{formatValueCell(row.values.building)}</td>
            <td className={MONEY_TD_CLASS}>{formatValueCell(row.values.land)}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
    return <p className={MISSING_CELL_CLASS}>{NO_DATA}</p>;
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
            <td className={TD_CLASS}>{parcelRecordCellText(attr.value)}</td>
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
              {area.sqFt ? area.sqFt : <MissingTableCell />}
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
              <MissingTableCell />
            )}
          </td>
          <td className={TD_CLASS}>
            {line.landUse?.trim() ? (
              parcelRecordCellText(line.landUse.trim())
            ) : (
              <MissingTableCell />
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

/** County-style value grid (Total / Building / Land columns). */
export function ParcelRecordValueSection({
  record,
}: {
  record: ArapahoeParcelRecordRow;
}) {
  return <ParcelValueTable record={record} />;
}
