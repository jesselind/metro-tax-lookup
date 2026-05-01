# Working notes: county comps PDF vs sample NOV (delete when done)

Ephemeral doc for multi-agent handoff. Do not treat as product copy or `/sources` methodology.

## Goal (original thread)

Prototype extraction around **Arapahoe county-provided comps** context. The app today links the **comps grid PDF** via AIN:

- URL builder: `safeArapahoeCompsGridPdfUrl()` in `src/lib/safeExternalHref.ts`
- Pattern: `https://parcelsearch.arapahoegov.com/FileDownload.ashx?AIN=<ain>`
- AIN source: `ain` on each PIN row from `tools/build_arapahoe_parcel_levy_index.py` into `public/data/arapahoe-pin-to-tag.json`

## Sample on disk (local only)

- Path: `supporting-data/_private/Traditional-Notice-of-Valuation-656.pdf` (entire `supporting-data/_private/` directory is gitignored)
- **This is a Notice of Valuation (NOV)**. Page 1 is the typical NOV/appeal worksheet shell; **page 2 embeds a wide comps grid** (subject column plus five sale columns). That is still **not the same artifact** as the county **`FileDownload.ashx` comps grid export**, but it is a useful **layout surrogate** until that export is available again.
- **Privacy:** contains PII. Keep under `supporting-data/_private/` (gitignored; see `.gitignore`). If Git ever tracked it, `.gitignore` alone will not remove it from history or index.
- **Chat / doc hygiene:** do not paste full grids with addresses or parcel numbers into issues, PRs, or permanent docs. Keep raw dumps local; this file records **structure and methodology only**.

## NOV page 2 - comps grid shape (no values)

Human-reviewed structure for the local sample (do not treat as universal until we have 2-3 NOVs and at least one `FileDownload.ashx` PDF):

- **Columns:** 6 total - **1 subject** + **5 sales** (`SALE 1` ... `SALE 5`), each introduced by a column header row.
- **Rows:** long vertical attribute list (parcel id, street tokens, dwelling flags, neighborhood codes, land/improvement detail, adjustments, then valuation block with sale dates and price series).
- **Masked cells:** asterisk runs (`*************`) appear as placeholders in several attribute rows (treat as null/omitted visually, not as literal strings if possible).
- **`pdfplumber` note:** line-based `extract_tables()` returned **0** tables on page 2 for this file, despite the grid reading as a table to humans. Expect to use **text + geometry** (word clustering), explicit anchors (`SUBJECT`, `SALE n`), or **text** table settings - not ruled-line detection alone.

## Canonical comps grid row labels (v1 must-map)

These are the **row keys** shared across the six columns on NOV page 2 for the local sample.

### USPAP-aligned rigor (engineering interpretation)

This app is **not** producing appraisals. Still, if we model a county comps grid, we should borrow the **discipline** appraisers use in workfiles: **stable identifiers**, **typed facts**, explicit **unknown/unparsed** states, and **no silent coercion** (especially for money, dates, and "0" vs blank).

### Official USPAP references (for humans, not code import)

What we store in-repo is **not** "the USPAP schema." USPAP is a **professional standards book** (ethics + assignment expectations + reporting rules) published by **The Appraisal Foundation**. When we need legal/standard wording, pull it from the Foundation sources, not from memory.

Authoritative starting points:

- USPAP hub (overview + links): `https://appraisalfoundation.org/pages/uspap`
- Public **Standards 1-4** PDF link (as linked from the hub): `https://appraisalfoundation.sharefile.com/share/view/sa9a85f26098c4f7ab01e927b647ec962`
- Purchase / edition info (current published edition is updated on the Foundation schedule): `https://appraisalfoundation.org/products/uspap`
- **Guidance and Reference Manual** (Advisory Opinions + FAQs; separate publication as of 2024): `https://appraisalfoundation.org/products/uspap-guidance-and-reference-manual`

Reality check for this project: USPAP tells you what credible appraisal practice and reporting requires **from appraisers**. It does **not** magically define what Arapahoe County meant by every abbreviated row label on a mass-appraisal notice PDF. Our job is to translate **county fields** into **plain language** with **citations** (county methodology PDFs/pages where possible) and to avoid implying USPAP compliance for a non-appraisal tool.

### Fannie Mae / UAD references (formatting discipline)

For **this project**, we only need Fannie/UAD materials in one narrow way: **hard formatting + validation discipline** for the values we parse out of county PDFs (money/date/integers, explicit failure states). We are **not** building UCDP submission software, and we should not imply the county grid is a Form 1004/UAD report.

**Primary external reference (use this):**

- Legacy UAD 2.6: **Appendix D - Field-Specific Standardization Requirements (PDF)** (currency/date formatting patterns, "reporting format" thinking, and general strictness expectations):
  - `https://singlefamily.fanniemae.com/media/document/pdf/uad-specification-appendix-d-field-specific-standardization-requirements`

**Optional secondary reference (only if we want spreadsheet-style validation severity):**

- Legacy **UAD Compliance Rules** (linked from Fannie Mae's UAD resources page under "UAD 2.6 and Resources"):
  - `https://singlefamily.fanniemae.com/delivering/uniform-mortgage-data-program/uniform-appraisal-dataset`

**Explicitly out of scope unless the product pivots:**

- UAD 3.6 / URAR redesign appendices (different document set; not needed to parse Arapahoe PDFs today).
- Selling Guide chapters about lender delivery requirements (policy context only; not a parsing spec for county notices).

**How to use Appendix D without over-claiming:**

- Treat it as a **baseline strictness** reference for `parsed` typing and `parse_ok` rules.
- When Arapahoe's printed format diverges, we follow **what the county actually prints**, but we still keep UAD-like strictness: **no silent coercion**, preserve `raw_text`, and document the divergence in this working log.

### Resident-facing explanations (product requirement)

**Requirement:** every comps grid row label needs a **plain-language** explanation for everyday readers (not a popover requirement - popover is an implementation detail).

Recommended UX patterns (pick one per platform constraints):

- **Row label + (i) hint** using `InfoHintPopover` (already used elsewhere in the app) for dense grids.
- **"What these rows mean"** drawer/accordion above the grid for mobile (reduces 40 tiny targets).
- **Glossary page** deep link ("Open full glossary") when definitions run long.

Copy rules:

- Prefer **what it means on your notice** and **why it can differ** across columns (subject vs each sale).
- If a label is ambiguous (`PP`, dense codes), say so plainly and point to **county** documentation when we have it; do not fake precision.

Minimum per cell (each intersection of row label x column):

- `raw_text` (exact text from PDF)
- `parsed` (typed value or null)
- `parse_ok` (boolean) + short `parse_note` when false (examples: masked sentinel, ambiguous date, currency symbols, wrapped tokens)

**Comparable set expectations for this grid:** 1 subject + up to 5 sales. Parser should emit `sale_slots = 5` even when a column is empty, so downstream code can reason about missing comps without reshaping.

**Duplicates in the PDF wording:** `Time Adj Sale Price` appears twice in the human reading (once in the attribute stack, again near the valuation block). Keep **two distinct JSON keys** (`time_adj_sale_price` vs `valuation_time_adj_sale_price`) until a second NOV proves a stable single meaning.

| PDF row label (verbatim) | JSON key | Logical type | JSON / parse target | Notes |
| --- | --- | --- | --- | --- |
| `PARCEL ID` | `parcel_id` | PIN (public record id) | `string` matching `/^\\d{9}$/` after normalizing dashes/spaces | If county prints something else, keep `raw_text` and set `parse_ok=false` |
| `STREET #` | `street_number` | Address token | `string` (trim; preserve fractional forms like `1/2` if present) | Do not guess unit from street # |
| `STREET` | `street_name` | Address token | `string` (trim; collapse internal whitespace) | |
| `STREET TYPE` | `street_type` | Address token | `string` (trim; uppercase ok) | |
| `APT #` | `apt_number` | Address token | `string` (trim) | Empty vs masked sentinel both become null `parsed` |
| `DWELLING` | `dwelling` | Indicator | `0 \| 1` integer (nullable) | If additional values appear on other samples, stop coercing and widen enum |
| `Time Adj Sale Price` | `time_adj_sale_price` | Money (USD) | `number` USD (cents optional); reject ambiguous ranges | First occurrence in attribute stack |
| `Original Sale Price` | `original_sale_price` | Money (USD) | `number` USD | |
| `Concessions and PP` | `concessions_and_pp` | Money (USD) | `number` USD | Negative concessions should parse as negative numbers |
| `Parcel Number` | `parcel_number` | County parcel id | `string` (trim) | Keep as opaque id unless a format regex is validated across samples |
| `Neighborhood` | `neighborhood` | Code / label | `string` | Often numeric code; still typed as string unless proven |
| `Neighborhood Group` | `neighborhood_group` | Code / label | `string` | |
| `LUC` | `luc` | Code / label | `string` | |
| `Allocated Land Val` | `allocated_land_val` | Money (USD) | `number` USD | |
| `Improvement Type` | `improvement_type` | Categorical label | `string` | |
| `Improvement Style` | `improvement_style` | Categorical label | `string` | |
| `Year Built` | `year_built` | Year | `integer` (1800..2100) or null | `0` should parse as null when it means "none" |
| `Remodel Year` | `remodel_year` | Year | `integer` (1800..2100) or null | `0` should parse as null when it means "none" |
| `Valuation Grade` | `valuation_grade` | Grade code | `string` (single letter typical) | |
| `Living Area` | `living_area` | Area (sf) | `integer` (non-negative) | |
| `Basement/Garden lvl` | `basement_garden_lvl` | Area (sf) | `integer` (non-negative) | |
| `Finish Bsmt/Grdn lvl` | `finish_bsmt_grdn_lvl` | Area (sf) | `integer` (non-negative) | |
| `Walkout Basement` | `walkout_basement` | Area (sf) | `integer` (non-negative) | |
| `Attached Garage` | `attached_garage` | Area (sf) | `integer` (non-negative) | |
| `Detached Garage` | `detached_garage` | Area (sf) | `integer` (non-negative) | |
| `Open Porch` | `open_porch` | Area (sf) | `integer` (non-negative) | |
| `Deck/Terrace` | `deck_terrace` | Area (sf) | `integer` (non-negative) | |
| `Total Bath Count` | `total_bath_count` | Count | `number` (allow halves if county prints `.5`) | If only ints appear, tighten to `integer` after corpus check |
| `Fireplaces` | `fireplaces` | Count | `integer` (non-negative) | |
| `2nd Residence` | `second_residence` | Indicator | `0 \| 1` integer (nullable) | Same caution as `DWELLING` |
| `Regression Valuation` | `regression_valuation` | Money (USD) | `number` USD | |
| `VALUATION` | `valuation_label` | Section marker | `string` | Usually blank/label; still store raw + parsed null ok |
| `SALE DATE` | `sale_date` | Date | `string` ISO `YYYY-MM-DD` when unambiguous | County prints `M/D/YYYY` in samples; support that + padded variants |
| `Time Adj Sale Price` | `valuation_time_adj_sale_price` | Money (USD) | `number` USD | Second occurrence in valuation block |
| `Adjusted Sale Price` | `adjusted_sale_price` | Money (USD) | `number` USD | |
| `ADJ MKT $` | `adj_mkt` | Money (USD) | `number` USD | |

**Header rows (also must-map as metadata, not row keys):** `SUBJECT`, `SALE 1` ... `SALE 5` (store as `grid.columns[]` in order).

### Definition contract (dual track: official + lay)

Yes: the "schema" for each row is not only typing/parsing - it is also **two parallel definitions** so we can choose per surface (tooltip vs drawer vs `/sources`) without losing rigor.

For each `json_key` (each row label), maintain:

- **`definition.layTitle`**: short, friendly label (what shows beside the row in tight UI)
- **`definition.layBody`**: plain-language explanation for residents (what you already want as the default voice)
- **`definition.official`**: zero or more citations that justify strict parsing and professional-adjacent wording
  - Prefer **primary county** methodology links/PDF anchors when they exist (best source of truth for what *this grid* means)
  - When a county row aligns to a **UAD Appendix D** reporting-format concept, cite the relevant Appendix D section/page as a **secondary** reference for formatting strictness (not as proof the county meant the same thing)
  - If no good official mapping exists yet, set `definition.official` to explicit **`TODO`** with the research task (do not invent)

UI selection rule (defaults are flexible, but the data model is not):

- Default resident surfaces show **`layBody`**, with an optional "Official references" disclosure for people who want receipts.
- Appraiser-style depth stays off the critical path unless we intentionally add an "advanced" mode.

### Resident glossary (v1 draft; one row per label)

These are **non-technical** explanations meant for the public UI. They are **not** a substitute for USPAP training; they exist because the county PDF is silent.

This table is the **`definition.layTitle` + `definition.layBody` seed** for each row. Pair each row with `definition.official` citations separately (county-first; UAD Appendix D only when it truly applies).

| PDF row label | Short title (UI) | Plain definition | Uncertainty / follow-up |
| --- | --- | --- | --- |
| `SUBJECT` / `SALE n` | Your home / a comparable sale | Your column is the home being valued. Each sale column is one property the assessor used as a comparison point for that neighborhood/time window. | If we show this outside NOV context, clarify the source PDF. |
| `PARCEL ID` | PIN | The county's parcel identification number (often 9 digits) for that row's property. | Confirm zero-padding rules across exports. |
| `STREET #` | Street number | The numeric part of the street address. | Fractional house numbers should display exactly as the county prints them. |
| `STREET` | Street name | The street name without the street type (Drive, Circle, etc.). | |
| `STREET TYPE` | Street type | The road category suffix (Street, Avenue, Circle, etc.). | |
| `APT #` | Unit | Condo/apartment/unit identifier when the county tracks one. | Blank vs masked means "none shown," not "prove there is no unit." |
| `DWELLING` | Dwelling flag | A county yes/no style flag about whether the parcel is treated as a dwelling for this schedule. | Validate allowed values across samples before hard-coding meaning beyond yes/no. |
| `Time Adj Sale Price` | Time-adjusted sale price | A sale price rolled forward or backward to the county's valuation date using their time-adjustment method so older sales can be compared more fairly. | This is a modeled output, not the literal closing wire amount on closing day. |
| `Original Sale Price` | Contract sale price | What the property sold for on the contract/deed the county is using before some adjustments. | County may still apply edits; treat as "as printed in this grid." |
| `Concessions and PP` | Concessions (and maybe personal property) | Money the buyer/seller negotiated outside the "house price" line that often needs adjustment (seller credits, personal property bundled into the sale, etc.). **`PP` is ambiguous** in this PDF alone; do not assert a meaning without a county definition. | Need an Arapahoe methodology note or glossary PDF to define `PP` precisely. |
| `Parcel Number` | County parcel number | A county internal parcel/account identifier string (not always the same thing people call PIN day-to-day). | Treat as opaque until format rules are validated. |
| `Neighborhood` | Neighborhood code | A county neighborhood code used for grouping comparable sales. | Explain that it is an internal code, not a marketing neighborhood name. |
| `Neighborhood Group` | Neighborhood group | A broader bucket the county uses when a tighter neighborhood does not have enough sales. | |
| `LUC` | Land use code | A county classification describing allowed/named land use for valuation grouping. | Expand acronym in UI as "Land use code (county)"; map codes only if we publish a vetted table. |
| `Allocated Land Val` | Land value portion | The part of the total value the county allocated to land (as opposed to improvements) for that row. | Dollars are county modeled values, not a market listing price. |
| `Improvement Type` | Building type | High-level category of the improvement (house style category, etc.). | |
| `Improvement Style` | Building style | More specific style description within the type. | |
| `Year Built` | Year built | The year the main improvement was originally built. | `0` usually means "not applicable / unknown" in assessor extracts; show as blank in UI. |
| `Remodel Year` | Remodel year | A major remodel year when the county tracked one. | `0` usually means none. |
| `Valuation Grade` | Quality/condition grade | A short county grade for construction/condition/quality used inside their models. | Explain it is not a school grade and not a private inspector's report. |
| `Living Area` | Above-grade living area | Finished living space square footage counted "above grade" in the county's rules. | Not the same as "Zillow heated sqft"; cite county definition if available. |
| `Basement/Garden lvl` | Basement or garden level sqft | Square footage counted for basement/garden-level area under county rules. | |
| `Finish Bsmt/Grdn lvl` | Finished basement/garden sqft | The finished portion of that lower level the county counted. | |
| `Walkout Basement` | Walkout basement sqft | Walkout basement area counted, if applicable. | |
| `Attached Garage` | Attached garage sqft | Garage area attached to the home. | |
| `Detached Garage` | Detached garage sqft | Separate garage structure area. | |
| `Open Porch` | Open porch sqft | Open porch area counted. | |
| `Deck/Terrace` | Deck or terrace sqft | Deck/terrace area counted. | |
| `Total Bath Count` | Bathrooms | Total bathrooms using the county's counting rules (may include half baths as fractions). | If decimals appear, explain half baths plainly. |
| `Fireplaces` | Fireplaces | Count of fireplaces the county captured for modeling. | |
| `2nd Residence` | Second residence flag | County flag for a second-home style classification when applicable. | Do not infer tax or legal status beyond what the notice says. |
| `Regression Valuation` | Model-based value indication | A value indication produced by the county's statistical model for that row (not a private AVM website). | Pair with "methodology on `/sources`" when we have a cite. |
| `VALUATION` | Valuation section | A section header for the dollar reconciliation part of the grid. | Usually not something residents "use" beyond orientation. |
| `SALE DATE` | Sale date | The date of the sale event the county used for that comparable (contract/deed date per county practice). | Parse carefully; show raw if ambiguous. |
| `Time Adj Sale Price` (valuation block) | Time-adjusted price (summary) | Second occurrence is still a time-adjusted price, but in the summary valuation area of the grid; treat as separate until proven identical semantics. | Confirm with multiple samples whether both rows always match. |
| `Adjusted Sale Price` | Adjusted comparable price | The comparable's price after the county's adjustment grid for differences vs your home. | Explain as county adjustment model output, not a quote of what you could sell for. |
| `ADJ MKT $` | Adjusted market value | Another county market-value indication after adjustments (as labeled). | Define relative to `Adjusted Sale Price` only after county definitions are cited. |

## Field mapping guidance (what "full map" means here)

For the **comps grid**, "full map" for v1 means: **every row label in the canonical list above**, plus the **six column headers**, with six cells each (masked cells normalized to null).

For the rest of the NOV (page 1 and narrative blocks), mapping remains **tiered** unless a product decision explicitly needs more:

- **Tier A (ship / trust):** fields that are clearly labeled, stable across samples, and either already in county exports or easy to validate (PIN, tax year, labeled totals that match other sources).
- **Tier B (show with citation):** values that are explicit but need page/table provenance (good for UI footnotes, not silent joins).
- **Tier C (do not auto-extract early):** freeform owner/agent blocks, signatures, long legal prose, anything that is easy to mis-read or that is not needed for the comps question.

**Process (repeat per document class):**

1. **Freeze inputs:** 2-3 real PDFs per class (redacted if needed). NOV != comps grid; keep separate tables below.
2. **Locate anchors:** fixed phrases / section headers / table edges (record **page + approximate region**, not raw PII).
3. **Define JSON keys first:** what the app or pipeline needs, not what the PDF happens to contain.
4. **Extractor contract:** for each key: source (table index vs regex vs bbox crop), normalization (dates, money), and **validation** (cross-check PIN length, tax year range, sums).
5. **Failure modes:** blank worksheet rows, wrapped addresses, embedded fonts, scanned pages (if any).

**What goes in this doc vs elsewhere:**

- Here: **method + progress log + non-PII structural stats** (counts, table sizes, strategies).
- Not here: a full dump of every label/value pair for a real parcel (that is PII / fork noise). If you need a full grid for debugging, keep it **local** or redact.

### Target doc A - `FileDownload.ashx` comps grid PDF (real goal)

Still **needs a direct sample** of the export. When available, duplicate the methodology from Target doc B, but expect different column widths and possibly different attribute ordering.

| JSON key (proposed) | User/job meaning | Tier | Where it lives in PDF (anchor) | Extraction approach | Validation |
| --- | --- | --- | --- | --- | --- |
| `parcel.pin` | Subject PIN | A | Row `PARCEL ID` / `Parcel Number` under `SUBJECT` | Column slice under `SUBJECT` header | 9-digit normalization; match input PIN when run as harness |
| `comps[]` | Up to five adjusted sales | B | Columns `SALE 1` ... `SALE 5` | Parse per-column vertical stacks; align rows by shared attribute labels | Row count parity across columns; dates parse; money fields parse |
| `comps[].saleDate` | Contract / deed date (as printed) | B | Rows under `SALE DATE` | Same | Date sanity vs stated tax year context |
| `comps[].adjustedSalePrice` | County-adjusted price column | B | Near `Adjusted Sale Price` / `ADJ MKT $` region | Same | Monotonic checks only if business rule exists; else cite-only |

### Target doc B - NOV PDF (current local sample)

Focus on **page 2 grid** if the near-term goal is comps extraction practice.

| JSON key (proposed) | User/job meaning | Tier | Where it lives in PDF (anchor) | Extraction approach | Validation |
| --- | --- | --- | --- | --- | --- |
| `grid.columns` | Column order + labels | A | `SUBJECT`, `SALE 1` ... `SALE 5` | Header row scan | Exactly six columns in order |
| `grid.rows` | All canonical row labels | A | See **Canonical comps grid row labels** | Align cells into six x-bands keyed by left label | Every canonical label present (or explicitly null row with reason) |
| `grid.cells[label][column]` | Typed cell objects | A | Intersection of label row and column band | Geometry-first; parse per canonical table | Always includes `raw_text`, `parsed`, `parse_ok`, optional `parse_note` |
| `grid.maskSentinel` | Asterisk placeholder runs | C | Cells that visually read blank | Treat `*************` as null | Ensure not confused with literal `0` |

## What we already inspected (text-level)

Using editor/text extraction (not geometric layout): header includes tax year, tax area, PIN, AIN; body includes appeal / comparable sale worksheet language. **No coordinates or table geometry** from that pass.

## Layout tooling (when an agent runs it)

`pdfplumber` is listed in `tools/requirements.txt` and imports from project `.venv`.

**Rule:** do not paste owner names, addresses, or full page text into this doc or chat. Summaries only (counts, page sizes, table dimensions, font stats, redacted bbox samples).

Suggested probe (first 1-3 pages, metadata only):

```bash
cd /path/to/metro-tax-lookup
source .venv/bin/activate
python3 <<'PY'
import time
import pdfplumber
from pathlib import Path

path = Path("supporting-data/_private/Traditional-Notice-of-Valuation-656.pdf")
t0 = time.perf_counter()
with pdfplumber.open(path) as pdf:
    print("pages", len(pdf.pages))
    for i, page in enumerate(pdf.pages[:3], start=1):
        w, h = float(page.width), float(page.height)
        chars = page.chars or []
        lines = page.lines or []
        rects = page.rects or []
        curves = page.curves or []
        print(f"\n--- page {i} --- size {w:.1f}x{h:.1f}")
        print(
            f"chars={len(chars)} lines={len(lines)} rects={len(rects)} curves={len(curves)}"
        )
        t_tbl = time.perf_counter()
        tables = page.extract_tables(
            table_settings={
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
                "intersection_tolerance": 3,
            }
        ) or []
        print(f"tables={len(tables)} ({time.perf_counter() - t_tbl:.2f}s)")
        for ti, t in enumerate(tables[:3], start=1):
            rows = len(t)
            cols = max((len(r) for r in t if r), default=0)
            nonempty = sum(1 for r in t for c in r if (c or "").strip())
            print(f"  table{ti}: rows={rows} max_cols={cols} nonempty_cells={nonempty}")

print(f"total_elapsed_s={time.perf_counter() - t0:.2f}")
PY
```

If `extract_tables()` is slow or hangs on a page, skip that page or bound work (single page, timeout, write stats to stderr).

## Findings log (append only)

| Date (local) | Agent / human | What we tried | Result (no PII) | Next step |
| --- | --- | --- | --- | --- |
| 2026-04-30 | - | Confirmed app comps URL + AIN pipeline | Comps link is `FileDownload.ashx?AIN=`; NOV sample is different PDF class | Obtain real comps grid PDF when county site is up; then run layout probe on that file |
| 2026-04-30 | - | `pdfplumber` probe (lines table strategy), first 3 pages | **2 pages** total. Page 1: 1224x792, chars=5323, lines=36, rects=19; `extract_tables` found **2** tables (1x3 grid, then 6x9 grid, 22 nonempty cells). Page 2: 1224x792, chars=3860, lines=1, rects=14; **0** tables. Full run ~0.2s. | Re-run same probe on a real `FileDownload.ashx` comps grid PDF when available; compare table counts and line/rect density |
| 2026-04-30 | Human review | Read NOV page 2 structure | Confirms **six-column** comps matrix: subject + five sales; long attribute list; masked cells present | Implement page-2 parser using anchors + x-band column slicing; validate on additional NOV PDFs and on `FileDownload.ashx` export when site returns |
| 2026-04-30 | Human review | NOV page 2 comps grid screenshot (local sample; not pasted here) | **Layout:** row labels plus subject + five sale columns; shaded label/subject strip; asterisk bands under headers and around **DWELLING** / **VALUATION** (supports geometry-first parse, not line-table extraction). **Parsing:** valuation block money may include **comma thousands separators**; upper attribute rows often plain integers; **`0` is common real data** (do not treat as null by default). **`ADJ MKT $`** can be **filled only under subject** with sale cells visually blank; still emit **six slots** with empty `raw_text` / null `parsed` as needed. **Risk:** long street names can be **multi-token or clipped** in a column; join tokens per x-band, do not assume one word per cell. | Fold these rules into parser tests and money normalizers; re-check after first real `FileDownload.ashx` PDF |
| 2026-05-01 | Agent | Implemented `tools/parse_arapahoe_nov_comps_grid.py` + `tools/nov_comps_grid_definitions.json` + unit tests | Offline extractor emits six slots per canonical row (`grid.rows`), merges dual-track definitions when JSON present, documents masked asterisk handling + limitations in payload. Validated locally against `_private` NOV sample (counts only in repo notes). | Compare layout against real `FileDownload.ashx` comps PDF when county export is available; widen parcel-id normalization only after corpus proof |

## Cleanup

When the scraper path is clear or abandoned: delete this file. Keep `supporting-data/_private/` gitignored for future local samples unless you deliberately decide otherwise.
