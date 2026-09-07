// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Naming rules for county data modules under this folder.
 *
 * File: `{countyId}.ts` (e.g. `arapahoe.ts`, `el-paso.ts`).
 * Export: `{COUNTY_ID}_COUNTY_CONFIG` with hyphens turned into underscores
 * (`EL_PASO_COUNTY_CONFIG`). Enforced by `packageContract.test.ts`.
 */

/**
 * Export name for a county data module: `arapahoe` → `ARAPAHOE_COUNTY_CONFIG`,
 * `el-paso` → `EL_PASO_COUNTY_CONFIG`.
 */
export function countyConfigExportName(countyId: string): string {
  return `${countyId.trim().toUpperCase().replace(/-/g, "_")}_COUNTY_CONFIG`;
}
