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
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { focusTermDefinitionById } from "@/lib/focusTermDefinition";
import {
  novCompsGridColumnHeaderId,
  novCompsGridRowFragmentId,
  type NovCompsGridCell,
  type NovCompsGridDefinitionEntry,
  type NovCompsGridPayload,
} from "@/lib/novCompsGridTypes";
import { DASHBOARD_TILE_RADIUS_CLASS } from "@/lib/toolFlowStyles";

const PANEL_SHELL = `${DASHBOARD_TILE_RADIUS_CLASS} border border-slate-200 bg-slate-50/80`;
/** Bounded height + both axes scroll = scrollport for sticky thead (see layout checklist). */
const TABLE_SCROLLPORT =
  "max-w-full max-h-[min(600px,70vh)] overflow-x-auto overflow-y-auto";
/** Fade hint when more horizontal content exists (pointer-events-none). */
const SCROLL_FADE_EDGE =
  "pointer-events-none absolute inset-y-0 z-10 w-9 sm:w-10";
const SCROLL_FADE_RIGHT =
  `${SCROLL_FADE_EDGE} right-0 bg-gradient-to-l from-slate-100 via-slate-100/85 to-transparent`;
const SCROLL_FADE_LEFT =
  `${SCROLL_FADE_EDGE} left-0 bg-gradient-to-r from-slate-100 via-slate-100/85 to-transparent`;
const TABLE_CLASS =
  "min-w-max border-separate border-spacing-0 text-left text-sm text-slate-900";
/** Same width breakpoint as Tailwind `sm` (640px); keep media queries aligned. */
const COMPS_GRID_LAYOUT_SM_PX = 640;
const COMPS_GRID_MOBILE_VIEWPORT_MQ = `(max-width: ${COMPS_GRID_LAYOUT_SM_PX - 1}px)`;
const COMPS_GRID_MIN_SM_MQ = `(min-width: ${COMPS_GRID_LAYOUT_SM_PX}px)`;
const TH_LABEL_COL_SHARED =
  "min-w-[6rem] border border-slate-200 px-2 py-2 break-words leading-relaxed sm:min-w-0 sm:max-w-none sm:px-3 sm:py-2.5 sm:w-auto";
const TH_LABEL =
  `${TH_LABEL_COL_SHARED} bg-slate-100 text-sm font-medium text-slate-800`;
const TH_SECTION_LABEL =
  `${TH_LABEL_COL_SHARED} bg-slate-200 text-sm font-semibold uppercase tracking-wide text-slate-800`;
const TH_COL =
  "w-16 border border-slate-200 bg-slate-100 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-700 sm:w-auto sm:px-3 sm:py-2.5 sm:text-sm";
const TD =
  "border border-slate-200 bg-white px-2 py-2 align-top text-left text-slate-800 sm:px-3 sm:py-2.5";
const TD_MONEY =
  "border border-slate-200 bg-white px-2 py-2 align-top text-right tabular-nums text-slate-800 sm:px-3 sm:py-2.5";
const TD_SECTION =
  "border border-slate-200 bg-slate-100 px-2 py-2 align-top text-slate-700 sm:px-3 sm:py-2.5";
const POPOVER_TRIGGER_CLASS =
  "cursor-pointer border-0 bg-transparent p-0 text-left text-inherit font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 outline-none whitespace-normal break-words hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1";
/** Section title: same trigger treatment as row-definition labels, with dashboard heading scale. */
const COMPS_GRID_HEADING_TRIGGER_CLASS =
  `${POPOVER_TRIGGER_CLASS} text-xl font-bold leading-tight tracking-tight sm:text-2xl`;
const POPOVER_CONTENT_CLASS =
  "z-50 max-w-[min(22rem,calc(100vw-2rem))] max-h-[min(18rem,60vh)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg";
const POPOVER_LINK_CLASS =
  "mt-3 inline-flex cursor-pointer items-center text-xs font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2";
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
/** Matches Tailwind `sm` (640px): phones in portrait use a tighter row-label column. */
const ROW_LABEL_MIN_WIDTH_MOBILE = 96;
const DATA_COL_MIN_WIDTH = 64;
const ROW_LABEL_MAX_WIDTH = 180;
const TABLE_LAYOUT_GUTTER_PX = 16;
/** Popover overflow: link to matching Key terms card on the same page. */
const NOV_COMPS_KEY_TERM_BY_ROW: Record<string, { href: string; label: string }> = {
  luc: {
    href: "#term-nov-comps-luc",
    label: "Land use codes — examples and sources in Key terms",
  },
  improvement_type: {
    href: "#term-nov-comps-improvement-type",
    label: "Improvement types — fuller note in Key terms",
  },
  improvement_style: {
    href: "#term-nov-comps-improvement-style",
    label: "Improvement styles — fuller note in Key terms",
  },
  valuation_grade: {
    href: "#term-nov-comps-valuation-grade",
    label: "Valuation grade — fuller note in Key terms",
  },
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

function subscribeMinSm(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(COMPS_GRID_MIN_SM_MQ);
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }
  mq.addListener(onChange);
  return () => mq.removeListener(onChange);
}

function getMinSmSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(COMPS_GRID_MIN_SM_MQ).matches;
}

/**
 * `false` on the server matches mobile markup first; after hydration, snapshot updates for desktop.
 */
function getMinSmServerSnapshot() {
  return false;
}

function useMinWidthSm(): boolean {
  return useSyncExternalStore(subscribeMinSm, getMinSmSnapshot, getMinSmServerSnapshot);
}

/** Safe segment for mobile `dt` ids; keeps ids HTML-friendly and stable vs parser column keys. */
function sanitizeColumnKeyForMobileDtIds(columnKey: string): string {
  const lower = columnKey.toLowerCase();
  const dashed = lower.replace(/[^a-z0-9_-]/g, "-");
  const collapsed = dashed.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  if (collapsed.length === 0) {
    return "c";
  }
  if (/^\d/.test(collapsed)) {
    return `c-${collapsed}`;
  }
  return collapsed;
}

function mobileFieldColumnDtId(rowKey: string, columnKey: string) {
  const sanitizedKey = sanitizeColumnKeyForMobileDtIds(columnKey);
  return `${novCompsGridRowFragmentId(rowKey)}-f-${sanitizedKey}`;
}

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
  const compsKeyTerm = NOV_COMPS_KEY_TERM_BY_ROW[compsRow.rowKey];
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
            {compsKeyTerm ? (
              <Popover.Close asChild>
                <button
                  type="button"
                  className={`${POPOVER_LINK_CLASS} text-left`}
                  onClick={() => {
                    const id = compsKeyTerm.href.replace(/^#/, "");
                    window.setTimeout(() => {
                      window.history.replaceState(null, "", `/#${id}`);
                      focusTermDefinitionById(id);
                    }, 0);
                  }}
                >
                  {compsKeyTerm.label}
                </button>
              </Popover.Close>
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
  /** When null or missing grid, show a compact empty state. */
  payload: NovCompsGridPayload | null;
};

function CompsGridSectionHeading() {
  return (
    <h2 id="home-nov-comps-grid-heading" className="mt-6 sm:mt-8">
      <Popover.Root>
        <Popover.Trigger asChild>
          <button type="button" className={COMPS_GRID_HEADING_TRIGGER_CLASS}>
            Comps grid
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="start"
            sideOffset={6}
            className={POPOVER_CONTENT_CLASS}
          >
            <p className="text-sm leading-relaxed text-slate-700">
              This matches the comparable-sales worksheet on your county notice or in the linked
              comps PDF.
            </p>
            <p className="mb-0 mt-2 text-sm leading-relaxed text-slate-700">
              Underlined field names open short explanations.
            </p>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </h2>
  );
}

function NovCompsGridEmptySection() {
  return (
    <section
      className="scroll-mt-6 space-y-3"
      aria-labelledby="home-nov-comps-grid-heading"
    >
      <CompsGridSectionHeading />
      <div
        className={`${PANEL_SHELL} px-4 py-5 text-sm text-slate-700 sm:px-5 sm:text-base`}
        role="status"
      >
        No comps grid is available for this property yet. When your notice data is connected, the
        county comparable worksheet will appear here.
      </div>
    </section>
  );
}

type NovCompsGridFilledProps = {
  payload: NovCompsGridPayload;
  columns: NovCompsGridPayload["grid"]["columns"];
  canonicalRowOrder: NovCompsGridPayload["grid"]["canonical_row_order"];
  rows: NovCompsGridPayload["grid"]["rows"];
};

function NovCompsGridMobileCards({
  rowsForTable,
  columns,
}: {
  rowsForTable: CompsRow[];
  columns: NovCompsGridPayload["grid"]["columns"];
}) {
  return (
    <ul
      className="m-0 max-h-[min(600px,70vh)] list-none space-y-3 overflow-y-auto p-0 pr-0.5"
      aria-label="Comparable sales worksheet, one field per card, with your property and each sale."
    >
      {rowsForTable.map((compsRow) => {
        const rowHeaderId = novCompsGridRowFragmentId(compsRow.rowKey);
        if (compsRow.isSectionRow) {
          return (
            <li key={compsRow.rowKey} className="scroll-mt-24">
              <h3
                id={rowHeaderId}
                className="rounded-lg border border-slate-200 bg-slate-200 px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-slate-800"
              >
                {compsRow.rowLabel}
              </h3>
            </li>
          );
        }
        return (
          <li key={compsRow.rowKey} className="scroll-mt-24">
            <article
              className={`overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm ${compsRow.isLastThreeRows ? "font-semibold text-slate-900" : ""}`}
              aria-labelledby={rowHeaderId}
            >
              <header className="border-b border-slate-200 bg-slate-100 px-3 py-3">
                <h3
                  id={rowHeaderId}
                  className="text-base font-semibold leading-snug text-slate-900"
                >
                  <CompsRowLabelCell compsRow={compsRow} />
                </h3>
              </header>
              <dl className="m-0 px-3">
                {columns.map((col, colIndex) => {
                  const dtId = mobileFieldColumnDtId(compsRow.rowKey, col.key);
                  return (
                    <div
                      key={col.key}
                      className={`py-3 text-left ${colIndex > 0 ? "border-t border-slate-200" : ""}`}
                    >
                      <dt id={dtId} className="text-sm font-semibold text-slate-600">
                        <span className="text-slate-800">{plainLanguageColumnLabel(col.key)}</span>
                        <span className="ml-1 font-normal normal-case text-slate-500">
                          ({col.label})
                        </span>
                      </dt>
                      <dd
                        className={`mt-1 text-left text-sm leading-relaxed text-slate-900 ${compsRow.isMoneyRow ? "tabular-nums" : ""}`}
                        aria-labelledby={`${rowHeaderId} ${dtId}`}
                      >
                        {compsFormattedDataCell(compsRow, col.key)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

function NovCompsGridDesktopTable({
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
        ...columns.map((colMeta) =>
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
            size: DATA_COL_MIN_WIDTH,
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
  const [scrollFadeLeft, setScrollFadeLeft] = useState(false);
  const [scrollFadeRight, setScrollFadeRight] = useState(false);

  const updateColumnSizing = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isMobileViewport =
      typeof window !== "undefined" &&
      window.matchMedia(COMPS_GRID_MOBILE_VIEWPORT_MQ).matches;
    const rowLabelMin = isMobileViewport ? ROW_LABEL_MIN_WIDTH_MOBILE : ROW_LABEL_MIN_WIDTH;
    const availableWidth = Math.max(0, el.clientWidth - TABLE_LAYOUT_GUTTER_PX);
    const dataBaseTotal = columns.length * DATA_COL_MIN_WIDTH;
    const baseTotal = rowLabelMin + dataBaseTotal;
    const extraSpace = Math.max(0, availableWidth - baseTotal);

    const rowLabelGrowthCap = ROW_LABEL_MAX_WIDTH - rowLabelMin;
    const rowLabelExtra = Math.min(rowLabelGrowthCap, Math.floor(extraSpace * 0.25));
    const rowLabelWidth = rowLabelMin + rowLabelExtra;

    const dataExtra = Math.max(0, extraSpace - rowLabelExtra);
    const perDataExtra = columns.length > 0 ? Math.floor(dataExtra / columns.length) : 0;
    let remainder = columns.length > 0 ? dataExtra - perDataExtra * columns.length : 0;

    const next: ColumnSizingState = { rowLabel: rowLabelWidth };
    for (const col of columns) {
      const bump = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      next[col.key] = DATA_COL_MIN_WIDTH + perDataExtra + bump;
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

  const updateHorizontalScrollFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const epsilon = 2;
    const canScrollX = scrollWidth > clientWidth + epsilon;
    setScrollFadeLeft(canScrollX && scrollLeft > epsilon);
    setScrollFadeRight(canScrollX && scrollLeft + clientWidth < scrollWidth - epsilon);
  }, []);

  const handleScrollRegionKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const el = scrollRef.current;
      if (!el) return;
      const step = Math.round(el.clientWidth * 0.5) || 48;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        el.scrollBy({ left: -step, behavior: "smooth" });
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        el.scrollBy({ left: step, behavior: "smooth" });
      } else if (event.key === "Home") {
        event.preventDefault();
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else if (event.key === "End") {
        event.preventDefault();
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      } else if (event.key === "PageUp") {
        event.preventDefault();
        el.scrollBy({ left: -el.clientWidth, behavior: "smooth" });
      } else if (event.key === "PageDown") {
        event.preventDefault();
        el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
      }
    },
    [],
  );

  useLayoutEffect(() => {
    updateColumnSizing();
    updateHorizontalScrollFades();
  }, [rowsForTable, updateColumnSizing, updateHorizontalScrollFades]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof window === "undefined") return;
    const run = () => {
      updateColumnSizing();
      updateHorizontalScrollFades();
    };
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(run) : null;
    ro?.observe(el);
    const mq = window.matchMedia(COMPS_GRID_MOBILE_VIEWPORT_MQ);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", run);
      return () => {
        ro?.disconnect();
        mq.removeEventListener("change", run);
      };
    }
    mq.addListener(run);
    return () => {
      ro?.disconnect();
      mq.removeListener(run);
    };
  }, [updateColumnSizing, updateHorizontalScrollFades]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        role="region"
        tabIndex={0}
        aria-label="Comparable sales worksheet table. Use arrow keys, Page Up, Page Down, Home, or End to scroll horizontally when columns extend past the screen."
        className={`${TABLE_SCROLLPORT} outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2`}
        onScroll={updateHorizontalScrollFades}
        onKeyDown={handleScrollRegionKeyDown}
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
      </div>
      {scrollFadeLeft ? (
        <div aria-hidden className={SCROLL_FADE_LEFT} />
      ) : null}
      {scrollFadeRight ? (
        <div aria-hidden className={SCROLL_FADE_RIGHT} />
      ) : null}
    </div>
  );
}

function NovCompsGridFilled(props: NovCompsGridFilledProps) {
  const { payload, columns, canonicalRowOrder: order, rows } = props;
  const colCount = columns.length;
  const isDesktop = useMinWidthSm();

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
    <section
      className="scroll-mt-6 space-y-3"
      aria-labelledby="home-nov-comps-grid-heading"
    >
      <CompsGridSectionHeading />
      <div className={`${PANEL_SHELL} p-2 sm:p-3`}>
        {isDesktop ? (
          <NovCompsGridDesktopTable columns={columns} rowsForTable={rowsForTable} />
        ) : (
          <NovCompsGridMobileCards rowsForTable={rowsForTable} columns={columns} />
        )}
      </div>
      <p className="m-0 max-w-prose text-xs leading-snug text-slate-500 sm:hidden">
        Tip: For the full worksheet table with every column side by side, try landscape or a
        larger screen.
      </p>
    </section>
  );
}

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
    return <NovCompsGridEmptySection />;
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
