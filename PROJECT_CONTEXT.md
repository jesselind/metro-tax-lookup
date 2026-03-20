## Project Context: metro-tax-lookup

### TL;DR / Current MVP Contract

- **Audience**: Any Arapahoe County voter, including an 80-year-old with minimal tech experience.
- **v1 scope**: Single-page, mobile-first web app with **no maps or GIS**; users manually enter numbers from their official tax statement.
- **Core question**: “What percentage of my property taxes is paying for metropolitan district debt service?”
- **Inputs**: Two values from the county tax statement (total property tax rate / mills and metro district debt service rate / mills).
- **Computation**: Show the exact formula and values used: `percentage = (metroDebt / totalTax) * 100`, with the concrete numbers visible beside the result.
- **Auditability**: Provide a step-by-step “verify this yourself” checklist so any voter can re-trace the steps on the county site and reproduce the exact same result.
- **Explanations**: Use inline tooltips/popovers for every key term (e.g., “metro district”, “debt service”, “tax rate”), backed by a shared glossary so the user never has to leave the main page to understand labels.
- **Constraints**: No database; rely on static data + official public sources; keep the UI simple, high-contrast, and accessible with a single light theme; meet at least WCAG 2.1 AA; avoid scraping or fragile reverse-engineered APIs; do not automate county/assessor/treasurer web forms.

This document captures the living context for the **metro-tax-lookup** project.  
Goal: a simple public web portal where anyone in **Arapahoe County, Colorado** can:

- Enter their address
- Get guided to their **official tax statement**
- Enter a couple of numbers (or have them auto-detected in later versions)
- See **what percentage of their property taxes goes to metropolitan district debt service**
- Learn **what that means** and why some structures are controversial in Colorado (including ongoing litigation and policy debate), even when operating within the law

This file is meant to:

- **A)** Get AI agents (and humans) quickly up to speed on the project
- **B)** Serve as a **living design/context doc** that survives chat resets

**Conventions:** Never use smart quotes or smart apostrophes (curly " " ' '). Use only straight ASCII quotes and apostrophes (`"` and `'`, U+0022 and U+0027) in this doc, in code, and in UI copy. Smart quotes cause encoding and search/replace issues and inconsistent display.

---

## 1. High-Level Vision

- **Problem**: Metro districts in Colorado, especially in places like Arapahoe County, can impose major debt service mill levies on homeowners. The structure (e.g., master / subordinate districts) is opaque and hard for normal residents to interpret.
- **Goal**: A web portal that answers a simple question:
  - **“What percentage of my property taxes is paying for metropolitan district debt service?”**
- **Audience**: Any property owner or resident in **Arapahoe County** (and possibly later, other CO counties).
- **Constraints**:
  - No scraping or fragile reverse-engineered APIs.
  - Rely on **official public data** and **manual user input** where needed.
  - **No database** for the core MVP; static data + client-side logic is preferred.

---

## 2. Core User Flow

### v1 (MVP – implemented first)

The initial v1 portal should support this end-to-end flow, **without any maps or GIS**:

**Path A: I have my paper bill**

1. **Bill in hand**
   - User indicates they have their mailed tax bill.
   - App shows annotated sample images of the bill, highlighting:
     - Where to find the **total property tax rate / mills** (or total tax amount).
     - Where to find the **metro district debt service** line(s), if any.
2. **User types numbers from paper**
   - User reads two values from their own bill and types:
     - **Total property tax rate / mills** (or total amount, if we later support that variant).
     - **Metro district debt service rate / mills** (or total metro debt amount, possibly summed across multiple lines).

**Path B: I need to look it up online**

1. **Open parcel search (same tab)**
   - App explains: “We’ll send you to the county’s property search; when you’re done, tap Back to return here.”
   - Big button opens the **Arapahoe County Parcel Search**:
     - `https://www.arapahoeco.gov/your_county/county_departments/assessor/property_search/search_residential_commercial_ag_and_vacant.php`
   - User uses the **By Address** search to find their parcel and opens it.
2. **View Tax District Levies**
   - On the parcel page, user taps the **Tax District Levies** link.
   - They see:
     - **Total mills** (e.g. 106.202 or 152.984).
     - A list of taxing authorities, including any metro districts and their mills.
   - Optional: user can also open Treasurer pages or PDF tax statements if they prefer, but the levies table is primary.
3. **Return to the app and type numbers**
   - User taps browser **Back** to return to metro-tax-lookup (no multi-tab juggling assumed).
   - App prompts:
     - “Total property tax rate (mills)” – the **Total** value from the levies page.
     - “Metro district debt service rate (mills)” – for v1, user types the debt-service-only mills based on guided instructions (later, v2 can pre-fill from curated data).

**Shared steps (both paths)**

4. **Calculator**
   - User enters:
     - `totalMillLevy`
     - `metroDebtMillLevy`
   - App computes:
     - \(\text{percentage} = \frac{\text{metroDebtMillLevy}{\text{totalMillLevy}} \times 100\)
   - Output:
     - Percentage rounded to 0.1%.
     - Explanation string in plain language.
     - Context + disclaimers.
5. **Education**
   - Explain in simple language:
     - What a metro district is.
     - What “debt service” is.
     - That some district structures (master / subordinate) can lead to layered debt.
     - That not all districts are problematic, but some are.
6. **Verify yourself**
   - A checklist that restates the steps above so any voter can:
     - Go to the county site (or look at their bill).
     - Find the same numbers.
     - Plug them into the formula and reproduce the result.

This v1 works **without** any automatic GIS boundary lookups, maps, county APIs, or automated form submission. It’s simple, accurate (because it uses the **user’s actual bill or county-provided numbers**), and legally clean.

---

## 3. Technology Choices & Rationale

### 3.1 Web Stack (front/back)

- **Framework**: Next.js (modern App Router).
- **Language**: TypeScript.
- **UI**: Tailwind CSS with semantic HTML and a single, high-contrast light theme.

For later versions (v2+), we may add:

- **Maps**: Leaflet + React bindings, if/when we introduce GIS features.
- **GIS / Geometry**: @turf/turf (e.g., `booleanPointInPolygon`) for client-side point-in-polygon.
- **Component / icon libraries**: shadcn/ui, lucide-react, or similar, for richer reusable UI patterns and icons.

These additional tools should only be introduced if:

- The v1 single-page manual calculator is stable, accessible (WCAG 2.1 AA), and easy to use for non-technical voters.
- There is a clear, voter-centered use case that cannot be met with simple Tailwind/HTML alone (e.g., visualizing approximate parcel location, highlighting a detected metro district, or presenting more complex multi-section layouts).
- The added complexity does not compromise performance, clarity, or auditability of the core calculation flow.
- For shadcn/ui and lucide-react specifically:
  - The UI has grown to the point where repeated patterns (cards, accordions, dialogs, complex forms) are becoming hard to maintain by hand with raw Tailwind.
  - We see clear benefit from standardized, well-tested components/icons (consistency, a11y) that outweighs the overhead of additional files and configuration.

Reasons **not** to use Python / Django / FastAPI here:

- This is primarily an **interactive front-end** and light orchestration problem, not a heavy backend/data pipeline.
- The user’s strongest skillset is TS/JS, which minimizes ramp-up.
- Next.js + Vercel = very low ops overhead and quick iteration.
- GIS and some data munging can be done client-side or as **one-time offline prep** (QGIS, mapshaper, etc.) if/when we add that layer.

### 3.2 Hosting & Ops

- **Hosting**: Vercel (free tier is more than enough).
- No database.
- Static assets (JSON, GeoJSON) in `/public/data` if/when GIS or levy JSON are added.
- Optional server actions later if we need server-side geocoding or rate-limiting.

---

## 4. Architecture Sketch

Suggested project structure (Next.js App Router with `src/`):

- `src/app/`
  - `page.tsx` – main landing page / single-page experience.
  - `layout.tsx`, `globals.css`, etc.
- `src/components/`
  - `DebtCalculator.tsx` – input fields + percentage display.
  - `BillReaderGuide.tsx` – how-to-read-tax-statement guidance.
  - `VerifySteps.tsx` – “how we got this number / verify yourself” flow.
  - `GlossaryTooltip.tsx` – inline tooltip/popover component backed by glossary data.
- `src/lib/`
  - `levyCalculator.ts` – core percentage logic (see below).
  - (Later) `geocoding.ts`, `districtLookup.ts` when GIS is introduced.
- `src/data/`
  - `glossary.json` – shared glossary entries for tooltips/popovers.
- `supporting-data/`
  - `dlmetro` – DOLA metro district boundaries (raw download).
  - `Mill Levy Public Information Form.pdf` – Arapahoe County Mill Levy Public Information (C.R.S. 39-1-125(1)(c)), Tax Year 2025 / Budget Year 2026. This is the **source of truth** for per-LGID, per-purpose mill rates (operations vs debt service). Not the Assessor; levy certification data is published by the county (Treasurer/Budget side).
  - `metro-levies-2026.json` – normalized levy data derived from the PDF above. Schema: `year`, `source`, `districts[]` (each with `districtId`, `countyId`, `lgid`, `subdistrict`, `name`, `type`, `levies[]`, `aggregates`: `opsMills`, `debtMills`, `otherMills`, `totalMills`, `audit`). Indexes: `byLgid`, `byName`. Generated by `tools/extract_metro_levies_2026.py`; do not hand-edit.
  - `metro-levies-2026-raw.json` – audit dump of every text line extracted from the PDF (page + line text) for traceability.
- `tools/`
  - `extract_metro_levies_2026.py` – offline Python script that **line-parses** the Mill Levy Public Information PDF (no table extraction; pdfplumber multi-line headers break `extract_tables`). Reads `page.extract_text()`, tokenizes each line, maps tokens to known columns (county ID, LGID, name, purpose, rates, Y/N flags), classifies purpose (operations / debt_service / other), and writes `metro-levies-2026.json` plus `metro-levies-2026-raw.json`. Run: `python3 tools/extract_metro_levies_2026.py --pdf "supporting-data/Mill Levy Public Information Form.pdf" --out "supporting-data/metro-levies-2026.json"`.
  - `requirements.txt` – Python deps for the script (`pdfplumber`; pandas removed – line-based parser only).
- `public/data/`
  - `metro-levies-2026.json` – copy of the normalized levy file used by the app. The app reads `aggregates.debtMills` and `aggregates.totalMills` per district. **Units**: JSON stores mill *rates* (decimal, e.g. 0.118956); the app and county display *mills* (e.g. 118.956). When pre-filling or computing total district share, the app multiplies by 1000 (RATE_TO_MILLS). Optional UI: checkbox "I know my neighborhood district's name" reveals a custom dropdown (not native `<select>`) to pick a metro; selection pre-fills debt mills and enables showing both debt % and total district % (operations + debt) in the result. Update when re-running the extractor.
  - (Later, v2+) `metro-districts.geojson` – metro boundaries (from DOLA or county GIS).

### 4.1 Core Calculator Logic

Core function (in `src/lib/levyCalculator.ts`):

```ts
export function calculateSharePercentage(
  totalMillLevy: number,
  numeratorMillLevy: number
): { percentage: number } {
  const safeTotal = Number.isFinite(totalMillLevy) ? totalMillLevy : 0;
  const safeNumerator = Number.isFinite(numeratorMillLevy)
    ? numeratorMillLevy
    : 0;
  const percentage =
    safeTotal > 0
      ? Math.round((safeNumerator / safeTotal) * 1000) / 10
      : 0;
  return { percentage };
}
```

The UI calls this for metro debt share and for metro total share (operations + debt), using the same rounding rule.

---

## 5. Data Sources & Strategy

### 5.1 Official County Data (Arapahoe)

Key resources (exact URLs evolve; keep this conceptual):

- **Assessor property search (primary entry for the app)**:
  - **Arapahoe County – Search Residential, Commercial, Ag and Vacant** (where voters start):
    - `https://www.arapahoeco.gov/your_county/county_departments/assessor/property_search/search_residential_commercial_ag_and_vacant.php`
  - From a parcel’s page, users can reach:
    - Mill levy / **Tax District Levies** view (showing each taxing authority and its mills, plus the total).
    - Links back to Treasurer/tax-payment information if needed.
  - For metro-tax-lookup, this is the **primary way** users find:
    - The **total mill levy** for their property.
    - Whether any metro districts appear in their tax district list.
- **Property / tax search (Treasurer, secondary)**:
  - **Search Property Tax Information** page with multiple options, including **Search by Address**:
    - `https://www.arapahoeco.gov/your_county/county_departments/treasurer/property_tax_information/search_property_tax_information.php`
  - Useful for:
    - Seeing **Total Tax Rate** and payment breakdowns.
    - Accessing the printable tax statement PDF (for dollar amounts).
  - For metro-tax-lookup, this is secondary/confirmatory; the parcel search + Tax District Levies page is more directly useful for our rate-based calculation.

In addition, the county and state reference general education material about how Colorado property taxes work, for example:

- State Department of Property Taxation “Understanding Property Taxes in Colorado” page:
  - `https://dpt.colorado.gov/understanding-property-taxes-in-colorado`
  - Useful for educational links and glossary content, but not used directly for per‑parcel calculations.

#### Example: parcel not in a metro district

Example A (anonymized): a parcel that is not in a metro district.

1. **Search by address on the Treasurer’s site**
   - Go to the **Search Property Tax Information** page (URL above).
   - Use the **Search by Address** option and enter the street number and street name (and unit, if applicable).
   - Open the matching record.
2. **On the main tax info page**
   - The page shows a **“Total Tax Rate”** field, e.g. `0.106202`.
   - This corresponds to a **total mill levy** of `106.202` (as seen on assessor information).
   - For v1, this is the value the user will supply as **Total property tax rate (mills)**.
3. **View the tax statement**
   - From this page, links such as **“Original Tax Statement”** or **“View Printable Tax Statement”** open the detailed tax bill PDF.
   - The PDF lists each taxing authority, its tax rate, and dollar amount. In this example, the authorities include:
     - LITTLETON SCHOOL DIST # 6 – 0.065193 – 2,536.59
     - ARAPAHOE COUNTY – 0.015959 – 550.50
     - CITY OF LITTLETON – 0.002000 – 68.99
     - DEVELOPMENTAL DISABILITY – 0.001000 – 34.49
     - S SUBURBAN PARK & REC – 0.008800 – 303.54
     - SMFR FIRE PROTECTION DISTRICT – 0.012250 – 422.55
     - URBAN DRAINAGE & FLOOD – 0.000900 – 31.04
     - URBN DRNGE&FLD (S PLATTE) – 0.000100 – 3.45
   - The subtotal line shows:
     - Sub Total rate: `0.106202`
     - Sub Total amount: `3,951.15`
4. **View the mill levy breakdown**
   - From the Treasurer page or assessor link, the **Tax District Levies** view for the same parcel shows:
     - Total mills: `106.2020000000`
     - A table of taxing authorities and their mill levies, matching the PDF.
   - In this specific example, **there are no metro district taxing authorities listed** at all.

Interpretation for the app:

- **Total property tax rate (mills)** = `106.202`.
- **Metro district debt service rate (mills)** = `0` (because there are no metro district lines on the levy table or tax bill).
- The app should compute a result of **0%** metro district debt service share and explain that:
  - No metropolitan district debt service charges appear on the user’s tax statement for this parcel.
  - Therefore, none of the property taxes for this property go to repaying metro district debt.

#### Example: parcel in a metro district (rate known, debt split later)

Example B (anonymized): a parcel that is in a metro district.

- **2025 Mill Levy**: `152.984`
- **2025 Tax Levies for Taxing Authority 1779**:
  - 0501 – Cherry Crk School Dist 5 – `54.1080000000`
  - 2998 – Arapahoe County – `15.9590000000`
  - 2999 – Developmental Disability – `01.0000000000`
  - 3001 – City Of Aurora – `07.0870000000`
  - 4026 – Arapahoe Library District – `05.7190000000`
  - 4131 – Cherry Creek Basin Auth – `00.4500000000`
  - 4528 – Regional Transportation – `00.0000000000`
  - 4712 – Urban Drainage & Flood – `00.9000000000`
  - 4713 – Urbn Drnge&Fld (S Platte) – `00.1000000000`
  - 4744 – W. Arap. Conservation Dis – `00.0000000000`
  - 4745 – [Example metro district] – `67.6610000000`
  - **Total**: `152.9840000000` mills.

Interpretation for the app:

- **Total property tax rate (mills)** = `152.984`.
- This parcel is clearly in a metro district (combined metro levy shown above is `67.661` mills).
- For a simple “metro district share of taxes” calculation, we could treat:
  - `metroDistrictMillLevy = 67.661`.
  - Share of all taxes going to the metro district (operations + debt) would be `67.661 / 152.984`.
- However, the app’s primary goal is to isolate **debt service mills** (not total metro mills). That split (operations vs debt service) does **not** appear in this parcel-level levy table and must be obtained from:
  - Annual levy certification PDFs and/or metro district filings that separate operations and debt service.
- Therefore, for v1:
  - The user will still enter the **total tax rate** and **metro district debt service rate** manually, based on guidance and (later) pre-filled values from curated levy JSON.
  - This example confirms that metro district rates are visible at the parcel level, but the debt-service-only portion requires additional curated data.
- **Tax statement**:
  - Detailed “Original Tax Statement” or equivalent PDF/HTML with:
    - All taxing entities.
    - Separate lines for **operations** vs **debt service** (for metro districts).
- **Mill levy data (per-LGID, ops vs debt)**:
  - **Source**: Arapahoe County **Mill Levy Public Information** form (C.R.S. 39-1-125(1)(c)), e.g. `supporting-data/Mill Levy Public Information Form.pdf` for Tax Year 2025 / Budget Year 2026. This is published by the county (Treasurer/Budget side), not the Assessor. The **Assessor Data FTP** (e.g. `https://gis.arapahoegov.com/assessordataexport/`) provides parcel and TAG tables but **not** per-authority mill levy rates or ops/debt splits; those come only from the levy certification / Mill Levy Public Information documents.
  - **Extraction**: The PDF has multi-line column headers, so `pdfplumber.extract_tables()` does not yield usable columns. The project uses a **line-based parser** in `tools/extract_metro_levies_2026.py`: `extract_text()` per page, split into lines, tokenize each line, and map tokens to a fixed column order (county ID, LGID, name, purpose, rate, previous rate, revenue, flags, notes). Purpose is classified as operations / debt_service / other; district aggregates (`opsMills`, `debtMills`, `totalMills`) are computed with full audit trail to source line. Output: `metro-levies-2026.json` (normalized) and `metro-levies-2026-raw.json` (raw lines). Data must be 100% auditable and traceable to the PDF; no guessing.

Use in the app:

- v1:
  - Just link users to the tax search and explain how to find mill levies and metro debt.
  - They manually enter numbers.
- v2:
  - Parse a single annual PDF (offline) into a `metro-debt-levies-YYYY.json` mapping:
    - `"District Name or LGID" -> { debtMills: number, ... }`.
  - When a district is auto-detected (see GIS section), pre-fill debt service value.

### 5.2 State-Level GIS (DOLA)

State resource:

- DOLA (Colorado Department of Local Affairs) hosts a state-wide special districts map and associated data.
- There is a **downloadable shapefile** (e.g., `dlmetro.zip`) that includes:
  - Polygon boundaries for metro districts.
  - Attributes: district name, LGID, type, contacts, and sometimes levy snapshots.

Use in the app:

- One-time process:
  - Download shapefile.
  - Convert to GeoJSON via:
    - QGIS, or
    - mapshaper.org, or
    - a small Node script.
  - Filter to Arapahoe County if desired.
  - Simplify geometries a bit to keep the file small.
  - Save to `public/data/metro-districts.geojson`.
- At runtime:
  - Geocode address → lat/lng.
  - Use Turf (`booleanPointInPolygon`) to find intersecting metro polys.
  - Map district(s) to levy JSON by name or LGID.

### 5.3 Optional Local GIS (County)

- Arapahoe County GIS / mapping portal may offer:
  - Parcel boundaries.
  - Special district / taxing district layers.
- These could be used as:
  - Another source of shapes.
  - Validation for DOLA data.

This is nice-to-have; the DOLA dataset is enough to ship v2.

---

## 6. Versions & Feature Roadmap

### 6.1 v1 – Manual Calculator + Guide (No Auto GIS)

**Scope:**

- Clear links to official Arapahoe tax search.
- A calculator that takes:
  - Total property tax rate / mills.
  - Metro district debt service rate / mills.
- Simple percentage output + explanation, showing the exact formula and numbers used.
- Educational content:
  - What metro districts are.
  - What debt service is.
  - How to read the tax statement and find the needed numbers.
  - Neutral discussion of **master / subordinate** structures.
- A “verify this yourself” section that walks users through reproducing the result from the county site.
- Disclaimer footer:
  - Not affiliated with Arapahoe County.
  - Uses public data.
  - Always verify with official sources.

**Why this is important:**

- 100% accurate as long as users follow directions.
- No dependence on experimental GIS logic or fragile data pipelines.
- Fully static client app, easy to maintain.
- Makes no automated calls to county/assessor/treasurer HTML endpoints; users drive the county UIs, the app explains and computes.

### 6.2 v2 – GIS Auto-Detect (Client-Side)

**Additional capabilities:**

- Address geocode + map.
- Use GeoJSON boundaries + Turf to:
  - Determine which metro district(s) the property lies in.
- Use static JSON (from levy certifications) to:
  - Pre-fill **metro debt mill levy**.
- Possible UI:
  - “Detect My Metro District” button.
  - Or automatically run detection on address selection.

**Caveats:**

- Still can’t auto-fetch **total** mills per parcel; these vary by overlapping jurisdictions.
- App still needs user to enter total mills from their bill (or total tax amount if we add logic for that).

### 6.3 v3 – Hierarchies & Education (Master / Subordinate)

**Goal:**

- Educate users about:
  - Master districts.
  - Subdistricts or included districts.
  - How combined mill levies can stack.

**Data handling:**

- Extend levy JSON entries to include:
  - `type`: `"standalone" | "master" | "subdistrict"`, etc.
  - `subdistricts`: list of subordinate names (if master).
  - Optional `notes` field with neutral explanations.
- These relationships may come from:
  - Reading county certification PDFs.
  - District websites.
  - DOLA records.
  - Known examples like Reunion (Adams County) for context (even if not directly in Arapahoe).

**UI ideas:**

- If a master district is detected:
  - Show a clear hierarchical breakdown:
    - Primary / master district name + debt mills.
    - Subdistricts + their debt mills.
    - Combined total vs. total parcel mills.
- An accordion “About Metro District Structures”:
  - Neutral, factual explanation of:
    - Master-subordinate/inclusion structures.
    - That some structures can centralize control in small geographic areas (sometimes literally tiny master districts).
    - That not all metro districts are problematic.
  - Example: Reunion in Adams County as an illustrative case (not accusatory, but descriptive).

**Purpose:**

- Help users understand how legally valid arrangements can still be controversial or feel unfair.
- Put numeric results in a broader policy/structural context.

---

## 7. QGIS & Offline Data Prep

QGIS is **not** required for runtime, but is very useful for one-time prep.

### 7.1 Use Cases

- Convert DOLA shapefiles to GeoJSON.
- Filter statewide data to Arapahoe County only.
- Simplify complex polygons.
- Sanity-check boundaries visually.

### 7.2 Example Workflow

1. Download `dlmetro.zip` (DOLA metro districts shapefile).
2. In QGIS:
   - Add vector layer from the shapefile.
   - Filter by county (if attribute or shape available) or clip to Arapahoe boundary.
   - (Optional) Simplify geometry to reduce file size.
   - Export layer as GeoJSON (EPSG:4326).
3. Copy resulting `metro-districts-arapahoe.geojson` into `public/data/metro-districts.geojson`.
4. Commit to repo.

This is usually a **15–30 minute** one-time setup.

---

## 8. Disclaimers & Tone

Guiding principles:

- **Neutral, factual** descriptions of metro districts, even when discussing controversial structures.
- Make clear:
  - This is an **independent tool**, not affiliated with Arapahoe County or any district.
  - It uses **publicly available data** and user-provided information.
  - Final authority on taxes and levies is always the **official county sources**.
- Avoid:
  - Legal conclusions or accusations.
  - Overstating the precision of estimates, especially in auto-detect features.

---

## 9. Open Questions / Future Notes

Use this section to append new context over time.

- How frequently should levy JSON be updated?
  - Likely once per year when new Certifications of Levies are published.
- How do we handle partial or ambiguous GIS matches?
  - E.g., overlapping polygons, data disagreements between DOLA and county.
- Should the tool expand beyond Arapahoe County?
  - State-wide support might be possible using DOLA as the base, but county-level levy extraction would be needed.
- Are there specific Arapahoe metro districts with Reunion-style master/subordinate structures that we should highlight (carefully) in examples?

### Working notes (keep this short)

- v1: **Single-page, manual-only calculator** (no maps/GIS). Plain-language copy (e.g. "neighborhood district," "What share of your property tax pays off neighborhood debt?"). Primary link: **Assessor property search** (Search Residential, Commercial, Ag and Vacant) – voter types address, opens property; **2025 Mill Levy** on that page is the first number. Second number: district dropdown if they know the name (app pre-fills debt from JSON) or 0. Expandable "Show where to find the mill levy" has tappable screenshot `src/assets/images/mill-levy-property-page.png`. Result shows debt %; when a district is selected, also **total district %** (ops + debt) from JSON.
- **Levy data (current)**: `metro-levies-2026.json` from Mill Levy Public Information PDF via line-based extractor. 192 districts, 118 metro. JSON stores rates (decimal); app uses mills (x1000). Typed with `LevyDistrictFromJson`. Copy in `public/data/metro-levies-2026.json`.
- **Policy pages + footer**:
  - Footer includes links (opened in a new tab) to **Accessibility**, **Privacy**, and **Sources**, plus a disclaimer: not affiliated with Arapahoe County; informational only; verify with official county sources; not legal/tax advice.
  - Accessibility contact email: `metro.tax.lookup@pm.me`.
  - Privacy policy is explicit: no tracking/analytics, no cookies, and no saving inputs in the browser (local/session storage).
- **Sources page**: `/sources` lists the original county PDFs and explicitly distinguishes:
  - Source of truth used to generate the dropdown JSON: **Mill Levy Public Information Form**.
  - Supporting references (not used to generate the app's JSON): **Taxing District Levy Percentage** and **Certification of Levies and Revenues**.
- Defer GIS/auto-detect until v1 is stable.

Add new bullets here as the project evolves so that future sessions have a single, authoritative place to rehydrate context.

