// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnPinningState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  novCompsGridColumnHeaderId,
  novCompsGridRowFragmentId,
  type NovCompsGridCell,
  type NovCompsGridDefinitionEntry,
  type NovCompsGridPayload,
} from "@/lib/novCompsGridTypes";
import { GlossaryFullDefinitionLink } from "@/components/GlossaryFullDefinitionLink";
import {
  DashboardHScrollTable,
  DASHBOARD_HSCROLL_TABLE_FOCUS_RING_CLASS,
  dashboardHScrollTableArrowsHomeEndKeyDown,
} from "@/components/DashboardHScrollTable";
import {
  TERM_LINK_CLASS,
  TOOL_LINK_UNDERLINE_CLASS,
} from "@/lib/toolFlowStyles";

/** Bounded height + both axes scroll = scrollport for sticky thead (see layout checklist).
 * `pb-px` keeps the last row’s bottom border from being clipped by overflow.
 * `overscroll-y-contain` reduces nested scroll chaining that can nudge the page
 * a pixel when the grid’s bottom edge is brought into view. */
const TABLE_SCROLLPORT_EXTRA =
  "max-h-[50vh] overflow-y-auto overscroll-y-contain pb-px sm:max-h-[min(600px,70vh)]";
const TABLE_CLASS =
  "min-w-max border-separate border-spacing-0 text-left text-sm text-slate-900";
const TH_LABEL_COL_SHARED =
  "min-w-[7.5rem] border border-slate-200 px-2 py-2 break-words leading-relaxed sm:px-3 sm:py-2.5";
const TH_LABEL =
  `${TH_LABEL_COL_SHARED} bg-slate-100 text-sm font-medium text-slate-800`;
const TH_SECTION_LABEL =
  `${TH_LABEL_COL_SHARED} bg-slate-200 text-sm font-semibold uppercase tracking-wide text-slate-800`;
const TH_COL =
  "min-w-16 border border-slate-200 bg-slate-100 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-700 sm:px-3 sm:py-2.5 sm:text-sm";
const TD =
  "border border-slate-200 bg-white px-2 py-2 align-top text-left text-slate-800 sm:px-3 sm:py-2.5";
const TD_MONEY =
  "border border-slate-200 bg-white px-2 py-2 align-top text-right tabular-nums text-slate-800 sm:px-3 sm:py-2.5";
const TD_SECTION =
  "border border-slate-200 bg-slate-100 px-2 py-2 align-top text-slate-700 sm:px-3 sm:py-2.5";
const POPOVER_TRIGGER_CLASS =
  `cursor-pointer border-0 bg-transparent p-0 text-left text-inherit ${TOOL_LINK_UNDERLINE_CLASS} outline-none whitespace-normal break-words focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1`;
const POPOVER_CONTENT_CLASS =
  "z-50 max-w-[min(22rem,calc(100vw-2rem))] max-h-[min(18rem,60vh)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg";
const POPOVER_LINK_CLASS = `mt-3 inline-flex items-center text-xs ${TERM_LINK_CLASS}`;
/** Sticky header row: CSS on thead — TanStack only supplies column pin offsets, not vertical stick. */
const STICKY_THEAD_CLASS = "sticky top-0 z-30 bg-slate-100";
const USD_WHOLE_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const INTEGER_GROUP_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const ROW_LABEL_OVERRIDES: Record<string, string> = {
  parcel_id: "Parcel ID",
  street_number: "Street #",
  street_name: "Street name",
  street_type: "Street type",
  apt_number: "Unit",
  living_area: "Living area (sq ft)",
  basement_garden_lvl: "Basement/Garden lvl (sq ft)",
  finish_bsmt_grdn_lvl: "Finish Bsmt/Grdn lvl (sq ft)",
  walkout_basement: "Walkout Basement (sq ft)",
  attached_garage: "Attached Garage (sq ft)",
  detached_garage: "Detached Garage (sq ft)",
  open_porch: "Open Porch (sq ft)",
  deck_terrace: "Deck/Terrace (sq ft)",
};
const PRESERVE_UPPERCASE_ROW_KEYS = new Set([
  "dwelling",
  "valuation_label",
  "adj_mkt",
  "luc",
]);
const AREA_ROW_KEYS = new Set([
  "living_area",
  "basement_garden_lvl",
  "finish_bsmt_grdn_lvl",
  "walkout_basement",
  "attached_garage",
  "detached_garage",
  "open_porch",
  "deck_terrace",
]);
const ROW_LABEL_MIN_WIDTH = 120;
/** Subject (first data) column: sticky with field names; needs room for money text. */
const SUBJECT_COL_MIN_WIDTH = 112;
/** Scrolling sale columns only — keep narrow so more sales fit before h-scroll. */
const DATA_COL_MIN_WIDTH = 64;
const ROW_LABEL_MAX_WIDTH = 180;
const TABLE_LAYOUT_GUTTER_PX = 0;
/** Popover overflow: full glossary term id for matching row keys. */
const NOV_COMPS_GLOSSARY_TERM_BY_ROW: Record<string, string> = {
  luc: "term-nov-comps-luc",
  improvement_type: "term-nov-comps-improvement-type",
  improvement_style: "term-nov-comps-improvement-style",
  valuation_grade: "term-nov-comps-valuation-grade",
};

type CompsRow = {
  rowKey: string;
  rowLabel: string;
  definition?: NovCompsGridDefinitionEntry;
  isSectionRow: boolean;
  isMoneyRow: boolean;
  isAreaRow: boolean;
  isLastThreeRows: boolean;
  cellsByColumn: Record<string, NovCompsGridCell>;
};

const compsRowColumnHelper = createColumnHelper<CompsRow>();

function padCells(cells: NovCompsGridCell[], colCount: number): NovCompsGridCell[] {
  const out = cells.slice(0, colCount);
  while (out.length < colCount) {
    out.push({ raw_text: "", parsed: null, parse_ok: false });
  }
  return out;
}

function rowDefinition(
  definitions: NovCompsGridPayload["definitions"] | undefined,
  jsonKey: string,
): NovCompsGridDefinitionEntry | undefined {
  return definitions?.rows?.[jsonKey];
}

function isSectionHeaderRow(row: {
  pdf_label: string;
  json_key: string;
  logical_type: string;
}) {
  if (row.logical_type === "section_marker") {
    return true;
  }
  const label = row.pdf_label.trim().toUpperCase();
  return label === "DWELLING" || label === "VALUATION";
}

function cellDisplayText(cell: NovCompsGridCell, isSectionRow: boolean) {
  if (isSectionRow && /^\*+$/.test(cell.raw_text.trim())) {
    return "";
  }
  return cell.raw_text;
}

function formatMoneyCell(cell: NovCompsGridCell) {
  if (typeof cell.parsed === "number") {
    return USD_WHOLE_FORMATTER.format(cell.parsed);
  }
  return cell.raw_text;
}

function formatAreaCell(cell: NovCompsGridCell) {
  if (typeof cell.parsed === "number") {
    return INTEGER_GROUP_FORMATTER.format(cell.parsed);
  }
  return cell.raw_text;
}

function defaultRowLabelFromKey(jsonKey: string) {
  if (PRESERVE_UPPERCASE_ROW_KEYS.has(jsonKey)) {
    return jsonKey.replaceAll("_", " ").toUpperCase();
  }
  const withSpaces = jsonKey.replaceAll("_", " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
}

function displayRowLabel(row: {
  pdf_label: string;
  json_key: string;
  logical_type: string;
}) {
  if (PRESERVE_UPPERCASE_ROW_KEYS.has(row.json_key)) {
    return row.pdf_label;
  }
  return ROW_LABEL_OVERRIDES[row.json_key] ?? defaultRowLabelFromKey(row.json_key);
}

function displayRowLabelForCell(label: string) {
  // Add soft wrap opportunities around slash-separated tokens.
  return label.replaceAll("/", " / ");
}

function plainLanguageColumnLabel(colKey: string): string {
  if (colKey === "subject") return "Your property";
  const saleMatch = /^sale_(\d+)$/.exec(colKey);
  if (saleMatch) return `Similar property ${saleMatch[1]}`;
  return colKey.replaceAll("_", " ");
}

function compsFormattedDataCell(compsRow: CompsRow, colKey: string): ReactNode {
  const cell = compsRow.cellsByColumn[colKey] ?? {
    raw_text: "",
    parsed: null,
    parse_ok: false,
  };
  if (compsRow.isSectionRow) {
    return cellDisplayText(cell, true);
  }
  if (compsRow.isMoneyRow) {
    return formatMoneyCell(cell);
  }
  if (compsRow.isAreaRow) {
    return formatAreaCell(cell);
  }
  return cell.raw_text;
}

function CompsRowLabelCell({ compsRow }: { compsRow: CompsRow }) {
  const definition = compsRow.definition;
  const hasLay = Boolean(definition?.layBody?.trim());
  const hasCounty = Boolean(definition?.countyWording?.trim());
  const glossaryTermId = NOV_COMPS_GLOSSARY_TERM_BY_ROW[compsRow.rowKey];
  if (definition?.layTitle && (hasLay || hasCounty) && !compsRow.isSectionRow) {
    return (
      <Popover.Root>
        <Popover.Trigger asChild>
          <button type="button" className={POPOVER_TRIGGER_CLASS}>
            {compsRow.rowLabel}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content sideOffset={6} className={POPOVER_CONTENT_CLASS}>
            <p className="text-sm font-semibold text-slate-900">{definition.layTitle}</p>
            {hasLay ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{definition.layBody}</p>
            ) : null}
            {hasCounty ? (
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">County:</span>{" "}
                &quot;{definition.countyWording}&quot;
              </p>
            ) : null}
            {glossaryTermId ? (
              <p className="mt-2 border-t border-slate-200 pt-2 text-sm leading-snug">
                <Popover.Close asChild>
                  <GlossaryFullDefinitionLink
                    termId={glossaryTermId}
                    className={POPOVER_LINK_CLASS}
                  />
                </Popover.Close>
              </p>
            ) : null}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }
  return <span>{compsRow.rowLabel}</span>;
}

function getPinnedCellStyles<T>(
  column: Column<T>,
  opts: { isHeader: boolean; isTopLeft?: boolean },
) {
  const isPinnedLeft = column.getIsPinned() === "left";
  if (!isPinnedLeft) {
    return undefined;
  }
  const isLastPinnedLeft = column.getIsLastColumn("left");
  const zIndex = opts.isTopLeft ? 40 : opts.isHeader ? 30 : 20;
  return {
    left: `${column.getStart("left")}px`,
    position: "sticky" as const,
    zIndex,
    boxShadow: isLastPinnedLeft ? "2px 0 6px -2px rgba(15, 23, 42, 0.24)" : undefined,
  };
}

export type NovCompsGridPanelProps = {
  /** Valid grid payload; returns null when missing or empty. */
  payload: NovCompsGridPayload | null;
};

type NovCompsGridFilledProps = {
  payload: NovCompsGridPayload;
  columns: NovCompsGridPayload["grid"]["columns"];
  canonicalRowOrder: NovCompsGridPayload["grid"]["canonical_row_order"];
  rows: NovCompsGridPayload["grid"]["rows"];
};

/**
 * County comps worksheet table only (no section heading). Parent
 * {@link ComparablePropertiesSection} owns Comparable properties chrome.
 * Field-name + subject stay sticky left; sale columns scroll horizontally.
 */
function NovCompsGridTable({
  columns,
  rowsForTable,
}: {
  columns: NovCompsGridPayload["grid"]["columns"];
  rowsForTable: CompsRow[];
}) {
  const firstDataColumnId = columns[0]?.key;

  const columnPinning = useMemo<ColumnPinningState>(
    () => ({
      left: firstDataColumnId ? ["rowLabel", firstDataColumnId] : ["rowLabel"],
    }),
    [firstDataColumnId],
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const tableColumns = useMemo(
    () =>
      [
        compsRowColumnHelper.accessor("rowLabel", {
          id: "rowLabel",
          header: () => <span className="sr-only">Field name</span>,
          size: ROW_LABEL_MIN_WIDTH,
          cell: ({ row }) => <CompsRowLabelCell compsRow={row.original} />,
        }),
        ...columns.map((colMeta, index) =>
          compsRowColumnHelper.display({
            id: colMeta.key,
            header: () => (
              <span className="block leading-tight">
                <span className="block text-sm font-semibold normal-case text-slate-800">
                  {plainLanguageColumnLabel(colMeta.key)}
                </span>
                <span className="mt-0.5 block text-xs normal-case text-slate-600">
                  ({colMeta.label})
                </span>
              </span>
            ),
            size: index === 0 ? SUBJECT_COL_MIN_WIDTH : DATA_COL_MIN_WIDTH,
            cell: ({ row }) => compsFormattedDataCell(row.original, colMeta.key),
          }),
        ),
      ] as ColumnDef<CompsRow>[],
    [columns],
  );

  /* TanStack useReactTable is flagged by react-hooks/incompatible-library; pinning + sizing still need this hook. */
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table
  const table = useReactTable({
    data: rowsForTable,
    columns: tableColumns,
    state: { columnPinning, columnSizing },
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const updateColumnSizing = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const availableWidth = Math.max(0, el.clientWidth - TABLE_LAYOUT_GUTTER_PX);
    const subjectKey = columns[0]?.key;
    const saleColumns = subjectKey != null ? columns.slice(1) : columns;
    const stickyDataBase =
      subjectKey != null ? SUBJECT_COL_MIN_WIDTH : 0;
    const saleBaseTotal = saleColumns.length * DATA_COL_MIN_WIDTH;
    const baseTotal =
      ROW_LABEL_MIN_WIDTH + stickyDataBase + saleBaseTotal;
    const extraSpace = Math.max(0, availableWidth - baseTotal);

    // Grow field-name a bit when there is room; never drop below ROW_LABEL_MIN_WIDTH.
    const rowLabelGrowthCap = ROW_LABEL_MAX_WIDTH - ROW_LABEL_MIN_WIDTH;
    const rowLabelExtra = Math.min(
      rowLabelGrowthCap,
      Math.floor(extraSpace * 0.25),
    );
    const rowLabelWidth = ROW_LABEL_MIN_WIDTH + rowLabelExtra;

    // Remaining extra goes to sale columns only (subject stays at its floor).
    const saleExtra = Math.max(0, extraSpace - rowLabelExtra);
    const perSaleExtra =
      saleColumns.length > 0 ? Math.floor(saleExtra / saleColumns.length) : 0;
    let remainder =
      saleColumns.length > 0
        ? saleExtra - perSaleExtra * saleColumns.length
        : 0;

    const next: ColumnSizingState = { rowLabel: rowLabelWidth };
    if (subjectKey != null) {
      next[subjectKey] = SUBJECT_COL_MIN_WIDTH;
    }
    for (const col of saleColumns) {
      const bump = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      next[col.key] = DATA_COL_MIN_WIDTH + perSaleExtra + bump;
    }

    setColumnSizing((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length !== nextKeys.length) return next;
      for (const key of nextKeys) {
        if (prev[key] !== next[key]) return next;
      }
      return prev;
    });
  }, [columns]);

  useLayoutEffect(() => {
    updateColumnSizing();
  }, [rowsForTable, updateColumnSizing]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof window === "undefined") return;
    const run = () => {
      updateColumnSizing();
    };
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(run) : null;
    ro?.observe(el);
    return () => {
      ro?.disconnect();
    };
  }, [updateColumnSizing]);

  return (
    <DashboardHScrollTable
      scrollClassName={`${TABLE_SCROLLPORT_EXTRA} ${DASHBOARD_HSCROLL_TABLE_FOCUS_RING_CLASS}`}
      scrollProps={{
        ref: scrollRef,
        role: "region",
        tabIndex: 0,
        "aria-label":
          "Comparable sales worksheet table. Field names and your property stay fixed on the left. Use arrow keys, Home, or End to scroll other sales horizontally when columns extend past the screen. Page Up and Page Down scroll the table vertically.",
        onKeyDown: dashboardHScrollTableArrowsHomeEndKeyDown,
      }}
    >
        <table className={TABLE_CLASS}>
          <caption className="sr-only">
            Comparable sales and subject fields from the county notice worksheet
          </caption>
          <thead className={STICKY_THEAD_CLASS}>
            {table.getHeaderGroups().map((headerGroup, hgIndex) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const pinnedStyles = getPinnedCellStyles(header.column, {
                    isHeader: true,
                    isTopLeft: header.column.id === "rowLabel" && hgIndex === 0,
                  });
                  const isRowLabel = header.column.id === "rowLabel";
                  const colHeaderId = isRowLabel
                    ? undefined
                    : novCompsGridColumnHeaderId(header.column.id);
                  return (
                    <th
                      key={header.id}
                      id={colHeaderId}
                      scope="col"
                      className={isRowLabel ? TH_LABEL : TH_COL}
                      style={{
                        width: header.getSize(),
                        ...pinnedStyles,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const pinnedStyles = getPinnedCellStyles(cell.column, { isHeader: false });
                  const isRowLabel = cell.column.id === "rowLabel";
                  const rowOriginal = row.original;
                  const baseClass = isRowLabel
                    ? rowOriginal.isSectionRow
                      ? TH_SECTION_LABEL
                      : TH_LABEL
                    : rowOriginal.isSectionRow
                      ? TD_SECTION
                      : rowOriginal.isMoneyRow
                        ? TD_MONEY
                        : TD;
                  const weightClass =
                    rowOriginal.isSectionRow || rowOriginal.isLastThreeRows
                      ? "font-semibold"
                      : "";
                  const labelClass =
                    isRowLabel && rowOriginal.isSectionRow
                      ? "uppercase tracking-wide"
                      : "";
                  const CellTag = isRowLabel ? "th" : "td";
                  const rowHdrId = novCompsGridRowFragmentId(rowOriginal.rowKey);
                  const headersAttr =
                    isRowLabel
                      ? undefined
                      : `${rowHdrId} ${novCompsGridColumnHeaderId(cell.column.id)}`;

                  return (
                    <CellTag
                      key={cell.id}
                      id={isRowLabel ? rowHdrId : undefined}
                      scope={isRowLabel ? "row" : undefined}
                      className={`${baseClass} ${weightClass} ${labelClass}${
                        isRowLabel ? " scroll-mt-24 sm:scroll-mt-28" : ""
                      }`}
                      style={{
                        width: cell.column.getSize(),
                        ...pinnedStyles,
                      }}
                      {...(isRowLabel ? {} : { headers: headersAttr })}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </CellTag>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
    </DashboardHScrollTable>
  );
}

function NovCompsGridFilled(props: NovCompsGridFilledProps) {
  const { payload, columns, canonicalRowOrder: order, rows } = props;
  const colCount = columns.length;

  const rowsForTable = useMemo<CompsRow[]>(
    () =>
      order.map((jsonKey, rowIndex) => {
        const row =
          rows[jsonKey] ?? {
            pdf_label: jsonKey,
            json_key: jsonKey,
            logical_type: "string",
            cells: [],
          };
        const def = rowDefinition(payload?.definitions, jsonKey);
        const cells = padCells(row.cells, colCount);
        const isSectionRow = isSectionHeaderRow(row);
        const isMoneyRow = row.logical_type === "money_usd";
        const isAreaRow = AREA_ROW_KEYS.has(row.json_key);
        const labelText = displayRowLabelForCell(displayRowLabel(row));
        const cellsByColumn: Record<string, NovCompsGridCell> = {};
        for (let ci = 0; ci < columns.length; ci += 1) {
          const colMeta = columns[ci];
          if (colMeta != null) {
            cellsByColumn[colMeta.key] = cells[ci] ?? {
              raw_text: "",
              parsed: null,
              parse_ok: false,
            };
          }
        }
        return {
          rowKey: jsonKey,
          rowLabel: labelText,
          definition: def,
          isSectionRow,
          isMoneyRow,
          isAreaRow,
          isLastThreeRows: rowIndex >= order.length - 3,
          cellsByColumn,
        };
      }),
    [colCount, columns, order, payload?.definitions, rows],
  );

  return (
    <div className="space-y-3">
      <NovCompsGridTable columns={columns} rowsForTable={rowsForTable} />
      <p className="m-0 max-w-prose text-xs leading-snug text-slate-500 sm:hidden">
        Swipe sideways to compare other sales. Field names and your property stay on the left.
      </p>
    </div>
  );
}

/**
 * In-app comps worksheet table. Section title lives on
 * {@link ComparablePropertiesSection}; this panel is table + mobile tip only.
 */
export function NovCompsGridPanel(props: NovCompsGridPanelProps) {
  const { payload } = props;
  const grid = payload?.grid;
  const columns = grid?.columns;
  const order = grid?.canonical_row_order;
  const rows = grid?.rows;

  if (
    !payload ||
    !columns ||
    columns.length === 0 ||
    !order ||
    order.length === 0 ||
    !rows
  ) {
    return null;
  }

  return (
    <NovCompsGridFilled
      payload={payload}
      columns={columns}
      canonicalRowOrder={order}
      rows={rows}
    />
  );
}
