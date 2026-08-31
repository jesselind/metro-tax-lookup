# County config (multi-county app model)

Permanent maintainer reference. Ephemeral phase checklists stay in gitignored `docs/_working/` and are deleted when the initiative ships; **this file stays**.

Companion: **[county-service-gap-callouts.md](./county-service-gap-callouts.md)** (COUNTY DATA GAP UI chrome). Build inputs: **[county-build-inputs.md](./county-build-inputs.md)**. Ingest ship path: **[county-ingest.md](./county-ingest.md)**.

## Goal

One frontend. Each wired county is a row in `src/lib/countyConfig.ts` (`COUNTY_CONFIG_BY_ID`) plus `{countyId}-*` JSON under `public/data/`. Lookup resolves the county; the UI loads that county’s files and **only that county’s honest holes**.

Do **not** treat Arapahoe’s gaps, fields, or methodology text as the default for every county. A third county may share nothing with Arapahoe or Douglas except the shared app shell.

## Three layers (do not collapse them)

| Layer | What it answers | Where it lives | Example |
| --- | --- | --- | --- |
| **1. County sources (product)** | Does this county have this *kind* of source at all? | `CountyConfig.features` (and URL templates) | `compsPdf: false` → omit Comparable properties control. `situs: false` → address search stays on screen but id-only path (`situsSearchOffMessage`). |
| **2. County data failures (gap chrome)** | We have (or tried) a source and the county export/hosting failed the taxpayer in a way we must name. | Opt-in gap flags on `features` + `knownFailures` for hosting failures on an existing source | `priorYearValuesGap: true` → Prior years missing. `dataMartRefreshGap: true` → Assessor Data Mart incomplete refresh. `compsPdf` + `knownFailures.compsPdfHostedFiles` → comps tile COUNTY DATA GAP. |
| **3. Runtime field presence** | Does *this loaded parcel* have a value for a row? | Bundled JSON / parcel-record shards | No owner string → omit that meta row. No assessed total → omit Assessed value chip. |

**Layer 3 is not Layer 2.** Missing a field on one account is ordinary sparse data. COUNTY DATA GAP is a **county-level incident** we intentionally opt into, with dashboard + `/sources` copy that states what we tried and what is still missing.

**Layer 2 is not Layer 1.** “Never had comps PDFs” → omit (`features.compsPdf` false). “Had comps PDFs; county FileDownload is broken” → show gap (`features.compsPdf` true + `knownFailures.compsPdfHostedFiles`).

## County search gate (locked 2026-08-29; UX refined 2026-08-29)

Multi-county situs / account indexes are large. Do **not** prefetch every wired county on first address focus once two or more counties ship.

**Three tiers** (bandwidth preference — **not** proof of residence):

1. **County selected** — default **Arapahoe** (campaign home). Address search is usable immediately. Prefetch + search that county only on engage (**lazy** — do not eager-fetch on first paint; protect FCP).
2. **Adjacent auto-try** — on address miss in the selected county, try only `adjacentCountyIds` that are wired and situs-enabled (shared border / metro adjacency; curated on each `CountyConfig`). Never alphabetical / registry key order.
3. **I don’t know my county** — explicit third option; probe all situs-enabled wired counties; resident accepts the wait.

**Always** show load/search progress for **every** scoped load (including Arapahoe alone) — file-level when the set of JSON files is known. Silent multi-second waits are not acceptable.

**UI (two wired counties today):** Label **Select your Colorado county** above a compact light-gray segment **Arapahoe | Douglas | ?** (custom radiogroup; not native radio dots; not Own | Rent black/white weight). Segment labels use at least `text-base` (16px). Visible “?” has accessible name **I don't know my county**. Default Arapahoe. When many counties ship, reconsider a select.

**Layout (2026-08-30; Try demo on row 2026-08-30):**

| Viewport | County toggle + address row + Try demo |
| --- | --- |
| **&lt; lg** | Stack vertically. County segment spans **full width** of the lookup column; three options share the bar evenly. Address + Search use the existing `md` form grid (street beside Search from `md` up). **Try demo property** is its own full-width row under that cluster. |
| **lg+** | Same row (`lg:flex-row lg:items-end`): county segment **content-width**, address form, Search, **Try demo property**. County options sized to label text (`lg:flex-none`), not equal columns. Option horizontal padding **doubles** on this row (`lg:px-8` vs `px-4` when stacked). |

County segment, street input, Search, and Try demo share **48px** height (`box-border h-12`). Labels share `HOME_ADDRESS_LOOKUP_LABEL_CLASS` (`text-sm font-medium text-slate-800 mb-1`).

**CSS (maintainer):** `src/app/globals.css` `@layer components`:

| Class | Role |
| --- | --- |
| `.home-address-lookup-input` | Street / advanced address fields |
| `.home-address-lookup-search` | Search button (primary chrome inlined; not `@apply btn-primary`) |
| `.home-address-lookup-demo` | Try demo property (outline; full width stacked, content-width on `lg+`) |
| `.home-address-lookup-county-segment` | Radiogroup shell (`w-full` stacked; `lg:w-auto` on row) |
| `.home-address-lookup-county-option` | Segment option buttons |

TSX uses string tokens from `src/lib/toolFlowStyles.ts` (`HOME_ADDRESS_LOOKUP_*`). Tailwind v4 `@apply` in these rules must reference **utilities only** — nesting `@apply` of another component class fails PostCSS in dev and build.

Coverage of wired counties is the county segment (and the footer). Do not restore a "Supported Colorado counties … More coming." box on the lookup screen.

**Dev compile (local `next dev`):** `Ready` in ~2s is normal. First compile of `/` after start is often **20–30s** (large client graph: `HomeParcelAddressLookup` + imports). **`globals.css` hot reload** should stay fast after the content-scan limit below.

Causes of slow first compile (unchanged):

1. `layout.tsx` imports `globals.css` → Turbopack invalidates from the app root.
2. Tailwind v4 runs the full PostCSS pipeline on every `globals.css` change (`@apply` expansion, utility generation).
3. Runtime index prefetch on address focus is a separate cost from CSS compile.

**Tailwind content scan (applied 2026-08-30):** `src/app/globals.css` imports Tailwind with `source("../")` so class detection walks **`src/` only**, not committed `public/data/` JSON shards (~8,800+ files). Without that limit, every `globals.css` save walked those data files and hot reload took ~10–15s.

```css
@import "tailwindcss" source("../");
```

From `src/app/globals.css`, `../` is `src/` — where all `className` usage lives. Production CSS output is unchanged; this is a dev scan scope fix.

Residents can pick the wrong county. Selected county is search order / prefetch scope, not sole ground truth. Account-id path uses the same preferred order (selected → adjacent among format matches; or all format matches when “I don’t know”).

When adding county N: set `adjacentCountyIds` to real neighbors among wired counties only; leave empty until neighbors ship.

## Opt-in rule (locked)

Gap callouts and Arapahoe-specific (or Douglas-specific) methodology claims are **opt-in per `CountyConfig`**. Sparse is OK. Wrong gap copy is not.

When wiring county N:

1. Start with gap flags **false** and product flags only for sources you actually ship.
2. Turn on a gap flag only when you have **county-true** incident copy (what we tried, what failed, dated extract if any).
3. Never leave always-on Arapahoe chrome in shared dashboard JSX. Gate with `countyFeatureAvailable` / `countyFeaturePresentation` and the active county config after resolve.
4. Do not invent tax/assessment years or valuation trends from statute alone. Do not scrape county SPAs for bulk history.

Production JSON for a live county **must be committed** under `public/data/` (gitignore is for local prove-out only).

## Hosted property page (URL + label)

Do **not** hard-code Arapahoe `PPINum.aspx?…` or Douglas `#/details/…` in components. Use `CountyConfig`:

| Field | Purpose |
| --- | --- |
| `hostedPropertyPageName` | Resident phrase for the county page (`parcel record`, `property details`). Button: `countyHostedPropertyPageOpenLabel` → “Open county …”. |
| `urls.parcelRecord` | Deep-link template. **`query`** (default): `https://{host}{path}?{queryParam}={id}`. **`hashPath`**: `https://{host}{path}#{hashPathTemplate}` with `{id}` and optional `{year}` (year on the template is a maintainer stamp for that SPA path / data drop — update when the county URL year changes; do not invent from statute). |

Builder: `safeCountyParcelRecordUrl(id, config, { year? })` in `src/lib/safeExternalHref.ts`. Lookup id: `countyParcelRecordLookupValue` (public parcel id when `publicParcelId` is set; otherwise account id).

Compare card heading uses `displayName`: “See how {displayName} displays your data.” Button open label: `countyHostedPropertyPageOpenLabel(config)`.

## `CountyFeatures` today

Defined in `src/lib/countyConfig.ts`. Extend the type when a new product source or gap incident is real; do not overload an unrelated flag.

| Flag | Role |
| --- | --- |
| `situs` | Address index / situs search source |
| `parcelRecordShards` | Lazy `{countyId}-parcel-record-by-pin` Property details shards |
| `compsPdf` | County comps PDF product |
| `bpp` | Business personal property URLs / UI |
| `millsHistory` | Authority mills-over-time product |
| `metroPurposes` | Metro purpose-row product |
| `priorYearValuesGap` | COUNTY DATA GAP: no bulk prior-year assessed story for this county |
| `dataMartRefreshGap` | COUNTY DATA GAP: Assessor Data Mart incomplete-refresh note (Arapahoe-shaped export only) |
| `millPdfTaxDistrictGap` | COUNTY DATA GAP: mill PDF missing some tax-district numbers |

`countyFeaturePresentation(feature, config)` → `omit` | `show` | `gap` (comps uses `knownFailures.compsPdfHostedFiles` for `gap`).

Hub bullets for `/sources` are built by `listCountyServiceGapHubItems(config)` in `src/content/countyServiceGapGuidance.ts` from these flags. Adding a gap: new flag (if needed) → incident copy module → dashboard surface → contextual `/sources` box → hub registration. Checklist: **[county-service-gap-callouts.md](./county-service-gap-callouts.md)**.

## Dashboard

After lookup resolves a county, use `countyConfigById(resolvedCountyId)` (not a global Arapahoe default) for feature and gap gates. Home search may still default UI copy to Arapahoe until resolve; post-resolve chrome must follow the loaded county.

When **two or more** counties are wired, search surfaces show which county matched: `CountyScopeTopLine` on typeahead / did-you-mean / multi-match chooser rows; the dashboard Address tile appends `· {displayName}` after the locked address headline. Single-county deploys omit that chrome (`showCountyScopeTopLine()`).

## `/sources`

- **County selector** at the top (`SourcesCountyGate`): wired counties from `wiredCountyConfigs()`. Default Arapahoe. No dashboard→sources county query required for v1.
- **Gap hub** (`#county-service-gaps`) lists only the selected county’s opt-in gaps.
- **Methodology** for the selected county must not read as universal. Shared Colorado / metro / code sections may stay shared when they are actually shared.

### Growth (do not copy-paste a county page)

Do **not** grow by duplicating the entire Arapahoe “Your property tax bill” article for each new county and hoping gaps match.

**Target shape:**

1. **Config** — identifiers, URLs, `features`, `knownFailures` (Layer 1–2).
2. **Content modules** — per-incident gap notes and per-county methodology blocks under `src/content/` (or a small registry keyed by `countyId`), not a second copy of `src/app/sources/page.tsx`.
3. **Shared shell** — selector, hub builder, COUNTY DATA GAP chrome, shared Colorado sections.
4. **Data** — `{countyId}-*` JSON; Layer 3 omit/show from actual values.

**Current code:** Arapahoe and Douglas methodology still live as two large sections passed into `SourcesCountyGate` via `sectionsByCountyId`. That is a **transitional layout**, not the multi-county content model. When adding county 3, extract shared prose and register a county content module; do not fork the whole Arapahoe section “just in case” it has the same gaps (it will not).

## Adding a county (checklist)

1. **Inventory** — `docs/county-build-inputs.md` + ingest Go/No-go; what bulk tables and mill sources exist.
2. **Config** — new `CountyConfig` in `countyConfig.ts`; validate; register in `COUNTY_CONFIG_BY_ID`. Product flags only for sources you ship. Gap flags default **false**. Set `adjacentCountyIds` for wired neighbors (county search gate).
3. **JSON** — `{countyId}-*` under `public/data/` (committed for live counties).
4. **UI** — confirm dashboard gates use active county config; no Arapahoe-only callouts with flags off. Search gate / prefetch respects selected county → adjacent → “I don’t know.”
5. **Gaps** — only after a county-true story: copy module + both surfaces + hub item + flag on for that county only.
6. **`/sources`** — county content module + selector entry; hub follows flags. Do not paste another county’s Data Mart / prior-year / comps story.
7. **Ship** — commit production JSON; drop local-only gitignore lines for that county’s app files.

## Anti-patterns to avoid

- Always-on COUNTY DATA GAP JSX that assumes Arapahoe (or Douglas) for every resolve.
- `if (countyId === "douglas")` sprawl for ordinary feature gates (use config flags).
- Reusing another county’s gap copy because “we need something red.”
- Treating Layer 3 empty fields (or “we do not ship this field yet”) as COUNTY DATA GAP. Omit the row; do not invent a red incident.
- Shipping a county without committed `public/data/` JSON.
- Copy-pasting methodology pages as the plan for county N.
- Prefetching every wired county’s situs / pin / levy on focus once multi-county ships (use the county search gate).
- Probing counties in alphabetical or registry-key order instead of selected → `adjacentCountyIds`.
- Treating the county picker as sole ground truth with no adjacent / “I don’t know” escape.

## App JSON loaders (Phase 10)

Shipping filenames stay **`{countyId}-*`** under `public/data/` (for example `arapahoe-pin-to-tag.json`, `douglas-pin-to-tag.json`). URL builders: `src/lib/countyDataPaths.ts`.

| Module | Role |
| --- | --- |
| `countyParcelLevyData.ts` | Levy stacks, account map, parcel-record shard types + `fetchCounty*` loaders |
| `situsIndexLookup.ts` | Situs index types + address normalization + `fetchCountySitusToPinsJson` |
| `countySitusLookup.ts` | Multi-county situs/account probe (search gate, adjacent try) |
| `arapahoeParcelLevyData.ts` | **Deprecated** re-export barrel → `countyParcelLevyData.ts` |
| `arapahoeSitusLookup.ts` | **Deprecated** re-export barrel → `situsIndexLookup.ts` |

**Ship gate:** `src/lib/countyLoaderContract.test.ts` — every wired county keeps `{countyId}-*` paths; fetch loaders hit the same URLs as `countyDataPaths`; deprecated shims alias the same functions.

## Related code

| Piece | Path |
| --- | --- |
| Config + flags | `src/lib/countyConfig.ts` |
| Search scope helpers | `src/lib/countySearchScope.ts` |
| Home lookup row control CSS | `src/app/globals.css` (`.home-address-lookup-*`) |
| Choose-your-county UI | `src/components/CountySearchScopeSwitch.tsx` |
| Config tests / hub list tests | `src/lib/countyConfig.test.ts` |
| Gap hub builder + anchors | `src/content/countyServiceGapGuidance.ts` |
| `/sources` selector | `src/components/SourcesCountyGate.tsx` |
| `/sources` page | `src/app/sources/page.tsx` |
| Dashboard gates | `src/components/HomeParcelAddressLookup.tsx` |
| Data paths | `src/lib/countyDataPaths.ts` |
| App JSON loaders | `src/lib/countyParcelLevyData.ts`, `src/lib/situsIndexLookup.ts` |
| Loader ship gate (tests) | `src/lib/countyLoaderContract.test.ts` |
| Deprecated loader barrels | `src/lib/arapahoeParcelLevyData.ts`, `src/lib/arapahoeSitusLookup.ts` |
