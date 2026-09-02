# County build inputs (download lists)

Maintainer and forker reference: **where to obtain** local rebuild inputs and **where to put them**. Resident-facing hubs and methodology stay on **`/sources`**. Rebuild commands: root **[README.md](../README.md)** and **[county-ingest.md](county-ingest.md)**.

## Ownership of these URLs

County and state portals host these files. **This project does not control them.** Direct download links can move, 404, or change filenames (especially dated zips). We list the hubs and the URLs that last worked for a rebuild or inventory, and we try to keep this doc current when we refresh a drop. Prefer the **hub** page when a direct link fails. Last-verified dates are when a maintainer confirmed the link or drop, not a promise the file is still there tomorrow.

**Policy:** Large dumps stay under gitignored `supporting-data/`. Commit transforms under `public/data/`, plus the small tracked exceptions named in the README (today: DOLA property-tax entities CSV, mart stamp, curated mill-join overrides). Forkers who only run the shipped app do **not** need these downloads.

**Above-board sources only:** Prefer county/state published downloads and explicit data requests. Do **not** build rebuild pipelines on screen scraping or on mass use of property-search APIs that require spoofing browser/CSRF headers to bypass “direct access not permitted” gates.

## How this doc is organized

| Section | What belongs here |
| --- | --- |
| **Colorado (shared)** | State-hosted files kept once under `supporting-data/dola/` (and similar). Not county property. Each row names **which counties use it today**. That list grows only when another county’s rebuild actually consumes the file. |
| **Per county** | County-published dumps (mart, GIS, certs, assessor text downloads, mill PDFs, …). If that county also needs a shared state file, point at Colorado (shared); do not re-list the download. |

Do **not** assume every Colorado county needs every shared file. Reuse is likely for mill/TE join and the statewide directory, but only mark a county after inventory or ingest proves it.

**Future product (not Phase 9):** A resident-facing **data transparency score / rating** per county (how openly the county publishes the files this app needs). People could pick a county and see how it stacks up. Capture evidence during each county inventory; do not build the rating UI in Phase 9.

## Template (use for every county)

Copy this block when adding a county. Fill every required row. Use the same field names so lists stay comparable.

```markdown
### <County display name> (`<county-id>`)

**Local root:** `supporting-data/<county-id>/` (or Arapahoe legacy paths below until renamed).

**Last verified:** YYYY-MM-DD

**Also uses (Colorado shared):** list shared rows by name, or **none** yet.

| Save as (local path) | Required? | Hub URL | Direct URL (optional) | Feeds | Notes |
| --- | --- | --- | --- | --- | --- |
| `supporting-data/...` | yes / no | https://… | https://… or — | levy stacks / account map / GIS join / … | Dated zip? rename? |
```

**Fields:**

| Field | Meaning |
| --- | --- |
| Save as | Exact path relative to repo root after download (and unzip if needed). |
| Required? | Rebuild or inventory blocker (`yes`) vs optional context (`no`). |
| Hub URL | Stable portal page. Prefer this when the direct link dies. |
| Direct URL | Last-known file URL. May be dated. Mark if the county renames releases. |
| Feeds | Which app JSON or build step this input supports. |
| Notes | Unzip instructions, stamp files, layout quirks. |
| Currently used by | **Colorado shared rows only.** County ids that consume this file in a shipping or documented rebuild path. |

When a county passes inventory and gets a mapping file, keep this list in sync with `tools/ingest/mappings/<county-id>.json` `defaultPaths` (CLI defaults) and with any `/sources` hub links.

---

## Colorado (shared)

**Local root:** `supporting-data/dola/`

**Last verified:** 2026-09-02

These are statewide DOLA exports. One copy on disk for the whole repo. Update **Currently used by** when a second county’s rebuild starts reading the same path.

| Save as (local path) | Required? | Hub URL | Direct URL (optional) | Feeds | Currently used by | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `supporting-data/dola/property-tax-entities-export.csv` | yes for mill join on shipping levy stacks | [DOLA LGIS Property Tax Entities](https://dola.colorado.gov/dlg_lgis_ui_pu/publicLGTaxEntities.jsf) | — | mill join on levy stack lines (`dolaMatch`); optional directory fallback rows | **`arapahoe`**, **`douglas`** | **Tracked** in git (~390 KiB, refreshed 2026-09-02). **Export ritual:** accept terms → select **Certifying County** only → **Search** → export CSV. Do **not** filter by local government type. Statewide export; ingest filters by certifying county per mapping (`--dola-certifying-county`). Run `npm run test:ingest` before replacing the tracked file (Arapahoe mill anchor safeguards). |
| `supporting-data/dola/lg-export-all.csv` | no (directory rebuild) | [DOLA LGIS portal](https://dola.colorado.gov/dlg_lgis_ui_pu/) | — | `build:district-directory` (contacts filtered to LGIDs present in levy stacks) | **`arapahoe`** only today (directory rebuild keyed off Arapahoe stacks) | Local only; **different export** from Property Tax Entities (mailing address / website / LGID). Not the mill / Tax Entity ID source. |

---

## Arapahoe (`arapahoe`)

**Local root (legacy layout):** inputs are split across `supporting-data/county-mart/`, `county-gis/`, and `certs/` (not under `supporting-data/arapahoe/`). Arapahoe was the prototype county; leave these paths unless doing a dedicated rename. New counties use `supporting-data/<county-id>/` (see README supporting-data table).

**Last verified:** 2026-08-25 (paths and hubs as used for engine v2 ship / 5.0.0). Direct Data Mart file URLs are portal exports; use the hub and download the named tables.

**Also uses (Colorado shared):** `property-tax-entities-export.csv` (required for mill join); `lg-export-all.csv` (optional, district directory rebuild).

| Save as (local path) | Required? | Hub URL | Direct URL (optional) | Feeds | Notes |
| --- | --- | --- | --- | --- | --- |
| `supporting-data/county-mart/` (Main Parcel Table CSV + Tax Authority Groups CSV, plus sibling mart folders used by parcel-record joins) | yes | [Assessor Data Mart export](https://gis.arapahoegov.com/assessordataexport/) | — (portal zip/folder export; names match county folders) | levy stacks, account map, situs, parcel-record shards | Stage new drops in `county-mart-diff/` then replace. Stamp download date in tracked `tools/county-mart-data-as-of.txt`. |
| `supporting-data/county-gis/Assessor_Parcels_SP.gdb` (+ sibling `data-as-of.txt`) | yes (unless `--skip-neighborhood`) | [Open GIS Data download](https://gis.arapahoegov.com/datadownload/) | — | neighborhood on parcel-record shards | Parcels layer FileGDB. |
| `supporting-data/certs/Mill Levy Public Information Form.pdf` | no (metro extract) | [Mill Levies and Tax Districts](https://www.arapahoeco.gov/your_county/county_departments/assessor/mill_levies_and_tax_districts.php#outer-96) | [Mill Levy Public Information Form PDF](https://files.arapahoeco.gov/Assessor/Certification%20of%20Levies%20and%20Revenues/Mill%20Levy%20Public%20Information%20Form.pdf) | `metro-levies-YYYY.json` extract | Not the Certification of Levies layout. |
| `supporting-data/certs/` Tax Year levy % / certification PDFs | no (authority mills YoY) | same Mill Levies hub | year-specific PDFs on the hub / files.arapahoeco.gov | `arapahoe-authority-mills-by-tax-year.json` | See extract script defaults. |

CLI path defaults for mart siblings and the GIS GDB: `tools/ingest/mappings/arapahoe.json` → `defaultPaths`.

---

## Douglas (`douglas`) — county 2 (Phase 8 Go, 2026-08-25)

**Local root:** `supporting-data/douglas/`

**Last verified:** 2026-08-28 (Phase 8 **Go**; local inventory notes in gitignored `supporting-data/douglas/INVENTORY.md`). **No live ingestion through an API** — Assessor published text downloads + tax-district mill PDF only. Phase 9/9b/9c: mapping + headerless text + mill-PDF stacks + situs + parcel-record shards; shipping JSON under `public/data/douglas-*` (see `docs/county-ingest.md`).

**Also uses (Colorado shared):** `property-tax-entities-export.csv` (mill join; certifying county Douglas).

**Hubs:**

- Assessor data downloads: https://www.douglasco.gov/assessor/data-downloads/
- Taxing authorities / mill PDFs: https://www.douglasco.gov/assessor/taxing-authorities/
- Direct file host (same files the hub links): `https://apps.douglasco.gov/realware/datadownloads/`

| Save as (local path) | Required? | Hub URL | Direct URL (optional) | Feeds | Notes |
| --- | --- | --- | --- | --- | --- |
| `supporting-data/douglas/Property_Location.txt` | yes | [Data Downloads](https://www.douglasco.gov/assessor/data-downloads/) | https://apps.douglasco.gov/realware/datadownloads/Property_Location.txt | account map (account id, situs parts, **`Tax_District_No`**) | Quoted CSV, **no header row** (column order on the hub page). Active accounts. ~33 MB on 2026-08-25 drop. Stamp download date in tracked `tools/douglas-data-as-of.txt`. |
| `supporting-data/douglas/Property_Values.txt` | yes | same | https://apps.douglasco.gov/realware/datadownloads/Property_Values.txt | account map (actual / assessed values) | Plural **Values**. Headerless. Multiple valuation rows per account possible. |
| `supporting-data/douglas/2025-tax-districts-and-mill-levies.pdf` | yes | [Taxing Authorities](https://www.douglasco.gov/assessor/taxing-authorities/) | https://www.douglasco.gov/documents/2025-tax-districts-and-mill-levies.pdf | levy stacks (tax district → authorities + mills) | Tax-district grain (district header, then authority rows). Prefer current tax year on the hub if renamed. |
| `supporting-data/douglas/Property_Ownership.txt` | no | Data Downloads | https://apps.douglasco.gov/realware/datadownloads/Property_Ownership.txt | optional parcel-record / owner fields | Headerless. |
| `supporting-data/douglas/Property_Improvements.txt` | no | Data Downloads | https://apps.douglasco.gov/realware/datadownloads/Property_Improvements.txt | optional building characteristics | Headerless. |
| `supporting-data/douglas/Property_Sales.txt` | no | Data Downloads | https://apps.douglasco.gov/realware/datadownloads/Property_Sales.txt | optional sale history | Headerless. |
| `supporting-data/douglas/Property_Subdivision.txt` | no | Data Downloads | https://apps.douglasco.gov/realware/datadownloads/Property_Subdivision.txt | optional subdivision | Headerless. |
| `supporting-data/douglas/Property_Filing.txt` | no (9c) | Data Downloads | https://apps.douglasco.gov/realware/datadownloads/Property_Filing.txt | parcel-record filing description/number | Headerless. Joined by subdivision recording number. |
| DougCo Hub parcels GIS export (CSV) | no (9c) | Assessor maps / open data | export filename varies (`Parcels_A_view_*.csv` in mapping `defaultPaths`) | parcel-record block/tract/filing when columns present | Has `TAX_DISTRICT_NO`; not authority stacks. Update mapping path when re-exporting. |

**API:** none for rebuild. Do not use property-search scraping.

**Join (Phase 8 inventory):** `Property_Location.Tax_District_No` ↔ PDF `Tax District: NNNN` — same **4-digit zero-pad**. ~99% of location accounts matched the 2025 mill PDF; remaining tax-district keys absent from the PDF are an honest gap (dashboard + `/sources`).

---

## El Paso (`el-paso`) — parked (not county 2)

**Status:** Phase 8 attempt on published dumps **failed** the required-file bar (2026-08-25). Local `supporting-data/el-paso/` **removed** (2026-08-25). Not the active second-county target.

**Also uses (Colorado shared):** none.

| Save as (local path) | Required? | Hub URL | Direct URL (optional) | Feeds | Notes |
| --- | --- | --- | --- | --- | --- |
| *(re-fetch only if revisiting)* Assessor parcel layout + parcel zip/table | — | [Assessor data hub](https://assessor.elpasoco.com/assessordata/) | dated parcel zip on hub | account id + values; **no tax-area column** in 20260811 extract | Insufficient alone for app JSON. |
| Treasurer mill Excel | — | [Treasurer mill levies](https://treasurer.elpasoco.com/mill-levies/) | dated xlsx on epc-assets | entity mills by year | Not tax-area stacks. |
| FinalCert DLG-57 PDF | — | Assessor data hub | — | per-entity certification | Not stacks. |

**Inventory outcome (2026-08-25):** No published tax-area → authority stack. Spatialest property `recordcard` can show per-authority mills + `txd`, but mass API harvest that spoofs browser/CSRF gates is **out of policy**. Revisit only via official bulk export or a county data request — not as Phase 8 now.
