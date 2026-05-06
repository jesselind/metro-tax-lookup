// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Types for NOV page-2 comps grid JSON (`tools/parse_arapahoe_nov_comps_grid.py` output shape).
 */

export type NovCompsGridColumnMeta = {
  index: number;
  key: string;
  label: string;
};

export type NovCompsGridCell = {
  raw_text: string;
  parsed: string | number | null;
  parse_ok: boolean;
  parse_note?: string;
};

export type NovCompsGridRowBlock = {
  pdf_label: string;
  json_key: string;
  logical_type: string;
  cells: NovCompsGridCell[];
};

export type NovCompsGridDefinitionEntry = {
  layTitle: string;
  layBody: string;
  countyWording?: string;
  official?: string[];
};

export type NovCompsGridPayload = {
  source?: {
    pdf_path?: string;
    page_index?: number;
    /** Present on synthetic fixtures (e.g. committed fallback JSON) to clarify provenance. */
    source_note?: string;
  };
  grid: {
    columns: NovCompsGridColumnMeta[];
    canonical_row_order: string[];
    rows: Record<string, NovCompsGridRowBlock>;
    mask_sentinel_hint?: string;
  };
  definitions?: {
    columns: Record<string, NovCompsGridDefinitionEntry>;
    rows: Record<string, NovCompsGridDefinitionEntry>;
  };
  limitations?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNovCompsGridCell(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (typeof value.raw_text !== "string") return false;
  const parsed = value.parsed;
  if (
    parsed !== null &&
    typeof parsed !== "string" &&
    typeof parsed !== "number"
  ) {
    return false;
  }
  if (typeof value.parse_ok !== "boolean") return false;
  if (value.parse_note !== undefined && typeof value.parse_note !== "string") {
    return false;
  }
  return true;
}

function isNovCompsGridColumnMeta(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.index === "number" &&
    typeof value.key === "string" &&
    typeof value.label === "string"
  );
}

function isNovCompsGridRowBlock(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (typeof value.pdf_label !== "string") return false;
  if (typeof value.json_key !== "string") return false;
  if (typeof value.logical_type !== "string") return false;
  if (!Array.isArray(value.cells)) return false;
  return value.cells.every(isNovCompsGridCell);
}

function isNovCompsGridDefinitionEntry(
  value: unknown,
): value is NovCompsGridDefinitionEntry {
  if (!isRecord(value)) return false;
  if (typeof value.layTitle !== "string") return false;
  if (typeof value.layBody !== "string") return false;
  if (value.countyWording !== undefined && typeof value.countyWording !== "string") {
    return false;
  }
  if (value.official !== undefined) {
    if (
      !Array.isArray(value.official) ||
      !value.official.every((item) => typeof item === "string")
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Validates `tools/nov_comps_grid_definitions.json` `rows` (and similar maps) at runtime.
 */
export function parseNovCompsGridDefinitionRows(
  bundleRows: unknown,
): Record<string, NovCompsGridDefinitionEntry> {
  if (bundleRows === undefined || bundleRows === null) {
    return {};
  }
  if (!isRecord(bundleRows)) {
    throw new Error(
      "nov_comps_grid_definitions rows must be a JSON object mapping row keys to definition entries.",
    );
  }
  const out: Record<string, NovCompsGridDefinitionEntry> = {};
  for (const key of Object.keys(bundleRows)) {
    const entry = bundleRows[key];
    if (!isNovCompsGridDefinitionEntry(entry)) {
      throw new Error(
        `nov_comps_grid_definitions.json: invalid or incomplete definition for row key "${key}" (expected layTitle, layBody, optional countyWording and official[]).`,
      );
    }
    out[key] = entry;
  }
  return out;
}

function isNovCompsGridDefinitions(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (!isRecord(value.columns) || !isRecord(value.rows)) return false;
  for (const key of Object.keys(value.columns)) {
    if (!isNovCompsGridDefinitionEntry(value.columns[key])) return false;
  }
  for (const key of Object.keys(value.rows)) {
    if (!isNovCompsGridDefinitionEntry(value.rows[key])) return false;
  }
  return true;
}

function isNovCompsGridSource(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.pdf_path !== undefined && typeof value.pdf_path !== "string") {
    return false;
  }
  if (value.page_index !== undefined && typeof value.page_index !== "number") {
    return false;
  }
  if (value.source_note !== undefined && typeof value.source_note !== "string") {
    return false;
  }
  return true;
}

/**
 * Runtime check for committed NOV comps grid JSON (parser output shape).
 */
export function isNovCompsGridPayload(
  data: unknown,
): data is NovCompsGridPayload {
  if (!isRecord(data)) return false;
  if (data.source !== undefined && !isNovCompsGridSource(data.source)) {
    return false;
  }
  if (
    data.limitations !== undefined &&
    (!Array.isArray(data.limitations) ||
      !data.limitations.every((item) => typeof item === "string"))
  ) {
    return false;
  }
  if (
    data.definitions !== undefined &&
    !isNovCompsGridDefinitions(data.definitions)
  ) {
    return false;
  }
  const grid = data.grid;
  if (!isRecord(grid)) return false;
  if (
    grid.mask_sentinel_hint !== undefined &&
    typeof grid.mask_sentinel_hint !== "string"
  ) {
    return false;
  }
  if (
    !Array.isArray(grid.columns) ||
    !grid.columns.every(isNovCompsGridColumnMeta)
  ) {
    return false;
  }
  if (
    !Array.isArray(grid.canonical_row_order) ||
    !grid.canonical_row_order.every((item) => typeof item === "string")
  ) {
    return false;
  }
  if (!isRecord(grid.rows)) return false;
  for (const key of Object.keys(grid.rows)) {
    if (!isNovCompsGridRowBlock(grid.rows[key])) return false;
  }
  return true;
}

/**
 * Stable `id` / hash fragment for comps grid row headers (`NovCompsGridPanel`) and Key terms
 * "Back to comps grid" links (`/#…`). Bundled parser row keys are ASCII snake_case; we still
 * normalize untrusted input: trim, collapse whitespace to hyphens, drop characters outside
 * `[A-Za-z0-9\-_.:]`, and use `_` when nothing usable remains (never inject raw `rowKey`).
 * The fixed `nov-comps-row-` prefix keeps the full fragment from starting with a digit even if the slug does.
 */
export function novCompsGridRowFragmentId(rowKey: string): string {
  const PREFIX = "nov-comps-row-";
  const trimmed = rowKey.trim();
  const hyphenated = trimmed.replace(/\s+/g, "-");
  const slug = hyphenated.replace(/[^A-Za-z0-9\-_.:]/g, "");
  const safe = slug.length > 0 ? slug : "_";
  return `${PREFIX}${safe}`;
}
