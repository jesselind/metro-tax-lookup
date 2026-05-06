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

/**
 * URL fragment for a comps grid row label cell (see `NovCompsGridPanel` + Key terms "Back to comps grid").
 */
export function novCompsGridRowFragmentId(rowKey: string): string {
  return `nov-comps-row-${rowKey}`;
}
