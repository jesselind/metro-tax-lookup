/**
 * State (Colorado) and federal data URLs for Sources and offline tools.
 */

/**
 * DOLA LGIS — Property Tax Entities (export to xlsx for `build_arapahoe_parcel_levy_index.py`).
 * Interactive site: accept terms, then export; not machine-scraped by this repo.
 */
export const DOLA_LGIS_PROPERTY_TAX_ENTITIES =
  "https://dola.colorado.gov/dlg_lgis_ui_pu/publicLGTaxEntities.jsf";

/** DOLA statewide special districts map (linked from minimal metro path when LG ID does not match). */
export const COLORADO_SPECIAL_DISTRICTS_MAP_URL =
  "https://gis.dola.colorado.gov/CO_SpecialDistrict/";

/** Colorado Information Marketplace — Map of All Special Districts (tabular export for `import_colorado_district_layer_csv.py`). */
export const COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET =
  "https://data.colorado.gov/Local-Aggregation/Map-of-All-Special-Districts-in-Colorado/dm2a-biqr";

/** TIGER/Line GDB (Colorado, 2025 vintage). Unzip to `tlgdb_2025_a_08_co.gdb` for `enrich_district_json_county_geoids.py`. */
export const CENSUS_TIGER_GDB25_COLORADO_ZIP =
  "https://www2.census.gov/geo/tiger/TGRGDB25/tlgdb_2025_a_08_co.gdb.zip";

