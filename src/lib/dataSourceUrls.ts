// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * State (Colorado) and federal data URLs for Sources and offline tools.
 */

/**
 * DOLA LGIS — Property Tax Entities (export to CSV for ingest mill join;
 * the build script prefers `supporting-data/dola/property-tax-entities-export.csv`).
 *
 * Maintainer export (verified 2026-09-02): accept portal terms, open this page,
 * select **Certifying County** only, click **Search**, then export CSV. Do **not**
 * filter by local government type — that omits tax entities the mill join needs.
 * Statewide export is tracked in git; Arapahoe and Douglas ingest filter rows
 * by certifying county at build time.
 */
export const DOLA_LGIS_PROPERTY_TAX_ENTITIES =
  "https://dola.colorado.gov/dlg_lgis_ui_pu/publicLGTaxEntities.jsf";

/**
 * DOLA Colorado Special District Mapping Project (map UI + Download menu).
 * Offline: optional legacy path: `refs/gis/dlall/dlall.dbf` → `tools/export_special_district_directory.py`.
 * Runtime contact bundle: DOLA LG tabular export → `tools/build_district_directory_from_lg_export.py`.
 */
export const COLORADO_SPECIAL_DISTRICTS_MAP_URL =
  "https://gis.dola.colorado.gov/CO_SpecialDistrict/";

/** Colorado Information Marketplace — Map of All Special Districts (tabular export for `import_colorado_district_layer_csv.py`). */
export const COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET =
  "https://data.colorado.gov/Local-Aggregation/Map-of-All-Special-Districts-in-Colorado/dm2a-biqr";

/** TIGER/Line GDB (Colorado, 2025 vintage). Unzip to `supporting-data/refs/gis/tlgdb_2025_a_08_co.gdb` for `enrich_district_json_county_geoids.py`. */
export const CENSUS_TIGER_GDB25_COLORADO_ZIP =
  "https://www2.census.gov/geo/tiger/TGRGDB25/tlgdb_2025_a_08_co.gdb.zip";

