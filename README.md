# Metro tax lookup (Arapahoe County)

A small **Next.js** site for Arapahoe County residents: the **home page** (`/`) combines address → PIN lookup, the **property tax levy breakdown** (tiles; **Add tile** or load by PIN), and the **metro district tax share** card. Policy pages: sources, privacy, accessibility. Old URL `/metro-tax-lookup` redirects to `/`.

Not affiliated with Arapahoe County. Informational only. Verify with official county sources. Not legal or tax advice.

MIT-licensed; please attribute and verify with county source documents.

**Audience:** This file is for **developers and contributors** (Git clone, tooling, regenerating JSON). The deployed app’s **Sources** page at `/sources` is for anyone verifying against county sources **without code**, and for **technical, finance, and audit readers** who need the full transparent path from exports and scripts through bundled JSON to the UI.

## The tools

| Tool | Route | What it does |
| --- | --- | --- |
| **Address + levy breakdown** | `/` | Offline address → PIN (`arapahoe-situs-to-pins.json`), then levy stack from PIN (TAG lines). Optional **Add levy lines without loading a PIN** opens the same breakdown; use **Add tile** in the grid to copy rows from the county levy table. Editable tiles and table. |
| **Metro district tax share** | `/` (home card) | Compares total mills to metro district mills; shows share of your property tax *rate* that goes to the metro district (operations + debt). Uses the **same total mills as the levy stack** (sum of lines) and **detects metro district(s) from levy stack lines** when matched LG IDs align with `lgid` on metro rows in `metro-levies-2025.json`. There is **no manual district picker** and **no separate mills field** on this card; if no line matches, the card explains that and links to the statewide special districts map. |

Static JSON under `public/data/` powers metro rates, Arapahoe PIN/TAG/situs indexes, levy stacks, and Colorado district metadata.

## Use (for residents)

Start at `/` for address lookup, levy breakdown, and metro district tax share.

The first home card is an **offline address → PIN** helper (`arapahoe-situs-to-pins.json`). Field semantics match `tools/build_arapahoe_parcel_levy_index.py` (Main Parcel `SAAddrNumber` + optional `SAStreetNumberSfx`, normalized street name, optional unit). One match loads the levy stack automatically; several matches use **Use this property** per row, with a county link if you need to verify which PIN is yours; no match shows county PIN help plus optional screenshots for **Tax District Levies** and **2025 Mill Levy** on the parcel page. Until a PIN load is in progress, completes (success or error), you choose **Add levy lines without loading a PIN**, or you already have levy content, the home page hides the levy card and the embedded metro card so only the address card shows (typing address fields or PIN alone does not reveal them). After a failed load you can add lines with **Add tile** in the grid. If you open the breakdown without a PIN, a **Where to find those rows on the county site** panel above the tiles repeats that levy-table and total-mills guidance (same toggles as metro **Having trouble?**). The **Breakdown of your property tax bill** section uses bundled county data and/or lines you add from the county levy table, then the tile + table UI. After a successful PIN load, plain-language **Definitions** (mills, levy, LG ID — same section title as `/sources`) sit at the bottom of the page. See `/sources` for methodology. Old URL `/levy-breakdown` redirects to `/`.

### Metro district tax share

After you load a parcel PIN and the levy stack appears, the metro card uses the **same total mills as the levy stack** (sum of lines) and **derives metro district(s) only from the stack** when levy line LG IDs match metro rows in bundled JSON (`src/lib/metroDistrictFromLevyLines.ts`). There is **no manual district selection** and **no separate mills field** on this card; change lines in the breakdown above if you need different numbers. If there is no ID match, a short message and a link to the statewide special districts map appear; metro share numbers are not shown until a match exists. **Start over** lives only in the **Start with your address** card; it clears address search, PIN, levy stack, and metro state together. Optional **Having trouble?** (map, assessor link, screenshot hints) sits at the bottom of the metro card, below **What's a metro district?**.

### Breakdown of your property tax bill (home page)

1. Finish the address card: search by address and, if needed, enter or confirm **Parcel PIN**, then load the stack when prompted — or use **Add levy lines without loading a PIN** to open the breakdown and use **Add tile** for each row from **Tax District Levies**. After a successful PIN load, the address card collapses (toggle the header to reopen); the page scrolls to the levy section and moves keyboard focus to that heading (smooth scroll unless reduced motion is on).
2. County PIN path reads bundled JSON only; compare to the county **Tax District Levies** table when verifying.
3. After a successful **PIN** load, **Definitions** (mills, levy, LG ID — same blocks as on `/sources`) appears at the bottom of `/`. The levy line modal shows one combined card (tax entity, LG ID, contact) with caveats when needed; matching LG ID between DOLA and the directory is treated as the strongest link. Bundled district JSON does not include phone numbers yet, so the UI cannot show them until a future data pass.

Details and citations are on the in-app Sources page (`/sources`).

## Sources, privacy, accessibility

- **Sources**: In-app at `/sources` — step-by-step verification, official links, definitions, and **auditable methodology** (build inputs, scripts, independence of levy-detail matchers). Use this README’s **Development** section for pipeline commands and file paths.
- **Privacy**: No analytics, no cookies, and no saving inputs in your browser (local/session storage). See `/privacy`.
- **Accessibility**: We aim for WCAG 2.1 AA. To report an accessibility issue, email `metro.tax.lookup@pm.me`. See `/accessibility`.
- **Security**: HTTP security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame denial, HSTS in production) are configured in `next.config.ts`. The home address lookup caps field lengths, keeps lookup in the browser, fetches bundled JSON with `credentials: "same-origin"`, and validates JSON shape after parse before indexing (see `validateArapahoeSitusToPinsPayload` in `src/lib/arapahoeSitusLookup.ts`). There is no server endpoint that accepts user-submitted addresses.

## Development

**UI copy (for contributors and AI):** Avoid the **"levy lines" / "district lines"** style accountant phrasing in user-facing strings; **levy** and **mills** are OK when clear. **Intent:** readable for the public, not a literal ban list — see `.cursor/rules/plain-language-no-lines-jargon.mdc`.

**Glossary / term definitions:** All definition blocks live in `src/content/termDefinitions.tsx`. The Sources page renders **`AllTermDefinitionAsides`**; the home page renders **`TermMillsAside`**, **`TermLevyAside`**, and **`TermLgIdAside`** (after a successful PIN load). Levy line detail copy and layout live in `LevyLineDistrictDetailDialog.tsx`.

Install deps and run the dev server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

### Data files

**What ships in the browser:** everything the app loads lives under `public/data/` as static JSON (and is imported or fetched at runtime). Files there do not affect dev-server performance beyond normal asset size; only what you put in `public/` or import into the bundle affects what users download.

**What `supporting-data/` is for:** offline inputs and intermediate files for Python tools (county CSV exports, PDFs, optional state CSVs). It is not read by Next.js at build time unless you add scripts that copy into `public/`. Keep large downloads out of git (see `.gitignore`) and document where you got them; commit small, stable files such as `Tax Authority Groups and Tax Authorities (CSV)/Tax Authority Groups and Tax Authorities.csv` and extractor outputs like `supporting-data/metro-levies-2026.json` when you want full audit history in the repo.

| Layer | Role |
| --- | --- |
| `public/data/*.json` | Committed app data: metro levies, Arapahoe levy stacks, PIN→TAG map, Colorado district JSON, etc. |
| `supporting-data/` | Local inputs for regeneration; large files ignored, documented in this README |
| `tools/*.py` | Offline extractors and index builders (not runtime) |

- **Metro levy JSON (bundled rates):** `public/data/metro-levies-2025.json` (and year-specific siblings). Regenerate with `tools/extract_metro_levies_2025.py` / `tools/extract_metro_levies_2026.py` from the county **Mill Levy Public Information** PDF placed at `supporting-data/Mill Levy Public Information Form.pdf` (see script docstrings for flags).

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

   That runs `tools/build_arapahoe_parcel_levy_index.py` and writes `public/data/arapahoe-levy-stacks-by-tag-id.json` and (unless `--skip-pin-map`) `public/data/arapahoe-pin-to-tag.json` plus `public/data/arapahoe-situs-to-pins.json` (situs lookup keys from `Main Parcel` → PIN list for the home-page address flow). The county **Tax District Levies** page uses `Levy.aspx?id=` with **TAGId** (county taxing authority ID), the same key as Field2 in the mart export — not an arbitrary parcel ID. See `PROJECT_CONTEXT.md` and the Sources page for methodology.

   **Mart label overrides:** `tools/arapahoe_dola_authority_overrides.json` maps mart authority strings (uppercased) to DOLA legal names and optional `millsOverride` when fuzzy matching would pick the wrong entity or DOLA totals disagree with the county levy table. Example: **ARAPAHOE COUNTY L.E.A.** (code 4012) otherwise token-matches **Arapahoe County** and picked up the county mill rate instead of the Law Enforcement Authority line.

   Optional county GIS: **`AssessorParcels_WGS.gdb`** is published from the county [GIS Data Download](https://www.arapahoeco.gov/your_county/county_departments/assessor/arapahoe_maps_gis/gis_data_download.php) page (not used by that Python builder today; mart CSVs are the inputs).

4. **Colorado special districts (map / directory JSON)**  
   - `tools/import_colorado_district_layer_csv.py` — expects a statewide CSV export from the state [Map of All Special Districts in Colorado](https://data.colorado.gov/Local-Aggregation/Map-of-All-Special-Districts-in-Colorado/dm2a-biqr) dataset (example: `All_Special_Districts_in_Colorado_20260401.csv`); default path is `supporting-data/All_Special_Districts_in_Colorado_*.csv` (gitignored due to size). Writes lean `public/data/colorado-all-special-districts.json`. Canonical URL: `src/lib/dataSourceUrls.ts` (`COLORADO_DATA_GOV_ALL_SPECIAL_DISTRICTS_DATASET`).  
   - `tools/enrich_district_json_county_geoids.py` — optional; needs `supporting-data/tlgdb_*_co.gdb` (Census TIGER/Line Colorado GDB; download [tlgdb_2025_a_08_co.gdb.zip](https://www2.census.gov/geo/tiger/TGRGDB25/tlgdb_2025_a_08_co.gdb.zip), unzip, gitignored). Canonical URL: `src/lib/dataSourceUrls.ts` (`CENSUS_TIGER_GDB25_COLORADO_ZIP`).  
   - `tools/export_special_district_directory.py` — reads DOLA `dlall.dbf` (see script for default path); writes `public/data/colorado-special-district-directory.json`.

The **Sources** page (`/sources`) lists official county PDFs and states which file feeds `metro-levies-*.json` versus **reference PDFs** (e.g. Certification of Levies, Taxing District Levy Percentage) that are linked for verification only and are **not** parsed by `extract_metro_levies_*.py`. County links live in `src/lib/arapahoeCountyUrls.ts`. Statewide Colorado and federal URLs (DOLA LGIS property tax entities, special districts dataset, TIGER GDB zip) are in `src/lib/dataSourceUrls.ts`.

## License

MIT. See `LICENSE`.
