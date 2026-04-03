# Metro tax lookup (Arapahoe County)

A small **Next.js** site with **two** property tax tools for Arapahoe County residents, plus policy pages (sources, privacy, accessibility). The home page is a hub; each tool has its own route and walkthrough.

Not affiliated with Arapahoe County. Informational only. Verify with official county sources. Not legal or tax advice.

MIT-licensed; please attribute and verify with county source documents.

**Audience:** This file is for **developers and contributors** (Git clone, tooling, regenerating JSON). The deployed app’s **Sources** page at `/sources` is written for a general audience — residents, tax-minded reviewers, and anyone auditing numbers without using GitHub or the command line.

## The tools

| Tool | Route | What it does |
| --- | --- | --- |
| **Metro district tax share** | `/metro-tax-lookup` | From two numbers (total mills and metro debt service mills), shows what share of your property tax *rate* pays metro district debt and shows the math. |
| **Property tax levy breakdown** | `/levy-breakdown` | Helps you find your parcel and PIN, then loads district-by-district levy lines (TAG) so you can see your full rate split across authorities. |

Both tools use the same static JSON under `public/data/` where noted below (metro levy rates, optional Arapahoe PIN/TAG index, Colorado district metadata).

## Use (for residents)

Start at `/` and pick a tool, or open `/metro-tax-lookup` or `/levy-breakdown` directly.

### Metro district tax share

1. Use the Arapahoe County property search to find your parcel (the tool links you there).
2. Find the **total mills** and your **metro district debt service mills** (if any) on the county site or your tax bill.
3. Enter those numbers to see the percentage and the formula.

### Property tax levy breakdown

1. Follow the in-app steps to open the county parcel record and **Tax District Levies** view.
2. Enter your **PIN** when prompted so the tool can match your tax area (TAG) and list levy lines, or enter lines manually if you prefer.

Details and citations for both tools are on the in-app Sources page (`/sources`).

## Sources, privacy, accessibility

- **Sources**: In-app at `/sources` — methodology, official links, and human-friendly verification (not GitHub-oriented). Use this README’s **Development** section for pipeline commands and file paths.
- **Privacy**: No analytics, no cookies, and no saving inputs in your browser (local/session storage). See `/privacy`.
- **Accessibility**: We aim for WCAG 2.1 AA. To report an accessibility issue, email `metro.tax.lookup@pm.me`. See `/accessibility`.

## Development

Install deps and run the dev server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` (tool hub) or go straight to `/metro-tax-lookup` or `/levy-breakdown`.

### Data files

**What ships in the browser:** everything the app loads lives under `public/data/` as static JSON (and is imported or fetched at runtime). Files there do not affect dev-server performance beyond normal asset size; only what you put in `public/` or import into the bundle affects what users download.

**What `supporting-data/` is for:** offline inputs and intermediate files for Python tools (county CSV exports, PDFs, optional state CSVs). It is not read by Next.js at build time unless you add scripts that copy into `public/`. Keep large downloads out of git (see `.gitignore`) and document where you got them; commit small, stable files such as `Tax Authority Groups and Tax Authorities (CSV)/Tax Authority Groups and Tax Authorities.csv` and extractor outputs like `supporting-data/metro-levies-2026.json` when you want full audit history in the repo.

| Layer | Role |
| --- | --- |
| `public/data/*.json` | Committed app data: metro levies, Arapahoe levy stacks, PIN→TAG map, Colorado district JSON, etc. |
| `supporting-data/` | Local inputs for regeneration; large files ignored, documented in this README |
| `tools/*.py` | Offline extractors and index builders (not runtime) |

- **Metro levy JSON (dropdown / rates):** `public/data/metro-levies-2025.json` (and year-specific siblings). Regenerate with `tools/extract_metro_levies_2025.py` / `tools/extract_metro_levies_2026.py` from the county **Mill Levy Public Information** PDF placed at `supporting-data/Mill Levy Public Information Form.pdf` (see script docstrings for flags).

### Minimal path (fork and run the app)

```bash
npm install
npm run dev
```

No Python required. Uses committed `public/data/*`.

### Full data pipeline (regenerate JSON)

1. **Python environment** (from repo root):

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r tools/requirements.txt
   ```

2. **Mill Levy Public Information PDF → metro-levies-*.json**  
   Download the current form from Arapahoe County (Treasurer / budget public information). The PDF linked on the in-app **Sources** page is the same one referenced in code as `ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF` — currently [Mill Levy Public Information Form](https://files.arapahoeco.gov/Assessor/Certification%20of%20Levies%20and%20Revenues/Mill%20Levy%20Public%20Information%20Form.pdf). Save as `supporting-data/Mill Levy Public Information Form.pdf`. Run the extractor for the target year; copy or symlink the normalized JSON to `public/data/metro-levies-YYYY.json` as needed.

3. **Arapahoe parcel levy index (PIN lookup + levy stacks)**  
   Export the needed tables from the **[Arapahoe Assessor Data Mart](https://gis.arapahoegov.com/assessordataexport/)** (weekly ZIP downloads):

   - `Main Parcel Table (CSV)/Main Parcel Table.csv` — large; place under `supporting-data/` (gitignored).
   - `Tax Authority Groups and Tax Authorities (CSV)/Tax Authority Groups and Tax Authorities.csv` — smaller; commit if you want reproducibility without re-downloading.

   Optional: export **Property Tax Entities** from DOLA [LGIS](https://dola.colorado.gov/dlg_lgis_ui_pu/publicLGTaxEntities.jsf) (interactive; accept terms, then export) and save as `supporting-data/property-tax-entities-export.xlsx` (gitignored). Canonical URL: `src/lib/dataSourceUrls.ts` (`DOLA_LGIS_PROPERTY_TAX_ENTITIES`).

   ```bash
   npm run build:arapahoe-index
   ```

   That runs `tools/build_arapahoe_parcel_levy_index.py` and writes `public/data/arapahoe-levy-stacks-by-tag-id.json` and (unless `--skip-pin-map`) `public/data/arapahoe-pin-to-tag.json`. The county **Tax District Levies** page uses `Levy.aspx?id=` with **TAGId** (county taxing authority ID), the same key as Field2 in the mart export — not an arbitrary parcel ID. See `PROJECT_CONTEXT.md` and the Sources page for methodology.

   Optional county GIS: **`AssessorParcels_WGS.gdb`** is published from the county [GIS Data Download](https://www.arapahoeco.gov/your_county/county_departments/assessor/arapahoe_maps_gis/gis_data_download.php) page (not used by that Python builder today; mart CSVs are the inputs).

4. **Colorado special districts (map / directory JSON)**  
   - `tools/import_colorado_district_layer_csv.py` — expects a statewide CSV export from the state [Map of All Special Districts in Colorado](https://data.colorado.gov/Local-Aggregation/Map-of-All-Special-Districts-in-Colorado/dm2a-biqr) dataset (example: `All_Special_Districts_in_Colorado_20260401.csv`); default path is `supporting-data/All_Special_Districts_in_Colorado_*.csv` (gitignored due to size). Writes lean `public/data/colorado-all-special-districts.json`. Canonical URL: `src/lib/dataSourceUrls.ts` (`COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET`).  
   - `tools/enrich_district_json_county_geoids.py` — optional; needs `supporting-data/tlgdb_*_co.gdb` (Census TIGER/Line Colorado GDB; download [tlgdb_2025_a_08_co.gdb.zip](https://www2.census.gov/geo/tiger/TGRGDB25/tlgdb_2025_a_08_co.gdb.zip), unzip, gitignored). Canonical URL: `src/lib/dataSourceUrls.ts` (`CENSUS_TIGER_GDB25_COLORADO_ZIP`).  
   - `tools/export_special_district_directory.py` — reads DOLA `dlall.dbf` (see script for default path); writes `public/data/colorado-special-district-directory.json`.

The **Sources** page (`/sources`) lists official county PDFs and states which file feeds `metro-levies-*.json` versus **reference PDFs** (e.g. Certification of Levies, Taxing District Levy Percentage) that are linked for verification only and are **not** parsed by `extract_metro_levies_*.py`. County links live in `src/lib/arapahoeCountyUrls.ts`. Statewide Colorado and federal URLs (DOLA LGIS property tax entities, special districts dataset, TIGER GDB zip) are in `src/lib/dataSourceUrls.ts`.

## License

MIT. See `LICENSE`.
