# Metro tax lookup (Arapahoe County)

Static Next.js app that helps residents understand Arapahoe property-tax levy breakdowns, including metro district share.

Not affiliated with Arapahoe County. Informational only. Verify with official county sources. Not legal or tax advice.

## Product aim (taxpayer empowerment)

The tool is for **residents and concerned citizens**, not only for reproducing county tables. The chief aim is to **empower taxpayers** with clearer context about **who** levies a tax, **identifiers** that tie to public records, and **where to inquire** when something is unclear. When structure is **obfuscated** (by complexity or by how data is published), the app should **shed light** rather than hide behind empty states — including the reality that **districts may use private administrators or shared mailing addresses**, in plain language and without naming specific firms unless citable. When a data match is uncertain, prefer **calm, actionable guidance** (bill names and IDs, county/treasurer paths, `/sources`) over **alarm-only** UI. When **bill LG ID** and **directory LG ID** differ, we still show **state registry** contact where we have it, with framing: public mail often reflects **administration or management**, not a single tidy join to tax-line IDs. Narrative methodology lives on the in-app **`/sources`** page; this README stays technical for contributors.

## Purpose of this README

This file is for repository visitors and contributors: setup, architecture-at-a-glance, and data pipeline commands.

For user-facing methodology, definitions, and citations, use the in-app `/sources` page.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## App overview

- Main route `/`: address-to-PIN lookup from bundled JSON, then levy stack and metro share.

- **Comps PDF:** The summary row offers **Comps PDF** (county comps grid PDF when AIN is available from the parcel index). County-hosted downloads can be unreliable; the control explains that and may offer an optional direct county link. Toggle **`ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE`** in **`src/lib/safeExternalHref.ts`** to switch that behavior.

- **Demo comps grid:** Only **Try demo property** loads the in-page grid today, from **`src/data/nov-comps-grid-try-demo-property.json`** (fork of sample parser output with fictional parcel id, street #, street name, parcel number, neighborhood, and neighborhood group cells only). In-app per-parcel grid wiring is not shipped yet.

- **Parser output path:** **`supporting-data/_private/nov-grid-out.json`** is a conventional gitignored parser output / sanity-check file; write extracts there to diff or hand off. The app bundle never imports it. **`tools/ensure_nov_grid_for_build.mjs`** copies **`src/data/nov-comps-grid-fallback.json`** to that path only when the file is missing (minimal placeholder for optional local tooling).

- **Tests and dev/build:** **`npm run test:nov-comps-parser`** runs the Python parser unit tests (they do not require `nov-grid-out.json`). **`npm run ci:test:nov-comps-parser`** is the same command for CI pipelines (Python required). **`npm run dev`** runs `predev`, which executes **`ensure_nov_grid_for_build.mjs`**. **`npm run build`** runs `prebuild` (**`ensure_nov_grid_for_build.mjs`** plus levy explainer validation only; no Python) before the Next.js build. Refresh the committed Try-demo JSON when you re-parse the sample PDF; do not edit `nov-grid-out.json` for the demo UI.

- **Row help and Key terms:** Row help merges from **`tools/nov_comps_grid_definitions.json`** when the grid JSON has no definitions block. Some row popovers link to **Key terms** on the home page for longer code context (LUC, improvement type/style, valuation grade).

- Fallback path: users can add levy rows manually without PIN.
- Policy/reference pages: `/sources`, `/privacy`, `/accessibility`.
- All runtime data is static JSON under `public/data/`.

**Security:** The app trusts JSON committed at build time. There are no Subresource Integrity hashes on static data. If you need stronger assurance, verify repository contents and deployment artifacts in your own process (for example signed commits or supply-chain checks on the build environment).

## Data layout

| Path | Role |
| --- | --- |
| `public/data/*.json` | Runtime app data served to the browser |
| `supporting-data/` | Offline inputs/intermediate files for regeneration (mostly gitignored; committed CSV where noted) |
| `tools/*.py` | Offline extractors/index builders |

### Levy detail modal (`levy-explainer-entries.json`)

Plain JSON drives the levy tile detail modal (government level, what it is, citations). Use **`developmental-disability-levy`** as the reference shape for new entries. Examples in the file include Mart line **`2999`** (developmental disability) and **`4026`** (Arapahoe Library District).

Modal pattern, tone, and copy rules: **`docs/levy-explainer-authoring.md`**. Not every row has a JSON explainer; the shell still follows that hierarchy.

**Matcher order:** levy line code (Mart code) → LG ID + label keywords (only when `levyLineCode` is omitted in JSON) → source TAG id → `labelContainsAll`. The dialog passes DOLA `lgId` when the row has a match.

**Coverage queue:** `python3 tools/list_levy_explainer_queue.py` prints unique bundled `(line code, LG ID, authority)` rows.

**Validation:** `npm run validate:levy-explainer` checks JSON shape, link URLs, duplicate match keys, and no em dash (U+2014) in resident-facing strings (also runs automatically before `npm run build`).

**In-app term links in explainer copy:** use `{{term:term-id|link label}}` (for example `{{term:term-special-districts|special district}}`). The levy detail modal turns that into a control that jumps to the matching Key terms / Sources definition.

## Regenerating data (full pipeline)

1. Create Python env and install deps:

   Offline `tools/*.py` scripts expect **Python 3.10+** (for example union types like `str | None` and `collections.abc` typing patterns).

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r tools/requirements.txt
   ```

2. Build Arapahoe parcel levy index:

   ```bash
   npm run build:arapahoe-index
   ```

   The script reads county mart CSVs and, when present, **DOLA LGIS Property Tax Entities** as `supporting-data/property-tax-entities-export.csv` (preferred; committed so forks can rebuild). If that file is missing, it falls back to `property-tax-entities-export.xlsx` locally. **`*.xlsx` is gitignored**; keep spreadsheets out of version control and use CSV for the canonical export.

   Build behavior notes:
   - Within each TAG, repeated authority rows are collapsed to one canonical row per `code + authority`: active (`A`) rows are preferred over inactive (`I`), then newest `effectiveYear`.
   - Name matching normalizes common county abbreviations (for example `VLG` -> `VILLAGE`, `MD` -> `METROPOLITAN DISTRICT`) before fuzzy matching to DOLA legal names.
   - Optional `--dola-certifying-county` (default `Arapahoe`) filters DOLA export rows; JSON snapshot records the value in `dolaCertifyingCounty`.

   Outputs include:
   - `public/data/arapahoe-levy-stacks-by-tag-id.json`
   - `public/data/arapahoe-pin-to-tag.json` (per PIN: `tagId`, values, `ain` from Main Parcel for the county comps grid PDF link)
   - `public/data/arapahoe-situs-to-pins.json`

3. Rebuild the district contact bundle (DOLA LG export, filtered to LGIDs in levy stacks):

   ```bash
   npm run build:district-directory
   ```

   Reads `supporting-data-phase-2/lg-export-all.csv` (or pass `--lg-csv`) and `public/data/arapahoe-levy-stacks-by-tag-id.json`. Writes `public/data/colorado-special-district-directory.json`. Run after `build:arapahoe-index` when levy stacks change, or when you refresh the LG CSV.

   When an LGID appears on a levy stack but is missing from the LG directory CSV, the script adds a minimal name-only row from `supporting-data/property-tax-entities-export.csv` (same committed DOLA export used for levy matching) and records those LGIDs under `_meta.lgIdsFilledFromPropertyTaxEntities`. Optional `--certifying-county` (default `Arapahoe`) must match the export's certifying county column for fallback rows; `_meta.propertyTaxEntitiesCountyFilterApplied` records whether that column was present and `_meta.certifyingCountyForPropertyTaxFallback` is set only when the filter ran. Anything still absent from both sources remains in `_meta.missingLgIdsInExport`.

4. Rebuild metro levy JSON (year-specific script):
   - `tools/extract_metro_levies_2025.py` or `tools/extract_metro_levies_2026.py`
   - Source PDF goes in `supporting-data/Mill Levy Public Information Form.pdf`
   - Copy generated output to `public/data/metro-levies-YYYY.json`

5. Optional legacy district tooling (not used for the app runtime bundle above):
   - `tools/import_colorado_district_layer_csv.py` — writes `supporting-data/colorado-all-special-districts.json` (gitignored) for enrichment experiments, not shipped in `public/data/`
   - `tools/enrich_district_json_county_geoids.py` — reads that JSON and optional Census GDB under `supporting-data/`
   - `tools/export_special_district_directory.py` — Colorado **dlall** GIS extract under `supporting-data/dlall/` (`dlall.dbf`)

6. Optional NOV comps grid extractor (experimental tooling; not used by the Next.js bundle):
   - `tools/parse_arapahoe_nov_comps_grid.py` reads **page 2** of a Notice-of-Valuation-style PDF when it carries the six-column comps grid (subject + five sales). It uses `pdfplumber` geometry + column bands, not line-table extraction.
   - Pair with `tools/nov_comps_grid_definitions.json` for plain-language `layTitle` / `layBody` row help plus optional `official` notes for maintainers (county citations when available).
   - Put real PDF samples under `supporting-data/_private/` (gitignored). Example default path in the script matches that layout.
   - Example (writes JSON for local runs and **parser tests**; gitignored): `source .venv/bin/activate && python3 tools/parse_arapahoe_nov_comps_grid.py --pdf supporting-data/_private/<your-file>.pdf --out supporting-data/_private/nov-grid-out.json`
   - Omit bundled definitions with `--skip-definitions` when you only want extracted cells.
   - Tests: `npm run test:nov-comps-parser` or `npm run ci:test:nov-comps-parser` (not part of `prebuild`; run in CI or locally when changing the parser).
   - Treat JSON output as **sensitive** (parcel or address text); do not commit extracted files.

## Contributor notes

- Keep user-facing prose plain-language and avoid accountant-style "levy lines" phrasing.
- Static term definitions live in `src/content/termDefinitions.tsx`.
- Levy explainer modal content is data-driven from `public/data/levy-explainer-entries.json`.
- Keep README technical; keep narrative methodology and citations on `/sources`.

## License

This repository is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

This means you are free to use, modify, and distribute this code — including for forks targeting other counties or jurisdictions — provided that any modified version you deploy is also released under AGPL-3.0 with its source code publicly available. You may not deploy a modified version as a closed-source or proprietary service.

Commercial use is permitted only if the above conditions are met. If you need a separate licensing arrangement, contact metro.tax.lookup@pm.me.

See `LICENSE` for the full license text.
