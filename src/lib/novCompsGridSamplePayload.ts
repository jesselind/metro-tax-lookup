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

import demoGridData from "@/data/nov-comps-grid-try-demo-property.json";
import definitionsBundle from "../../tools/nov_comps_grid_definitions.json";
import type { NovCompsGridPayload } from "@/lib/novCompsGridTypes";

const base = demoGridData as NovCompsGridPayload;

export const novCompsGridDemoPayload: NovCompsGridPayload = {
  ...base,
  definitions: (base.definitions ?? {
    columns: {},
    rows: definitionsBundle.rows ?? {},
  }) as NovCompsGridPayload["definitions"],
};
