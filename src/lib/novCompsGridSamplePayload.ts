// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Try demo property only: imports committed `nov-comps-grid-try-demo-property.json`.
 *
 * That file is a fork of parser output for the sample NOV PDF: do **not** edit
 * `supporting-data/_private/nov-grid-out.json` for the UI (that path is mainly a parser / test
 * fixture; the app does not import it). When you re-parse the sample PDF, copy fresh output into
 * the committed JSON and redact parcel id, street #, street name, parcel number, neighborhood, and
 * neighborhood group cells only.
 */

import demoGridData from "../data/nov-comps-grid-try-demo-property.json";
import definitionsBundle from "../../tools/nov_comps_grid_definitions.json";
import {
  isNovCompsGridPayload,
  parseNovCompsGridDefinitionRows,
  type NovCompsGridPayload,
} from "@/lib/novCompsGridTypes";

if (!isNovCompsGridPayload(demoGridData)) {
  throw new Error(
    "nov-comps-grid-try-demo-property.json failed validation: expected NovCompsGridPayload (grid.columns, grid.canonical_row_order, grid.rows with cells, and optional source/definitions/limitations matching the parser output shape).",
  );
}

const base: NovCompsGridPayload = demoGridData;

function buildNovCompsGridDefinitions(
  fromPayload: NovCompsGridPayload["definitions"] | undefined,
  bundleRows: unknown,
): NovCompsGridPayload["definitions"] {
  if (fromPayload !== undefined) {
    return fromPayload;
  }
  return {
    columns: {},
    rows: parseNovCompsGridDefinitionRows(bundleRows),
  };
}

export const novCompsGridDemoPayload: NovCompsGridPayload = {
  ...base,
  definitions: buildNovCompsGridDefinitions(
    base.definitions,
    definitionsBundle.rows,
  ),
};
