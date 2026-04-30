// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * State (Colorado) and federal data URLs for Sources and offline tools.
 */

/**
 * DOLA LGIS — Property Tax Entities (export to CSV or xlsx for `build_arapahoe_parcel_levy_index.py`;
 * the build script prefers `supporting-data/property-tax-entities-export.csv`).
 * Interactive site: accept terms, then export; not machine-scraped by this repo.
 */
export const DOLA_LGIS_PROPERTY_TAX_ENTITIES =
  "https://dola.colorado.gov/dlg_lgis_ui_pu/publicLGTaxEntities.jsf";

/**
 * DOLA Colorado Special District Mapping Project (map UI + Download menu).
 * Offline: optional legacy path: `dlall.dbf` → `tools/export_special_district_directory.py`.
 * Runtime contact bundle: DOLA LG tabular export → `tools/build_district_directory_from_lg_export.py`.
 */
export const COLORADO_SPECIAL_DISTRICTS_MAP_URL =
  "https://gis.dola.colorado.gov/CO_SpecialDistrict/";

/** Colorado Information Marketplace — Map of All Special Districts (tabular export for `import_colorado_district_layer_csv.py`). */
export const COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET =
  "https://data.colorado.gov/Local-Aggregation/Map-of-All-Special-Districts-in-Colorado/dm2a-biqr";

/** TIGER/Line GDB (Colorado, 2025 vintage). Unzip to `tlgdb_2025_a_08_co.gdb` for `enrich_district_json_county_geoids.py`. */
export const CENSUS_TIGER_GDB25_COLORADO_ZIP =
  "https://www2.census.gov/geo/tiger/TGRGDB25/tlgdb_2025_a_08_co.gdb.zip";

