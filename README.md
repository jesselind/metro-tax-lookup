# Civic Lookup (Arapahoe County)

Static Next.js app (**Civic Lookup™**) that helps residents understand Arapahoe property-tax levy breakdowns, including metro district share.

Not affiliated with Arapahoe County. Informational only. Verify with official county sources. Not legal or tax advice.

## Product aim (taxpayer empowerment)

The tool is for **residents and concerned citizens**, not only for reproducing county tables. The chief aim is to **empower taxpayers** with clearer context about **who** levies a tax, **identifiers** that tie to public records, and **where to inquire** when something is unclear. When structure is **obfuscated** (by complexity or by how data is published), the app should **shed light** rather than hide behind empty states — including the reality that **districts may use private administrators or shared mailing addresses**, in plain language and without naming specific firms unless citable. When a data match is uncertain, prefer **calm, actionable guidance** (bill names and IDs, county/treasurer paths, `/sources`) over **alarm-only** UI. When **bill LG ID** and **directory LG ID** differ, we still show **state registry** contact where we have it, with framing: public mail often reflects **administration or management**, not a single tidy join to tax-line IDs. Narrative methodology lives on the in-app **`/sources`** page; this README stays technical for contributors.

## Purpose of this README

This file is for **repository visitors and contributors**: setup, app/architecture pointers, data layout, pipeline commands, tests, and security notes.

The in-app **`/sources`** page is for **residents and auditors**: verify-without-code steps, official citations, and plain-language methodology (matching, assessed splits, district contact vs tax IDs). Do **not** duplicate long pipeline or path dump on `/sources` — link here instead. Do **not** paste long resident methodology into this README — link `/sources`.

**Multi-session / agent handoff:** Ephemeral task notes go in **`docs/_working/`** (gitignored). Add markdown files there (e.g. `parcel-record-dashboard.md`); start a chat with *Read `docs/_working/<task>.md` and continue.* Update status at end of session; delete when shipped. Older comps notes: `docs/_working-comps-pdf-and-nov-sample.md`.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## App overview

- Main route `/`: address-to-PIN lookup from bundled situs JSON (exact key, soft street-type cleanup, then fuzzy street names at the same house number, with typeahead / did-you-mean). Typeahead shows **one suggestion per place** (house number + street); ZIP+4 is omitted in typeahead but kept in the multi-match chooser. When several PINs share that situs (condo units, Real property + business personal property), all accounts stay on the hit list and the existing multi-match chooser asks which to use (owner as title, PIN secondary; enriched with Real vs business personal property popovers and actual value from pin-to-tag). Match lists and suggestions use a two-line postage-style situs label (street; city, state, ZIP from Main Parcel `SA*`). Scrolling the typeahead list blurs the field (dismisses the mobile keyboard) without closing suggestions; close via outside tap, Escape, Search, or picking a row. After a first search with no single hit, refine fields sit **below** the match list. Choosing a property scrolls to the top of the report. Plus PIN or AIN paste into the address or parcel-id field; then levy stack and metro share.

- **Property details (home):** After a PIN levy load, scalar county-record rows render in **`ParcelRecordPanel`** (beside levy tiles on `lg+`, below levy on mobile). **Property classification** (mart class description) sits **below** that panel, under the table that ends with legal description. **Layout / a11y:** levy content comes **first in the DOM** so mobile visual and keyboard order match; on `lg+`, CSS grid placement puts the property column on the left (sidebar) without `order-*`, so tab order remains levy then property. Rows include ownership, neighborhood (empty until a per-parcel code ships), acreage, land use, **state use** (+ code), **tax roll**, **subdivision** (+ code), and legal description. Appraised/assessed values and building/land county tables load full width below the grid in **`ParcelRecordExtendedSection`** (`ParcelRecordCountyTables.tsx`). When Main Parcel **TaxYear** and **AssessmentYear** differ, a calm note appears above the values table; the assessment-year summary tile shows the tax year as a secondary line. Assessed school and local building/land splits follow state use (`src/lib/parcelAssessmentRates.ts` at display; build script for bundled shards). School assessed appears only for residential improvement (state use `1xxx`) from 2025+; non-residential omits that row (see **`/sources`**). Empty fields show **No data found** with a popover and prefilled mailto (`buildMissingParcelDataMailtoHref` in `src/lib/contact.ts`: field label, PIN, AIN). **Neighborhood** / **Neighborhood Code** are plain labels (no glossary popover) until a citable per-parcel source ships — empty cells still use that shared No data found control. On `lg+`, **More property details** in the sidebar jumps to those tables; **Property details cont.** marks the continuation when property and levy sit side by side. After the levy stack, **See how the county displays your data** (`LevyCountyCompareSection`) offers equal outline actions for county parcel record, levy table, and property search (full width on mobile). **Back to top** uses the same full-width-on-mobile pattern as other disclosure/outline controls.

- **Comps PDF:** The summary row offers **Comps PDF** (county comps grid PDF when AIN is available from the parcel index). When **`ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE`** is true in **`src/lib/safeExternalHref.ts`**, the tile uses a red alert border and short Assessor-aligned status; the whole tile opens availability help (PDF icon is decorative), while the **Comps PDF** glossary label stays independently clickable, and the popover includes a try-county-link path if value changed. Availability strings live in **`src/content/countyCompsPdfGuidance.ts`**; shared Assessor markup is in **`src/components/CountyCompsPdfGuidance.tsx`** (popover, `/sources`, glossary). Flip that flag to restore the normal download-tile UI.

- **Demo comps grid:** Only **Try demo property** loads the in-page grid today, from **`src/data/nov-comps-grid-try-demo-property.json`** (fork of sample parser output with fictional parcel id, street #, street name, parcel number, neighborhood, and neighborhood group cells only). In-app per-parcel grid wiring is not shipped yet.

- **Parser output path:** **`supporting-data/_private/nov-grid-out.json`** is a conventional gitignored parser output / sanity-check file; write extracts there to diff or hand off. The app bundle never imports it. **`tools/ensure_nov_grid_for_build.mjs`** copies **`src/data/nov-comps-grid-fallback.json`** to that path only when the file is missing (minimal placeholder for optional local tooling).

- **Tests and dev/build:** **`npm run typecheck`** (`next typegen` then `tsc --noEmit`) is the TypeScript gate for all `**/*.ts` and `**/*.tsx`, including `*.test.ts`. Vitest does **not** typecheck — a green `npm run test:unit` does not prove CI/Vercel will pass. **`npm run ci:typecheck`** is the CI alias. **`npm run test:unit`** runs Vitest unit tests for TypeScript helpers (for example county URL builders in `src/lib/safeExternalHref.test.ts`). **`npm run ci:test:unit`** is the same command for CI. **`npm run test:nov-comps-parser`** runs the Python parser unit tests (they do not require `nov-grid-out.json`). **`npm run test:parcel-index`** runs synthetic unit tests for ownership-type and assessed-value helpers in `tools/build_arapahoe_parcel_levy_index.py` (no mart CSVs or real PINs). **`npm run test:metro-extract`** runs synthetic unit tests for `tools/extract_metro_levies_2026.py` (PDF line parsing and classification only; no PDF required). **`npm run test:authority-mills-extract`** runs synthetic unit tests for `tools/extract_authority_mills_by_tax_year.py` (Levy % table parsing; no PDF required). **`npm run ci:test:nov-comps-parser`** / **`npm run ci:test:parcel-index`** are the CI aliases. **`npm run dev`** runs `predev`, which executes **`ensure_nov_grid_for_build.mjs`**. **`npm run build`** runs `prebuild` (**`ensure_nov_grid_for_build.mjs`** plus levy explainer validation only; no Python) before the Next.js production build (bundle + another TypeScript pass). Refresh the committed Try-demo JSON when you re-parse the sample PDF; do not edit `nov-grid-out.json` for the demo UI.

### Tests, fixtures, and PII

This is a **public** repo. Automated tests must not spotlight a real resident (PIN, AIN, address, owner name, neighborhood code, or other fingerprints).

**What CI uses (required, committed):** Invented identifiers and tiny synthetic objects only.

| Layer | Where | Role |
| --- | --- | --- |
| TypeScript typecheck | `npm run typecheck` | `next typegen` + `tsc --noEmit` on app + tests (`*.test.ts` included in `tsconfig.json`) |
| TypeScript unit tests | `src/lib/syntheticTestIds.ts` | Shared fake PIN/AIN constants |
| Python unit tests | `tools/synthetic_test_ids.py` + `tools/test_*.py` | Same IDs for parser tests; parcel-index builder tests use invented Main Parcel rows (no real PIN) |
| NOV comps parser | Sample PDF / fixture paths used by `test_parse_arapahoe_nov_comps_grid.py` | Exercise parsing, not a live county parcel lookup |
| Parcel index builder | `npm run test:parcel-index` (`test_build_arapahoe_parcel_levy_index.py`) | Ownership-type heuristic + DPT assessed/school split math on synthetic rows (forkers: run after changing those helpers) |
| Metro levy extract | `npm run test:metro-extract` (`test_extract_metro_levies_2026.py`) | PDF text-line parsing, purpose classification, and aggregate math on synthetic lines (forkers: run after changing the 2026 extractor) |
| Authority mills extract | `npm run test:authority-mills-extract` (`test_extract_authority_mills_by_tax_year.py`) | Levy % table parsing and AUTH collapse on synthetic rows (forkers: run after changing the authority-mills extractor) |
| Browser e2e | `e2e/` + `npm run test:e2e` (Playwright) | Smoke + critical flows on Chromium, Firefox, and WebKit. Shared address helpers in `e2e/helpers/addressLookup.ts` (street field is a combobox). `e2e/address-multi-pin-chooser.spec.ts` covers shared-situs Real + business personal property chooser. `e2e/metro-yoy.spec.ts` covers amber stack callout, Changed badge, percent YoY summary, expandable breakdown, `*` dollar footnote (no stack-level bill $). Assert UI contracts — not live scrapes or brittle dollar snapshots |

Do **not** put real homeowner PINs in tests "because they match the county site." Assert shapes, normalization, joins, and heuristics on **synthetic** rows instead.

**What CI does not need:** Environment variables for test parcel IDs. Requiring `REF_PIN` (or similar) for the default suite would break open-source CI and contributor onboarding. Env vars are optional for *extra* private checks only.

**Optional local spot-check (gitignored, never CI):** After a mart rebuild, compare any PIN you care about to the county `PPINum.aspx` page yourself. If you want a sticky reminder on disk, create **`supporting-data/_private/spotcheck-pin.txt`** with a single PIN (`supporting-data/` is gitignored; there is no committed example). That file is for humans/scripts you run locally — it is not read by the default `npm run test:*` commands.

**Runtime county JSON:** Bundled files under `public/data/` are public assessor extracts (the product). That is separate from **tests and docs**, which must not call out a specific person's parcel as the reference fixture.

**Try demo property:** Loads committed **`src/data/demo-property.json`** (PIN-less). Identity fields are fictional; non-PII dollars, building rows, sale/permit amounts/dates, and a realistic levy stack are frozen in that fixture. `src/lib/demoProperty.ts` validates required fixture shape at module load (`assertDemoPropertyFixture`) and exports `loadDemoProperty()` / `DEMO_*` constants. No real resident PIN is used at runtime for demo.

- **Row help and Glossary:** Row help merges from **`tools/nov_comps_grid_definitions.json`** when the grid JSON has no definitions block. Some row popovers link to **`/glossary`** for longer code context (LUC, improvement type/style, valuation grade).

- Fallback path: users can add levy rows manually without PIN.
- Policy/reference pages: `/sources`, `/glossary`, `/privacy`, `/accessibility`.
- All runtime data is static JSON under `public/data/`.

**Security:** The app trusts JSON committed at build time. There are no Subresource Integrity hashes on static data. CSP lives in `next.config.ts` and intentionally omits `upgrade-insecure-requests` (that header is baked at build time and breaks WebKit against plain-HTTP `next start` / e2e); terminate TLS at the edge and keep HSTS for HTTPS responses. If you need stronger assurance, verify repository contents and deployment artifacts in your own process (for example signed commits or supply-chain checks on the build environment).

**Abuse / bandwidth (Vercel Hobby):** Large county JSON under `/data/` is the main cost surface (no app API routes). `src/proxy.ts` rate-limits those paths per client IP with an in-memory fixed window (stricter for the large index bundles; see `src/lib/dataRequestGuard.ts`). Counters are **per serverless isolate**, not global across regions — enough to blunt single-IP floods; not a substitute for edge WAF / paid Vercel rate limits or a shared store. Client identity for the limiter (`src/lib/clientIp.ts`) uses platform-set headers only: `x-vercel-forwarded-for`, then `x-real-ip`. Standalone `x-forwarded-for` is ignored (spoofable); missing trusted headers share one `unknown` bucket. Disallowed methods on `/data` still return 405 even when limiting is bypassed. Loopback IPs are skipped so local Playwright/`next start` still works. Env bypass (local/debug only): set `RATE_LIMIT_DISABLED=1` in the environment (including a Vercel project env var) to skip limiting; do not leave that on in production. `public/robots.txt` disallows `/data/` for polite crawlers; `/data` responses send `X-Robots-Tag: noindex, nofollow` and CDN-friendly `Cache-Control` (see `next.config.ts`) so warm files are served from the edge when possible. The limiter mainly applies on cache misses and less-cached shard traffic. Caps are sized for mass demos on one shared WiFi IP (~60 cold sessions/minute for the large index files; see `HEAVY_DATA_LIMIT` / `OTHER_DATA_LIMIT` in `src/lib/dataRequestGuard.ts`), not for open scraping. Resident-facing privacy wording for voluntary email and IP use on `/data` is on `/privacy`. Follow-ups (Upstash shared counters, Cloudflare, post-deploy cache checks): `docs/_working/rate-limit-hardening.md` (gitignored).

## Data layout

| Path | Role |
| --- | --- |
| `public/data/*.json` | **Committed** runtime app data (what the site ships) |
| `tools/county-mart-data-as-of.txt` | **Tracked.** Date you last downloaded the Assessor Data Mart (`YYYY-MM-DD`): county data freshness, not "last rebuild." Build copies this into `public/data` `snapshot.bundledAsOf` (UI: "County data current as of …"). Update only when the mart drop is new. |
| `supporting-data/` | **Local only** (gitignored): county/state downloads and extract scratch. |
| `supporting-data/county-mart/` | Arapahoe Assessor Data Mart CSVs (local). |
| `supporting-data/county-mart-diff/` | Optional staging folder to diff a new mart drop before replacing `county-mart/`. |
| `supporting-data/dola/` | DOLA exports (`property-tax-entities-export.csv`, `lg-export-all.csv`, optional xlsx). |
| `supporting-data/certs/` | Mill-levy PDFs for extract scripts. Download from the Assessor Mill Levies hub; see `/sources`. |
| `supporting-data/metro-levies/` | Extract **raw** audit JSON only (`*-raw.json`). Shipping file is written straight to `public/data/`. |
| `supporting-data/refs/` | Optional statewide GIS / district layer inputs. |
| `supporting-data/_private/` | PII samples, NOV parser output. |
| `tools/*.py` | Offline extractors/index builders |

**Policy:** Point people at live county/state sources (`/sources`). Commit transforms under `public/data/` and the mart download stamp under `tools/`. Do not commit government PDF/CSV dumps under `supporting-data/`.

### Levy detail modal (`levy-explainer-entries.json`)

Plain JSON drives the levy tile detail modal (government level, what it is, citations). Use **`developmental-disability-levy`** as the reference shape for new entries. Examples in the file include Mart line **`2999`** (developmental disability) and **`4026`** (Arapahoe Library District).

Modal pattern, tone, and copy rules: **`docs/levy-explainer-authoring.md`**. Not every row has a JSON explainer; the shell still follows that hierarchy.

**Matcher order:** levy line code (Mart code) → LG ID + label keywords (only when `levyLineCode` is omitted in JSON) → source TAG id → `labelContainsAll`. The dialog passes DOLA `lgId` when the row has a match.

**Coverage queue:** `python3 tools/list_levy_explainer_queue.py` prints unique bundled `(line code, LG ID, authority)` rows.

**Validation:** `npm run validate:levy-explainer` checks JSON shape, link URLs, duplicate match keys, and no em dash (U+2014) in resident-facing strings (also runs automatically before `npm run build`).

**In-app term links in explainer copy:** use `{{term:term-id|link label}}` (for example `{{term:term-special-districts|special district}}`). The levy detail modal turns that into a control that opens a brief in the modal, with **More in Glossary** linking to `/glossary#term-…`.

### Authority chain (`levy-authority-chain-entries.json`)

Hand-curated **Who authorized this?** trail (**authority chain**) for selected stack rows (prototypes: Cherry Creek School Dist 5, AUTH `0501`; Littleton Public Schools Dist 6, AUTH `0601`; Arapahoe County, AUTH `2998`). JSON version 2 holds **structured facts only** plus explicit `family` (`school` | `county` | `metro`); resident wording is built from `src/content/levyAuthorityChainTemplates.ts` (master trail + family packs) via `src/lib/levyAuthorityChainBuild.ts`. Summary attribution is per-entry `summarySource.text` (trimmed at build; linked in the panel; no leading/trailing whitespace in JSON). County/metro TABOR entries may set `authority.governmentBillName` (defaults: `the county` / `the district`) for retention copy and credit open gaps. Optional budget facts use the `budget` field. Sourced facts use `https` URLs (validator checks the scheme only). `ballotTextKind: "unavailable"` requires a hub `ballotTextSource`, openGap `no-stable-ballot-text`, **no** measure `detail` (vote-identity body only). Spanish-sample fields (`ballotTextLanguage`, `ballotTextEnglishSource`, related openGap) and the hard-facts / next-best ladder live in `docs/levy-explainer-authoring.md` (**Spanish sample rule**). Prefer stable official URLs; deep-link PDFs when verified. Do not link Clarity ENR SPA URLs. Open gaps use predefined ids (`openGapIds`); most share static copy, and `no-temporary-credit-mill-split` is filled from the entry's mills + TABOR measure. Entry-specific mills takeaways use optional `mills.stepBody` (county pack stays generic). Match keys share `src/lib/levyEntryMatch.ts` with levy explainers. Durable list of official documents we could not locate: `src/content/authorityChainUnlocatedSources.ts` (author notes: `docs/authority-chain-unlocated-sources.md`; open rows also appear in a `/sources` disclosure). Validate with `npm run validate:levy-authority-chain` (also in `prebuild`). E2E (`e2e/authority-chain.spec.ts`) is authority-agnostic. Methodology: in-app `/sources` and `docs/levy-explainer-authoring.md`.

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

   **Mart refresh (recommended):** Download the portal export into a local `supporting-data/county-mart-diff/` folder first (create it if needed; same folder names as the portal). Diff against `supporting-data/county-mart/` — schemas and column order are usually unchanged; table CSVs often gain/change rows on the county's weekly cadence (guides/xlsx lookups and sometimes Tax Authority Groups may be identical). When you accept the drop, replace `county-mart/` with the staging contents, set **`tools/county-mart-data-as-of.txt`** to one line `YYYY-MM-DD` (the date you downloaded the CSVs: county freshness, not rebuild time; that date appears in the app as "County data current as of …"), then clear or remove `county-mart-diff/`. That staging path is a local convention only (not tracked in git).

   The script reads county mart CSVs from `supporting-data/county-mart/` (Main Parcel + Tax Authority Groups tables) and, when present, **DOLA LGIS Property Tax Entities** as `supporting-data/dola/property-tax-entities-export.csv` (download locally from DOLA; see `/sources`). If that file is missing, it falls back to `property-tax-entities-export.xlsx` in the same folder. **`*.xlsx` is gitignored.**

   Build behavior notes:
   - Within each TAG, repeated authority rows are collapsed to one canonical row per `code + authority`: active (`A`) rows are preferred over inactive (`I`), then newest `effectiveYear`.
   - Name matching normalizes common county abbreviations (for example `VLG` -> `VILLAGE`, `MD` -> `METROPOLITAN DISTRICT`) before fuzzy matching to DOLA legal names.
   - Optional `--dola-certifying-county` (default `Arapahoe`) filters DOLA export rows; JSON snapshot records the value in `dolaCertifyingCounty`.
   - `snapshot.bundledAsOf` in mart-built JSON comes from `tools/county-mart-data-as-of.txt` (county download date: update only when the mart is new, not on every rebuild). Override with `--bundled-as-of` if needed.

   Outputs include:
   - `public/data/arapahoe-levy-stacks-by-tag-id.json`
   - `public/data/arapahoe-pin-to-tag.json` (per PIN: `tagId`, values, `ain` from Main Parcel for the county comps grid PDF link)
   - `public/data/arapahoe-situs-to-pins.json` — situs lookup key → `[{ pin, label }, …]`. Labels are postage-style (`street, city, ST ZIP`) from Main Parcel `SA*` (including `SAPostalCd`). After regenerating with a label/schema change, bump `ARAPAHOE_SITUS_TO_PINS_CACHE_BUST` in `src/lib/arapahoeSitusLookup.ts` so browsers skip the `/data` `max-age` cache.
   - `public/data/arapahoe-parcel-record-by-pin/<prefix>.json` — per PIN: county-record fields for the home **Property details** experience (Main Parcel plus sibling mart joins; see build script). UI: scalar rows in `ParcelRecordPanel`; values / sale / building+land / permits in `ParcelRecordExtendedSection` / `ParcelRecordCountyTables`. Joins include legal display, ownership type, land, buildings, sale history (`Mart_Transfers`), permits (`Mart_RDE_Permit`), State Class Codes labels for `StateUseCd` (`stateUseLabel` / `stateUseCd` panel rows), subdivision name/code, and tax roll. Numeric codes strip Excel-ish `.0` suffixes at build time (`normalize_integerish_code`) and again for display (`formatMartIntegerCodeDisplay`) so already-bundled shards stay readable. Neighborhood fields stay empty until a **per-parcel** neighborhood code exists (NBHD xlsx is code→name only — not joined; do not infer from subdivision). Fireplaces is reserved in building attribute order but not in mart CSVs. Sale **Book Page** cells link to Arapahoe Clerk & Recorder public search. Sharded by **6-digit PIN prefix** (~156 KiB median / ~330 KiB max after Transfers/Permits; plain JSON; lazy-loaded after levy succeeds). Build **computes** assessed splits when mart columns are absent: residential local (6.8%) and school (7.05%) for state use `1xxx` improvement; non-residential proportional building/land from mart total (no school assessed). Display logic also in `src/lib/parcelAssessmentRates.ts`. Ownership type derives from legal-party rows — methodology and DPT rates on **`/sources`**; rate constants in the build script and `src/lib/coloradoDptAssessmentRates.ts` (bump when the next assessment year ships). Build logs shard size stats (median, p90, p99); re-shard if shards grow too large.

3. Rebuild the district contact bundle (DOLA LG export, filtered to LGIDs in levy stacks):

   ```bash
   npm run build:district-directory
   ```

   Reads `supporting-data/dola/lg-export-all.csv` (or pass `--lg-csv`) and `public/data/arapahoe-levy-stacks-by-tag-id.json`. Writes `public/data/colorado-special-district-directory.json`. Run after `build:arapahoe-index` when levy stacks change, or when you refresh the LG CSV.

   When an LGID appears on a levy stack but is missing from the LG directory CSV, the script adds a minimal name-only row from `supporting-data/dola/property-tax-entities-export.csv` (same local DOLA export used for levy matching) and records those LGIDs under `_meta.lgIdsFilledFromPropertyTaxEntities`. Optional `--certifying-county` (default `Arapahoe`) must match the export's certifying county column for fallback rows; `_meta.propertyTaxEntitiesCountyFilterApplied` records whether that column was present and `_meta.certifyingCountyForPropertyTaxFallback` is set only when the filter ran. Anything still absent from both sources remains in `_meta.missingLgIdsInExport`.

4. Rebuild metro levy JSON (year-specific script):
   - `tools/extract_metro_levies_2025.py` or `tools/extract_metro_levies_2026.py`
   - Source PDF (local): `supporting-data/certs/Mill Levy Public Information Form.pdf` (download from the Assessor Mill Levies hub; see `/sources`). Text-line extract; not the Certification of Levies PDF layout.
   - Writes shipping JSON to `public/data/metro-levies-YYYY.json` and a local raw audit to `supporting-data/metro-levies/*-raw.json` (no twin shipping copy under supporting-data)
   - App import site: `src/data/metroLevies.ts` (flip the year file there when shipping a newer extract)
   - YoY mill changes in the UI use each purpose's `rateMillsPrevious` vs `rateMillsCurrent` from that PDF column (never sum a summary Total with the part purposes that make it up)
   - Stack callout when any authority has a published mill change: **amber**, plain-language line (`Your property tax bill changed from last year.` via `src/content/levyYoYCopy.ts`). Means a rate on the bill changed; no claim you owe more or less overall. No stack-level bill $. Click scrolls to first Changed tile.
   - Tile details: percent change in mill rate when prior mills are known (e.g. `2.0% higher than last year`); mills fallback otherwise. Whole YoY summary box toggles year-by-year breakdown (`aria-expanded`); inline `Details ›` cue on the same line as the headline (same pattern as the stack bill-change callout). Breakdown: mills per tax year, **About $X*** at readable size, difference shows mills + dollars, one `*` footnote with popover on "today's assessed value" (`YOY_THEORETICAL_DOLLAR_POPOVER_BODY`; no prior-year assessed). **Total mills from county property tax tables** inline SVG chart when at least three Levy % years exist for that AUTH (`AuthorityMillsHistoryChart`, `authorityMillsSeries`); year dots open `InfoHintPopover` with that year's mills.
   - Metro purpose YoY only when Public Info purpose sums reconcile to AUTH Levy % totals (`metroPurposeTotalsReconcileWithAuth`); else AUTH path (see `metroPurposeYoYTrustedForLine`). **Total** section label only when purpose sub-rows are shown.
   - Core helper: `src/lib/metroLevyYearOverYear.ts` (`buildLevyLineYoYViewModel`, `millRatePercentChange`, `metroDistrictTileYoYSummary`, `billImpactCalloutForLevyLines`, `levyStackRateChangeCalloutSurfaceClasses`). Surfaces: `HomeParcelAddressLookup`, `LevyStackVisualization`, `LevyLineDistrictDetailDialog`.
   - Tests: `npm run test:unit` (includes YoY helpers), `npm run test:metro-extract` (extractor), `e2e/metro-yoy.spec.ts` (Playwright)

5. Rebuild authority mills-by-tax-year JSON (all-tile YoY priors + modal history from Levy %):
   - `tools/extract_authority_mills_by_tax_year.py` (default: Tax Years 2018–2025 from `supporting-data/certs/`; override with repeatable `--pdf YEAR PATH`)
   - Source PDFs (local): Assessor Mill Levies hub — `2018` through `2025 Taxing District Levy Percentage(s).pdf` (see `/sources`). Years are **Tax Year** labels from the PDFs — do not relabel Tax Year 2025 as budget year 2026.
   - Writes shipping JSON to `public/data/arapahoe-authority-mills-by-tax-year.json` (AUTH `code` → `millsByTaxYear`). Optional raw audit under `supporting-data/authority-mills/` (gitignored). Does **not** bake into `arapahoe-levy-stacks-by-tag-id.json`.
   - Join key: stack line `code` (AUTH). App import: `src/data/authorityMillsByTaxYear.ts`. Lookups: `src/lib/authorityMillsHistory.ts`. Chart: `src/lib/authorityMillsChartLayout.ts`, `src/components/AuthorityMillsHistoryChart.tsx`.
   - Tests: `npm run test:authority-mills-extract`, `npm run test:unit` (AUTH, chart layout, YoY helpers), `e2e/metro-yoy.spec.ts`

6. Optional legacy district tooling (not used for the app runtime bundle above):
   - `tools/import_colorado_district_layer_csv.py` — writes `supporting-data/refs/colorado-special-districts/colorado-all-special-districts.json` (gitignored) for enrichment experiments, not shipped in `public/data/`
   - `tools/enrich_district_json_county_geoids.py` — reads that JSON and optional Census GDB under `supporting-data/refs/gis/`
   - `tools/export_special_district_directory.py` — Colorado **dlall** GIS extract under `supporting-data/refs/gis/dlall/` (`dlall.dbf`)

7. Optional NOV comps grid extractor (experimental tooling; not used by the Next.js bundle):
   - `tools/parse_arapahoe_nov_comps_grid.py` reads **page 2** of a Notice-of-Valuation-style PDF when it carries the six-column comps grid (subject + five sales). It uses `pdfplumber` geometry + column bands, not line-table extraction.
   - Pair with `tools/nov_comps_grid_definitions.json` for plain-language `layTitle` / `layBody` row help plus optional `official` notes for maintainers (county citations when available).
   - Put real PDF samples under `supporting-data/_private/` (gitignored). Example default path in the script matches that layout.
   - Example (writes JSON for local runs and **parser tests**; gitignored): `source .venv/bin/activate && python3 tools/parse_arapahoe_nov_comps_grid.py --pdf supporting-data/_private/<your-file>.pdf --out supporting-data/_private/nov-grid-out.json`
   - Omit bundled definitions with `--skip-definitions` when you only want extracted cells.
   - Tests: `npm run test:nov-comps-parser` or `npm run ci:test:nov-comps-parser` (not part of `prebuild`; run in CI or locally when changing the parser). TypeScript unit tests: `npm run test:unit` or `npm run ci:test:unit` when changing `src/lib` helpers.
   - Treat JSON output as **sensitive** (parcel or address text); do not commit extracted files.

## Contributor notes

- Keep user-facing prose plain-language and avoid accountant-style "levy lines" phrasing.
- **Try demo property:** Committed PIN-less fixture **`src/data/demo-property.json`** (loaded via `loadDemoProperty()` in `src/lib/demoProperty.ts`). Identity fields, Book Page, and permit numbers are fictional; clerk links stay off in demo UI. Fixture shape is asserted at module load. Refresh the fixture when you intentionally update demo dollars / levy / building shape — do not point demo at a real PIN.
- Static term definitions live in `src/content/termDefinitions.tsx` and render on **`/glossary`**. Prefer underlined text popovers (`GlossaryTermPopover` / `ParcelGlossaryPopoverTrigger`) for brief help in flows; full asides are glossary-only. Mid-flow links to **`/glossary`** or **`/sources`** use **`PreserveSessionDocLink`** (new tab + `rel="noopener noreferrer"`) so client-side parcel results stay in the origin tab; header/footer stay same-tab. Parcel-record label glossaries live in `parcelGlossaryTermBriefRegistry` (`termDefinitionBodies.tsx`); skip a glossary when there is no citable, useful brief (Neighborhood / Neighborhood Code, Owner Address, City/State/Zip, and Acreage today).
- Levy explainer modal content is data-driven from `public/data/levy-explainer-entries.json` (authoring: `docs/levy-explainer-authoring.md`).
- Authority-chain panel (sourced "Who authorized this?") is data-driven from `public/data/levy-authority-chain-entries.json`.
- **Docs split:** README = technical (this file). `/sources` = verify steps, citations, methodology. `/glossary` = term definitions. Avoid copying the same long block into both README and Sources.
- **Browser e2e (Playwright):** Install browsers once with `npx playwright install` (CI uses `npx playwright install --with-deps`). **IDE:** start this app (`npm run dev` on :3000), then run tests from the Playwright extension (the extension does not start the app for you). **CLI:** `npm run test:e2e` / `test:e2e:ui` reuses :3000 on `localhost` when this app is already up; otherwise starts `next dev` there (no production typecheck). If another project owns :3000, stop it or set `E2E_PORT`. **CI-style local:** `npm run typecheck`, `npm run build`, then `CI=1 npm run test:e2e` (`next start` on `127.0.0.1:3100`). **CI (GitHub):** `.github/workflows/playwright.yml` — three jobs: **TypeScript typecheck**, **Unit tests (Vitest)**, then **Browser e2e (Playwright)** after a production `npm run build` (push/PR to `main` + `workflow_dispatch`; `permissions: contents: read`, checkout `persist-credentials: false`). **Address lookup helpers:** `e2e/helpers/addressLookup.ts` (`streetAddressField`, `searchSyntheticAddress`) — the home street field is a labeled **combobox** (typeahead), not a textbox; use the helper (or `getByLabel`) instead of `getByRole("textbox", { name: "Street address" })`. Keep `STREET_ADDRESS_FIELD_LABEL` in sync with the visible label in `HomeParcelAddressLookup`.

## License

This repository is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

This means you are free to use, modify, and distribute this code — including for forks targeting other counties or jurisdictions — provided that any modified version you deploy is also released under AGPL-3.0 with its source code publicly available. You may not deploy a modified version as a closed-source or proprietary service.

**Trademark:** Civic Lookup™ is a trademark of Jesse Lind. This repository is licensed under the GNU Affero General Public License v3.0. The AGPL does not grant permission to use the Civic Lookup name or logo for modified versions or derivative services in a manner that suggests endorsement or affiliation. (In-app copy: `src/content/trademarkNotice.ts`; Privacy `#trademark`.)

Commercial use is permitted only if the above conditions are met. If you need a separate licensing arrangement, contact info@civiclookup.com.

See `LICENSE` for the full license text.
