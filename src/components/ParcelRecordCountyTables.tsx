// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import type {
  ArapahoeParcelRecordRow,
  ParcelRecordBuilding,
} from "@/lib/arapahoeParcelLevyData";
import { formatUsdWhole } from "@/lib/formatUsd";
import { parcelRecordCellText } from "@/lib/parcelRecordCellText";

const NO_DATA = "No data found";

const TABLE_CLASS =
  "w-full max-w-full table-fixed border-collapse text-sm leading-snug text-slate-900 sm:text-base";
const CELL_WRAP_CLASS = "min-w-0 break-words [overflow-wrap:anywhere]";
const TH_CLASS = `border border-slate-200 bg-slate-100/90 px-2 py-1.5 text-left font-medium text-slate-700 ${CELL_WRAP_CLASS}`;
const TD_CLASS = `border border-slate-200 px-2 py-1.5 align-top text-slate-900 ${CELL_WRAP_CLASS}`;
const MISSING_CELL_CLASS = "italic text-slate-500";

function MissingTableCell() {
  return <span className={MISSING_CELL_CLASS}>{NO_DATA}</span>;
}

/** In-table section title row (Building, Area, Land Line). */
const SECTION_TITLE_ROW_CLASS =
  "border border-slate-200 bg-slate-50/60 px-2 pb-2 text-left text-base font-semibold leading-snug text-slate-800 sm:text-lg";

const DETAIL_TABLE_COLGROUP = (
  <colgroup>
    <col className="w-[4.5rem] sm:w-[5rem]" />
    <col />
    <col className="w-[30%] sm:w-[28%]" />
  </colgroup>
);

const VALUE_TABLE_COLGROUP = (
  <colgroup>
    <col className="w-[38%] sm:w-[34%]" />
    <col className="w-[22%] sm:w-[22%]" />
    <col className="w-[20%] sm:w-[22%]" />
    <col className="w-[20%] sm:w-[22%]" />
  </colgroup>
);

function SectionTitleRow({
  title,
  isFirst = false,
  colSpan = 3,
}: {
  title: string;
  isFirst?: boolean;
  colSpan?: number;
}) {
  return (
    <tr>
      <th
        colSpan={colSpan}
        scope="colgroup"
        className={`${SECTION_TITLE_ROW_CLASS} ${isFirst ? "pt-2" : "pt-6"}`}
      >
        {title}
      </th>
    </tr>
  );
}

function ColumnHeaderRow({
  labels,
  blankHeader = "sr-only",
  blankHeaderSrOnly = "Row",
}: {
  labels: string[];
  blankHeader?: "sr-only" | "hidden";
  blankHeaderSrOnly?: string;
}) {
  return (
    <tr>
      {labels.map((label, index) => (
        <th
          key={`${label}-${index}`}
          scope="col"
          className={TH_CLASS}
          aria-hidden={!label && blankHeader === "hidden" ? true : undefined}
        >
          {label ? (
            label
          ) : blankHeader === "hidden" ? null : (
            <span className="sr-only">{blankHeaderSrOnly}</span>
          )}
        </th>
      ))}
    </tr>
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
  const rows: { label: string; values: ValueColumn }[] = [
    {
      label: year ? `${year} Appraised Value` : "Appraised Value",
      values: {
        total: record.totalActual,
        building: record.improvementActual,
        land: record.landActual,
      },
    },
    {
      label: year ? `${year} Assessed Value` : "Assessed Value",
      values: {
        total: record.totalAssessed,
        building: null,
        land: null,
      },
    },
    {
      label: year ? `${year} Assessed School Value` : "Assessed School Value",
      values: {
        total: null,
        building: null,
        land: null,
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
    : rows.filter((row) => row.label.includes("Appraised"));
  if (rowsToShow.length === 0) {
    return <p className={MISSING_CELL_CLASS}>{NO_DATA}</p>;
  }

  return (
    <table className={TABLE_CLASS}>
      <caption className="sr-only">Appraised and assessed values by total, building, and land</caption>
      {VALUE_TABLE_COLGROUP}
      <tbody>
        <SectionTitleRow
          title="Appraised and assessed values"
          isFirst
          colSpan={4}
        />
        <ColumnHeaderRow
          labels={["", "Total", "Building", "Land"]}
          blankHeader="hidden"
        />
        {rowsToShow.map((row) => (
          <tr key={row.label}>
            <th scope="row" className={`${TH_CLASS} font-medium`}>
              {parcelRecordCellText(row.label)}
            </th>
            <td className={TD_CLASS}>{formatValueCell(row.values.total)}</td>
            <td className={TD_CLASS}>{formatValueCell(row.values.building)}</td>
            <td className={TD_CLASS}>{formatValueCell(row.values.land)}</td>
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
        rows.push(
          <tr key={`${buildingNum}-attr-${attr.label}`}>
            <td className={TD_CLASS}>{index === 0 ? buildingNum : ""}</td>
            <td className={TD_CLASS}>{attr.label}</td>
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
            <td className={TD_CLASS}>{index === 0 ? buildingNum : ""}</td>
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
            <td className={TD_CLASS} />
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
        labels={["", "Units", "Land Use"]}
        blankHeader="hidden"
      />,
    );
    for (const [index, line] of landLineList.entries()) {
      rows.push(
        <tr key={`land-line-${index}`}>
          <td className={TD_CLASS} />
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
      {DETAIL_TABLE_COLGROUP}
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
