// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Release notes for `/changelog` (footer version link). Hand-written highlights
 * only - do not paste raw commit subjects. Newest first. When you bump
 * `package.json` version, add a matching entry here (unit test enforces the
 * current version appears).
 *
 * Audience: contributors, forkers, and anyone tracking what shipped. Prefer
 * accurate technical takeaways over resident-softened marketing. Entries are
 * drawn from `package.json` version bumps and related commits in git history.
 */

export type ChangelogEntry = {
  /** Semver matching a shipped `package.json` version. */
  version: string;
  /** Calendar date the version shipped (YYYY-MM-DD, America/Denver). */
  date: string;
  /** One-line technical takeaway for contributors and forkers. */
  title: string;
  /** Short bullets: what changed for someone using the tool. */
  highlights: string[];
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "5.9.0",
    date: "2026-09-05",
    title: "Douglas valuation history + levy per-year dollars (Phase 15)",
    highlights: [
      "Douglas valuation history from build-time Realware detail JSON retain (not live fetch): tools/fetch_douglas_realware_detail.py, tools/extract_douglas_valuation_history.py, stamp tools/douglas-realware-detail-stamp.txt, ship npm run build:douglas-valuation-history:ship to public/data/douglas-valuation-history-by-account/. Optional --validate-meta-count compares extracted accounts to meta totalAccountsProcessed (full retain ritual).",
      "Assessed value and Actual value summary tiles open ValuationHistoryDialog (YoY box, tax-impact line, SVG chart, collapsible table). Property details: View valuation history link only. Douglas priorYearValuesInProgress off; valuationHistoryShards on.",
      "resolveParcelSummaryYears: Douglas Assessment year / Tax year summary tiles use hashPath maintainer stamp (SPA path year), levy-stack snapshot tax year, and Realware valuation-history latest taxYear for outbound property-page links when loaded. Arapahoe unchanged (mart columns on pin-to-tag). Douglas /sources documents year provenance.",
      "levyDollarAssessedContext: per-year assessed from valuation-history shards plus loaded parcel current year. Levy YoY dollars use per-year assessed when history has the prior tax year; theoretical plus today's assessed footnote when not (Arapahoe).",
      "AuthorityMillsHistoryChart: footer mills row, ledger rule, then dollars (larger type) or Prior years missing badge when features.priorYearValuesGap and oldest endpoint lacks assessed. Badge reuses CountyPriorYearValuesGapPopover (same panel as Assessed value tile). Flag-driven, not county-hardcoded.",
      "ValuationHistoryDialog: bottom scroll padding; See data in table form scrolls the table into view. Unit: levyDollarAssessedContext, valuationHistoryYoY, authorityMillsChartFooter, parcelSummaryYears. e2e: douglas-county-search valuation modal + year tiles; metro-yoy chart gap badge.",
      "Fix: mill-chart / levy dollar context keys parcel assessed to bill tax year (not assessment year) so Arapahoe current-year dollars show beside Prior years missing. Gap badge requires newest endpoint dollars.",
    ],
  },
  {
    version: "5.8.0",
    date: "2026-09-04",
    title: "Douglas prior-year IN PROGRESS chrome (sky Coming soon)",
    highlights: [
      "Reusable IN PROGRESS chrome (sky, not red COUNTY DATA GAP): InProgressBadge, InProgressHeader, InProgressCallout, InfoHintPopover variant in-progress, toolFlowStyles tokens. Calendar icon; panel title IN PROGRESS.",
      "Douglas priorYearValuesGap off; priorYearValuesInProgress on. Assessed value shows a Coming soon badge (not Prior years missing). Popover: working to get prior-year assessed values onto this site soon; property-page link when loaded. Custom Reports / $50 copy removed from resident and /sources surfaces.",
      "/sources Douglas Property details: sky IN PROGRESS callout (#county-prior-year-values-in-progress), not the gap hub. YoY dollar footnote uses the same still-looking / still-working tone. Arapahoe prior-year COUNTY DATA GAP unchanged.",
      "Config: priorYearValuesGap and priorYearValuesInProgress mutually exclusive. docs/county-config.md + docs/county-service-gap-callouts.md. Playwright Douglas e2e updated (e2e/douglas-county-search.spec.ts).",
    ],
  },
  {
    version: "5.7.0",
    date: "2026-09-04",
    title: "/sources methodology content modules (Phase 14)",
    highlights: [
      "Arapahoe and Douglas /sources methodology moved out of src/app/sources/page.tsx into src/content/sourcesMethodology/ (per-county modules + one registry with one entry per county). page.tsx is the shared shell (intro, SourcesCountyGate wiring, Code).",
      "One SOURCES_COUNTY_CONTENT_MODULES entry per county: methodologyNav, optional extraNav, Methodology, and AfterGap (function or explicit null). Builders: buildSourcesNavByCountyId, buildSourcesSectionsByCountyId, buildSourcesAfterGapByCountyId. Client gate receives navByCountyId so methodology JSX stays off the client graph.",
      "Page intro and metadata county list come from formatWiredCountyNamesForSourcesIntro(wiredCountyConfigs()) so county 3 does not require a hand-edited string.",
      "Unit gate: registry.test.ts (every wired county registered; AfterGap explicit; nav/section/after-gap maps agree). docs/county-config.md includes the /sources county N ritual.",
    ],
  },
  {
    version: "5.6.0",
    date: "2026-09-04",
    title: "Douglas Playwright e2e + prior-year COUNTY DATA GAP (Phase 13)",
    highlights: [
      "Dashboard and levy-dialog Sources links pass ?county= for the active / resident county so /sources opens on that methodology (SourcesCountyGate initialCountyId from searchParams; sourcesPageHref helper).",
      "Playwright: Douglas account-id and address resolve, adjacent auto-try after Arapahoe miss, I don't know my county unique resolve, Douglas See Sources preselect, and Douglas Prior years missing badge (chromium/firefox/webkit). Spec: e2e/douglas-county-search.spec.ts. Synthetic Douglas fixtures; emptySitusCompanionCountyId for miss/hit pairs.",
      "Douglas priorYearValuesGap on: Prior years missing badge on Assessed value with Douglas COUNTY DATA GAP copy that points residents to this property's Assessor property details (history is there) and notes a bulk download does not appear available for this site. File names and Assessor Custom Reports ($50/hr, text-fragment link to the Real Estate Data Center heading) stay on /sources. Arapahoe keeps assessor guidance that the public site has no bulk prior-year assessed. /sources hub + Property details red box 1:1 for both counties.",
      "YoY dollar footnote (today's assessed value): same Douglas resident tone (property-page link when loaded; no .txt or fee copy). Arapahoe footnote unchanged.",
      "Dashboard accuracy mailto secondary: notes we are constantly updating and making corrections to this app.",
      "docs/county-config.md: Dashboard→sources county query is shipped (no longer Phase 13 deferral).",
    ],
  },
  {
    version: "5.5.0",
    date: "2026-09-02",
    title: "District directory includes Douglas stack LGIDs (Phase 12)",
    highlights: [
      "colorado-special-district-directory.json is filtered to the union of LGIDs on Arapahoe and Douglas levy stacks (was Arapahoe-only). Douglas levy lines with a DOLA LG ID can show the same Contact block as Arapahoe.",
      "build:district-directory defaults to both county stack files; repeatable --certifying-county defaults to Arapahoe and Douglas for Property Tax Entities name-only fallback. npm run test:district-directory covers the multi-county filter.",
      "/sources: Arapahoe contact methodology names shipping counties; Douglas methodology matches levy detail Contact behavior (stack LG ID strongest; name match or DOLA entity data when no directory row).",
    ],
  },
  {
    version: "5.4.0",
    date: "2026-09-02",
    title: "Douglas mill history from Tax Districts and Mill Levies PDFs",
    highlights: [
      "Douglas ships public/data/douglas-authority-mills-by-tax-year.json and douglas-authority-rate-table-pages.json (Tax Years 2020–2025). Extract: tools/extract_douglas_authority_mills_by_tax_year.py from the Assessor Tax Districts and Mill Levies PDFs (same format as levy stacks). CountyConfig.features.millsHistory is on.",
      "Levy tiles, mill-over-time charts, and authority-chain What changed? use the Douglas AUTH series for Douglas residents (SMFR 4014 9.29 → 12.25 in 2024–2025). Rate-table cites are douglasco.gov mill PDFs, not Arapahoe Levy % files. Hub 2021 PDF is unversioned tax-districts-mill-levies.pdf.",
      "/sources lists each bundled mill-history PDF (Douglas Tax Districts and Mill Levies; Arapahoe Levy Percentage years) so residents can open the same county files the chart cites.",
      "/sources County=Douglas no longer shows Arapahoe metro / Related county PDFs (Levy Percentage, Mill Levy Public Information Form); those stay behind afterGapByCountyId for Arapahoe. Douglas On this page links to Mill history.",
      "Removed Douglas SMFR open gap no-resident-county-mills-history. Entity-stack reconciliation remains only for counties that still lack a mills bundle.",
    ],
  },
  {
    version: "5.3.1",
    date: "2026-09-02",
    title: "Statewide DOLA tax-entities refresh + registry lgId (Phase 11c)",
    highlights: [
      "Tracked supporting-data/dola/property-tax-entities-export.csv replaced with a statewide Property Tax Entities export (2026-09-02). Arapahoe certifying-row mills unchanged on anchor entities (SMFR, UDFCD, county); npm run test:ingest includes mill-anchor safeguards before future CSV swaps.",
      "cross-county-authority-registry.json: lgId backfill on SMFR (64108), UDFCD main (64147), and UDFCD South Platte (64174) from DOLA joins. Line-code mapping unchanged.",
      "Docs: README, docs/county-build-inputs.md, /sources, and dataSourceUrls.ts document DOLA export ritual (certifying county only; do not filter by local government type). Shipped Arapahoe levy JSON unchanged this release; rebuild optional when mart refreshes.",
    ],
  },
  {
    version: "5.3.0",
    date: "2026-08-31",
    title: "Cross-county authority registry + Douglas DOLA stack join (Phase 11)",
    highlights: [
      "Runtime registry public/data/cross-county-authority-registry.json maps one logical district to per-county AUTH codes (SMFR, UDFCD main, UDFCD South Platte). Authority chain resolves through findLevyAuthorityChainEntry with match.registryId; AUTH mills history and YoY use resolveAuthorityMillsLookup for the resident county when that county ships a mills bundle. Registry-linked shared entities use reference-county prior-year mills for Changed/tile YoY only when resident stack mills reconcile to the entity current year (numbers only; no cross-county Levy % PDF cites).",
      "Maintainer stack: tools/wired-counties.json, build_cross_county_authority_matches.py (DOLA Tax Entity ID + matchStatus), tools/cross_county_authority_overrides.json, tools/cross-county-authority-matches.json. Architecture: docs/cross-county-authorities.md.",
      "Phase 11b: Douglas ingest runs DOLA tax-entity join on stack lines (removed --skip-dola-join). County mill PDF wins when DOLA total disagrees; Douglas stacks relanded with stack-embedded dolaMatch (Tax Entity ID + lgId).",
      "SMFR authority-chain closed summary uses neutral certified-election attribution for cross-county residents (summarySource on south-metro-fire-authority-chain). Registry-linked entries use countyOverlays in levy-authority-chain-entries.json so shared trails stay county-neutral with per-county notes, tax-list names, and open gaps (Douglas SMFR no longer shows Arapahoe-only ballot-notice NOTE). Resident UI uses each county's own mills bundle only (no cross-county Levy % fallback). E2e covers registry-linked AUTH codes on Arapahoe and Douglas.",
    ],
  },
  {
    version: "5.2.0",
    date: "2026-08-30",
    title: "County-neutral loader modules with compatibility shims (Phase 10)",
    highlights: [
      "Canonical loaders: countyParcelLevyData.ts and situsIndexLookup.ts (County* types, fetchCounty* helpers). Deprecated arapahoeParcelLevyData.ts / arapahoeSitusLookup.ts remain as re-export barrels for forks.",
      "Shipping JSON paths unchanged ({countyId}-* under /data/). countyLoaderContract.test.ts is the Phase 10 ship gate: wired-county URL contract, fetch URL alignment, shim identity, and validator paths.",
      "countyHeavyDataPathnames() now lists heavy /data/ paths for every wired county (Douglas indexes included in rate-limit tier). README and county-config.md document loader modules.",
    ],
  },
  {
    version: "5.1.0",
    date: "2026-08-28",
    title: "Douglas multi-county lookup + parcel-record shards (Phase 9/9b/9c)",
    highlights: [
      "Douglas County loads beside Arapahoe by account id and street address (no env county switch). Ingest uses Assessor Property_Location + Property_Values (sum join) and the tax-district mill PDF; situs comes from the location file. Shipping JSON under public/data/douglas-* is committed with this release.",
      "Phase 9c: douglas-parcel-record-by-pin shards join Ownership / Location legal / Improvements / Subdivision / Sales / Filing (+ optional Hub parcels CSV) into the same Property details shape as Arapahoe. Enrichments: values land lines, lot/block/tract, filing, composite neighborhood code, sales grantor/grantee. Alphanumeric 8-char account ids use path-safe shard prefixes. features.parcelRecordShards is on for Douglas.",
      "Multi-county UI: when two or more counties are wired, search typeahead, did-you-mean streets, and multi-match chooser rows show the county display name; the dashboard Address tile shows address · County Name.",
      "Dashboard follows the resolved county: Ownership fills account-map ownerList for Owner of record tiles; LevyCountyCompareSection / parcel-record / levy links take CountyConfig; footer and pin-lookup help list wired counties from COUNTY_CONFIG_BY_ID (not Arapahoe-only hardcodes).",
      "Honesty gates: COUNTY DATA GAP chrome is opt-in per CountyConfig (priorYearValuesGap, dataMartRefreshGap, millPdfTaxDistrictGap; comps via knownFailures). /sources has a county selector; hub and methodology follow the selected county. docs/county-config.md is the durable multi-county model.",
      "Hosted property page: urls.parcelRecord supports query or hashPath templates (Douglas #/details/{year}/{id}); hostedPropertyPageName drives Open county … button copy; compare heading uses displayName (See how {County} displays your data).",
      "Follow-up hardening: county-aware resident links, safer countyId / situs failure detail handling, account-id not-found candidates for letter counties, values-join account-id normalization, and Douglas validate:app-json CLI tests that do not depend on gitignored ingest-out dumps.",
      "County search gate (multi-county bandwidth): default Arapahoe with lazy situs/pin/levy prefetch on engage; adjacent wired counties auto-try on address miss (adjacentCountyIds, not alphabetical); \"?\" (I don't know my county) probes all situs-enabled counties. Visible load progress on every scoped fetch. Account-id lookup uses the same preferred order. docs/county-config.md; countySearchScope.ts + CountySearchScopeSwitch.",
      "Home lookup row: label Select your Colorado county; segment Arapahoe | Douglas | ?; Try demo property on the same 48px control row from lg up (stacked full-width below lg). Dropped the Supported Colorado counties availability box (footer still lists coverage). Control chrome: .home-address-lookup-* in globals.css + HOME_ADDRESS_LOOKUP_* in toolFlowStyles.ts. Start over keeps the county pick.",
      "Site footer: light slate-50 band (slightly darker than page white) with slate-800 body copy for contrast.",
      "Dev: Tailwind content scan limited to src/ (globals.css source(\"../\")) so public/data JSON shards are not walked on CSS hot reload.",
    ],
  },
  {
    version: "5.0.1",
    date: "2026-08-25",
    title: "Maintainer download lists; Douglas locked as county 2 (inventory Go)",
    highlights: [
      "docs/county-build-inputs.md lists hubs, last-known file URLs, and local save paths for Colorado shared (DOLA), Arapahoe, Douglas, and parked El Paso. Root README and docs/county-ingest.md link there. Large dumps stay gitignored.",
      "Phase 8 inventory Go: Douglas Assessor Property_Location.txt + Property_Values.txt (headerless) plus the tax-district mill PDF can fill required app JSON shapes (account map + levy stacks). Tax_District_No joins PDF tax district ids (4-digit zero-pad). Phase 9 still needs mapping + headerless text reader + mill-PDF stack reader; the live app remains Arapahoe-only.",
      "El Paso published dumps stay parked (no tax-area stacks under above-board policy). No scraper / property-search API harvest.",
    ],
  },
  {
    version: "5.0.0",
    date: "2026-08-24",
    title: "Arapahoe shipping JSON now built by engine v2 (atomic ship-from-new)",
    highlights: [
      "Canonical Arapahoe rebuild is npm run build:ingest:ship: raw mart/GIS/DOLA inputs through tools/ingest/ into staging, IDENTICAL gate vs live public/data/, then atomic land of Arapahoe files only (levy stacks, pin-to-tag, situs, parcel-record shards). Metro-levies, directory, explainers, and authority mills are untouched by ship.",
      "Committed public/data/ Arapahoe JSON now carries snapshot.source new ingest (mapping: arapahoe). Bill data matched the prior v1 tree on IDENTICAL compare (snapshot metadata excluded). npm run build:arapahoe-index remains for emergency v1 rebuild / rollback.",
      "Ship refuses mid-run writes under public/: staging must not be a symlink; ship_preflight (mart stamp + clean git status public/data/) runs at start and immediately before land; multi-target land restores on failure. Post-cutover mart refresh may pass --ship-allow-diff (skips pre-swap IDENTICAL only).",
      "Comparison builds stay npm run build:ingest → supporting-data/_ingest-out/ (no --ship). Prove-out and docs: docs/county-ingest.md. Phase 6.5 dual-root UI path (public/data-engine-v2 symlink + COUNTY_DATA_ENGINE=v2) is retired; shipping /data/ is engine v2.",
    ],
  },
  {
    version: "4.15.1",
    date: "2026-08-24",
    title: "Typeahead place caption omits condo unit; Real+BPP gate shared with chooser",
    highlights: [
      "Multi-PIN place suggestions no longer show a single condo unit (e.g. Unit J01) when the tap still opens Matching properties for every account at that street.",
      "Shared Real+BPP helper (same pin-to-tag enrich as the chooser) locks Broadway-style Real + business personal property places so typeahead sample labels stay unchanged; unit-suffix strip is secondary for all-Real multi only.",
      "Matching properties: Real+BPP places still sort by actual value within kind; all-Real multi (condo units) sort by address label so units read in order.",
      "Typeahead and Search reuse the existing pin-to-tag fetch cache (prefetch with situs); no ingest or county-engine v2 changes.",
    ],
  },
  {
    version: "4.15.0",
    date: "2026-08-23",
    title: "County-agnostic static data paths for shipping JSON",
    highlights: [
      "Static county JSON URLs resolve from COUNTY_CONFIG.id via src/lib/countyDataPaths.ts (`{dataRoot}/{countyId}-*`). Shipping stays `/data/`; loaders accept an optional dataRoot and cache per root.",
      "Local v2 UI sanity check: flip COUNTY_DATA_ENGINE_SETTING in src/lib/countyDataEngine.ts (or NEXT_PUBLIC_COUNTY_DATA_ENGINE=v2 in .env.local) and symlink public/data-engine-v2 to supporting-data/_ingest-out. Disk parity remains npm run diff:ingest.",
      "Validator APP_JSON_* paths and rate-limit HEAVY_DATA_PATHS derive from the same helpers. Engines stay separate: no write to public/data/ from ingest; no ship-from-new in this release.",
    ],
  },
  {
    version: "4.14.0",
    date: "2026-08-22",
    title: "Two-engine ingest architecture proved; shipping rebuild unchanged",
    highlights: [
      "Locked model: the shipping Arapahoe rebuild (npm run build:arapahoe-index to public/data/) and the new ingest engine (tools/ingest/, npm run build:ingest to supporting-data/_ingest-out/) stay separate. No cross-imports, no retargeting the old script, no deleting v1. Writing shipping JSON from ingest is an explicit later cutover, not this release.",
      "Arapahoe backend prove-out (Phase 6): the same supporting-data mart/GIS/DOLA inputs through engine v2 reproduce committed public/data/ (levy stacks, account map, situs, parcel-record shards, dolaMatch). npm run diff:ingest -- public/data supporting-data/_ingest-out must exit IDENTICAL. Green CI does not substitute; parity is a local gate (CI has no mart CSVs).",
      "Engine v2 now emits situs, parcel-record shards, and DOLA mill join (dola_match.py; shared tools/arapahoe_dola_authority_overrides.json). compare.py includes dolaMatch; snapshot metadata remains the only documented compare skip.",
      "Prove-out safeguards: npm run validate:app-json -- --data-dir supporting-data/_ingest-out validates candidate output; --data-dir resolves with realpathSync and must stay inside the repo. Build and compare CLI tests refuse public/ out dirs. CI runs ci:test:ingest (classifier, reader/writer/compare, situs contract).",
      "Maintainer docs: docs/README.md (index) and docs/county-ingest.md (control vs candidate paths, compare semantics, prove-out procedure). Root README links there instead of inlining the ritual.",
      "Residents and forks: committed public/data/ and the live site behavior are unchanged until a future ship-from-new decision. npm install + npm run dev still use the same bundled JSON.",
    ],
  },
  {
    version: "4.13.0",
    date: "2026-08-18",
    title: "New ingest beside current Arapahoe rebuild (mapping file, reader, writer, compare)",
    highlights: [
      "tools/ingest/mappings/arapahoe.json maps Arapahoe Data Mart column names (TAGId, Pin, TotalActual, ...) to shared field names (taxAreaId, accountId, totalActual, ...). Shared reader and writer code has no Arapahoe column names.",
      "tools/ingest/reader.py reads a levy stack CSV and a parcel CSV through the mapping file and returns intermediate records. tools/ingest/writer.py converts those records to the app JSON shapes (levy stacks + account map) and writes them to a comparison directory; never writes to public/data/.",
      "tools/ingest/compare.py diffs two JSON directories (e.g. public/data vs supporting-data/_ingest-out). Excludes snapshot metadata (bundledAsOf, source) and dolaMatch from the diff so transient and phase-gated fields do not count as differences.",
      "npm run build:ingest (tools/ingest/build.py) runs the new ingest CLI. npm run diff:ingest (tools/ingest/compare.py) compares directories. Production rebuild stays npm run build:arapahoe-index. New ingest writes to supporting-data/_ingest-out/ (gitignored). Python tests: npm run test:ingest-reader (test_ingest_reader.py).",
    ],
  },
  {
    version: "4.12.0",
    date: "2026-08-18",
    title: "Ingest classifier for county drop folders",
    highlights: [
      "tools/ingest/classify.py inspects CSV/XLSX headers, PDF text samples, and GeoJSON/GDB field names. It prints a human report (or --json) with coverage ready / mapping-needed / new-reader / will-be-off. Missing a levy-stack source is a hard fail. Missing a comps PDF is optional (recommended compsPdf flag off). The classifier does not write app JSON or anything under public/.",
      "npm run test:ingest uses synthetic drop folders and invented headers (including a 10-digit schedule, not Pin/TAGId). Arapahoe-shaped mart + DOLA headers print ready for levy stacks, account map, situs, and shards. Production rebuild stays npm run build:arapahoe-index.",
    ],
  },
  {
    version: "4.11.0",
    date: "2026-08-18",
    title: "County config and feature-available flags",
    highlights: [
      "County config (src/lib/countyConfig.ts) holds identifier digit rules, URL templates, host allowlist, feature-available flags (situs, comps PDF, BPP, mills history, metro purposes), DOLA certifying-county filter, and known county-data failures. Arapahoe is the first county file. Campaign chrome stays in siteConfig.ts.",
      "URL builders read templates and the host allowlist from that config. Features a county never had are omitted; a known hosting failure still uses COUNTY DATA GAP (Arapahoe comps PDFs). Address search stays on screen when situs is off (id-only lookup). Vitest covers Arapahoe 9-digit PIN and a 10-digit schedule fixture with invented ids.",
    ],
  },
  {
    version: "4.10.0",
    date: "2026-08-18",
    title: "App JSON contract for the new ingest",
    highlights: [
      "App JSON contract: required levy stacks + account map, optional situs and metro purpose files, and compsPdf flag consistency (AIN-like field). Vitest uses invented ids. npm run validate:app-json (also in prebuild) checks shipping files exist and have the required root keys. pinDigits is county-specific (Arapahoe ships 9), not a Colorado standard.",
      "New ingest will live under tools/ingest/ and write to a comparison directory; production npm run build:arapahoe-index and public/data/arapahoe-*.json stay as they are until that comparison matches. Arapahoe is the first county the new ingest must reproduce.",
    ],
  },
  {
    version: "4.9.4",
    date: "2026-08-18",
    title: "Mill levy tile and prior-year values gap",
    highlights: [
      "Removed the amber Your property tax bill changed from last year banner and the Property tax change teaching chip/modal. Summary row adds a Mill levy chip (total mill levy, same wrap as Property tax) with a Changed badge only when that total moved. The chip jumps to mill levy tiles (nearest scroll + heading focus; short data-arrive ring on the mill levy tile grid; glossary popover stays on the label only). Face is mills plus Changed; no extra jump chevron next to mills. Property tax stays this year's dollar with no Changed badge. Actual value / Assessed value will get Changed when prior-year figures exist. Property details jump is full width at every viewport (min-h-11 tap floor). Summary chips on one wrap line stretch to the tallest (PARCEL_SUMMARY_ROW_CLASS items-stretch). Summary tile labels are text-xs at every viewport.",
      "Prior-year COUNTY DATA GAP sits as a red Prior years missing badge on Assessed value (white chip; CountyServiceGapBadge, same shape as Changed, light red fill and dark text, not red fill on the tile). The popover is the same InfoHintPopover as tile glossary briefs (width/scroll), with variant county-data-gap so the panel uses the COUNTY DATA GAP surface (thin red border + light red fill). COUNTY DATA GAP header and copy sit inside that panel: we tried to get prior-year values from the county and were unable to, an in-sentence Sale history jump to the parcel sale table, and an in-sentence Sources link. /sources states we searched published county and state sources, including the mart Main Parcel Table (current-year figures only). Header-to-copy gap is shared with the comps gap tile and other COUNTY DATA GAP callouts. County gap notes name the county file attempt, not this app's inability. Rent still shows Mill levy and levy tile Changed badges. Mill levy Changed uses the same levy-stack badge, including the up/down arrow for how the total moved. Own | Rent to content below uses the same vertical step as summary-tile wrap (HOME_AUDIENCE_STACK_GAP_CLASS). Dashboard tile glossary labels keep a question-mark-circle icon on the same line as the term, stretched to that label's line box. Levy stack intro: Select a mill levy tile for more details. Mill levy brief: one mill is $1 of tax per $1,000 of assessed value; the summary-chip popover adds a this-property example. Mill levy jump uses start scroll when the tile grid sits low in the viewport (stacked), nearest when tiles are already on screen.",
    ],
  },
  {
    version: "4.9.3",
    date: "2026-08-17",
    title: "County service gap callouts (COUNTY DATA GAP)",
    highlights: [
      "Shared county-gap chrome: CountyServiceGapCallout, CountyServiceGapHeader, and toolFlowStyles summary-tile classes. Distinct from InlineErrorCallout (county export/hosting limits, role=note, not app errors).",
      "Home dashboard: compact Data Mart refresh note under County data current as of; Comparable properties summary tile uses COUNTY DATA GAP framing when ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE is true.",
      "/sources: standalone When county data fails hub (jump-link index) plus matching contextual COUNTY DATA GAP boxes in Your property tax bill (comps PDF, Aug 17 Data Mart attempt, prior-year assessed limit). Your property tax bill section precedes Metro district tax share.",
      "Maintainer guide docs/county-service-gap-callouts.md and base-rule pointer: user-visible gaps ship dashboard + /sources (1:1 hub list to contextual red box). Demo bundledAsOf aligned to tools/county-mart-data-as-of.txt (2026-07-15).",
      "ESLint local/jsx-inline-prose-spacing (npm run lint; CI ESLint job) fails ambiguous newlines next to inline tags and Link. CodeRabbit defers to that rule instead of {\" \"} review sweeps.",
    ],
  },
  {
    version: "4.9.2",
    date: "2026-08-16",
    title: "Per-parcel neighborhood from Assessor Open GIS Parcels",
    highlights: [
      "Property details Neighborhood and Neighborhood Code now fill from the Assessor Open GIS Parcels layer (PIN join; code and name only into public JSON). Main Parcel CSV still has no NBHD column, and neighborhood is never inferred from subdivision name. PINs with no code, or with conflicting code/name rows in the export, keep the No data found empty state.",
      "build_arapahoe_parcel_levy_index.py reads the GDB via --gis-parcels-gdb and treats a missing GDB or zero-row join as a build error; --skip-neighborhood is the explicit opt-out. The download stamp comes from data-as-of.txt next to the GDB actually used and ships as snapshot.gisParcelsAsOf.",
      "Parcel-record shard requests carry ARAPAHOE_PARCEL_RECORD_CACHE_BUST so browsers do not serve a pre-neighborhood copy from the /data max-age cache. Try demo and synthetic e2e fixtures include fictional neighborhood name/code so Property details asserts the filled rows.",
    ],
  },
  {
    version: "4.9.1",
    date: "2026-08-16",
    title: "Fire authority chain, SMFR 7A trail, and property-specific rate-table PDF pages",
    highlights: [
      "New fire family for Who authorized this? (Voters + Ballot Issue + Arapahoe certified tallies; AUTH-derived What changed?). First entry: South Metro Fire Rescue AUTH 4100, Ballot Issue 7A (November 2025), with a closed-summary NOTE when the Arapahoe Notice PDF is not currently available and Douglas County's Notice carries the same 7A wording.",
      "County Levy % source links deep-link to the parcel tax-area page via arapahoe-authority-rate-table-pages.json (tax year + AUTH + TAG). Missing historical combinations open the year PDF at page 1 rather than inventing a page.",
      "Verified #page= fragments on remaining single-document cites (county 2025 budget, Sky Ranch 2026 budget whoGets, LPS 2020 Spanish sample 4C). Own-mode landing intro tightened to one line.",
    ],
  },
  {
    version: "4.9.0",
    date: "2026-08-15",
    title: "Metro authority chain: AUTH-derived rate changes and chronological trail",
    highlights: [
      "Metro Who authorized this? trails derive What changed? from the same county authority mill series as the history chart: always Change from last year, plus a separate Most notable change block when a larger year-to-year move exists (largest absolute adjacent move; more recent wins ties). No hand-authored metro mill numbers.",
      "Sky Ranch Metro District No. 3 (4571) reads chronologically: November 2020 elector authorization, December 2020 county service-plan support, then the August 2022 capital pledge to the community authority board, with approval evidence on each step instead of a trailing duplicate.",
      "Levy % PDF cites for those rate blocks come from the bundled AUTH mills data (one source of truth); non-consecutive published years are labeled as such.",
    ],
  },
  {
    version: "4.8.2",
    date: "2026-08-13",
    title: "BPP hides Rent; Switch account type is Real+BPP only",
    highlights: [
      "Own | Rent and Rent dashboard chrome are hidden on business personal property accounts; switching back to Real restores the prior lens.",
      "Dashboard Switch account type appears only when the situs mixes business personal property with another account kind (all-Real condo multi uses Matching properties only).",
      "Rent unknown-N / pending copy and the levy rent footnote say units / per-unit instead of homes; landing Rent invite adds Where's it going?",
    ],
  },
  {
    version: "4.8.1",
    date: "2026-08-12",
    title: "Python tooling docstrings on non-obvious helpers",
    highlights: [
      "Offline tools: useful module/function docstrings on the NOV comps parser, district directory/import helpers, parcel-index private builders, and related extract utilities (contracts and quirks, not wallpaper on trivial helpers).",
      "README contributor note: prefer that same bar for future `tools/*.py` changes.",
    ],
  },
  {
    version: "4.8.0",
    date: "2026-08-12",
    title: "Own / Rent audience lens with equal-split tax pressure",
    highlights: [
      "Home Own | Rent switch (default Own, aria-only Own or rent): same chrome on search and locked report; Start over resets to Own. Landing intro follows the lens (Own: bill hook; Rent: You're still paying property tax if you rent).",
      "Rent mode: colored pressure tiles (estimated /mo when N is known, all-tax /yr, unit count) with equal-split caveats; pierce heading on the report. N from land-line UB, duplex/triplex/fourplex, or single dwelling.",
      "Rent levy and metro dollars use the same per-unit share when N is known, shown as monthly /mo with rent-framed metro copy; Own keeps annual whole-account figures. No Add tile / levy line edit in Rent.",
      "Rent curation hides comps / BPP NOV / demo comps grid and the bill-impact banner, omits owner mailing rows, and collapses sale/building/land tables under a disclosure.",
    ],
  },
  {
    version: "4.7.3",
    date: "2026-08-12",
    title: "Dashboard tiles beside levies; unified property details; chooser row hits",
    highlights: [
      "Locked report: summary tiles sit beside the levy stack on large screens (content-sized chips wrap in the left column); a narrow Property details chip (jump control) precedes comps / Notice of Valuation; Property details is one full-width block below for Real and business personal property (no sidebar split).",
      "Multi-PIN chooser and Switch account type modal: whole-row hit targets; Real vs business personal property glossary once under the heading, not on each row.",
      "Parcel PIN or AIN panel stays unlocked-search / county-fallback only (never on a locked dashboard).",
    ],
  },
  {
    version: "4.7.2",
    date: "2026-08-11",
    title: "In-dashboard multi-account switcher modal",
    highlights: [
      "Multi-PIN situs: Switch account type is a salmon dashboard button (multi-account only) that opens a levy-style modal instead of unlocking the post-search chooser.",
      "Modal rows are full-row hit targets with Currently viewing on the active PIN; Real / business personal property kinds stay prominent with glossary briefs.",
      "Single-PIN properties omit the control; post-search Matching properties chooser is unchanged.",
    ],
  },
  {
    version: "4.7.1",
    date: "2026-08-09",
    title: "Business personal property dashboard and continuous property details",
    highlights: [
      "Business personal property accounts reuse the Real dashboard shell with a thin field set: hide comps, photo/sketch, ownership type, neighborhood/land use/subdivision, and sale/building/permit tables; keep levy stack, metro, and totals-only values.",
      "Summary Notice of Valuation PDF and county Details deep link use personalpropertysearch AIN URLs; assessed rows use the DPT personal-property rate by year (26% in 2026).",
      "Account type tile labels Real vs business personal property; multi-PIN situs makes the whole tile the Change account control. BPP values stay inline in the property column instead of below the levy grid.",
    ],
  },
  {
    version: "4.7.0",
    date: "2026-08-05",
    title: "Campaign disclosure connection, Open Graph share image, footer accuracy",
    highlights: [
      "Campaign disclosure: home outline control, footer sentence, Privacy external-links mention, and bottom \"Paid for by...\" line; all `campaign*` strings live in `src/lib/siteConfig.ts` and are marked FORK REQUIRED.",
      "Open Graph / Twitter large-image metadata with committed 1200x630 art (`src/assets/images/OG-image.png`); `metadataBase` / `SITE_CONFIG.siteOrigin` (override via `NEXT_PUBLIC_SITE_URL`).",
      "Footer accuracy copy: try to match published county/state figures, invite Contact when something looks wrong; Contact intro invites error reports.",
    ],
  },
  {
    version: "4.6.2",
    date: "2026-08-04",
    title: "E2E hardening and synthetic multi-PIN fixtures",
    highlights: [
      "Playwright: shared fill/search and district-details helpers; multi-PIN chooser asserts use listitem structure instead of CSS class or bounding-box geometry.",
      "Authority-chain panel UI cases no longer embed live source URL probes; one deduped HEAD/ranged-GET test covers curated cites so a flaky host does not look like a panel regression.",
      "Unit tests: replaced real hospital/Broadway PINs and owners with shared SYNTHETIC_MULTI_* IDs; README test-PII policy covers commercial parcels, not only homeowners.",
    ],
  },
  {
    version: "4.6.1",
    date: "2026-08-03",
    title: "Clearer assessed-rate labels, plus this Changelog page",
    highlights: [
      "Non-residential assessed rows only show a percent when the property class maps cleanly to the state chart (for example commercial or industrial). Exempt and other special classes no longer get a guessed 26%.",
      "Added this Changelog page so release notes stay in the app, not only in git history.",
    ],
  },
  {
    version: "4.6.0",
    date: "2026-08-03",
    title: "Shared-address account chooser and non-residential assessed values",
    highlights: [
      "When several tax accounts share one street address (for example a building plus business personal property), search shows one place first, then a list of every account with owner, Real vs business personal property, and value, so a large Real account is not hidden behind a look-alike address line.",
      "Assessed value display follows state use: residential keeps local and school rates; non-residential Real no longer shows the residential school assessed row or residential rate labels.",
      "Business personal property can appear in that chooser so Real accounts stay findable. A dedicated personal-property dashboard is still planned.",
    ],
  },
  {
    version: "4.5.8",
    date: "2026-08-03",
    title: "Spanish sample-ballot pattern and metro authority-chain pack",
    highlights: [
      "Littleton 4C: when Arapahoe election files only publish a Spanish sample ballot, link that official text, state findability plainly, and put AI-translated English in a nested disclosure with caveats; validation blocks measure detail without ballot text.",
      "Metro family pack for Sky Ranch; AI translation control styled as a toggle; /sources tracks unlocated election docs including the non-English sample pattern.",
    ],
  },
  {
    version: "4.5.7",
    date: "2026-07-31",
    title: "Authority-chain summary links and mill-history chart polish",
    highlights: [
      "Authority-chain summary: drop unsourced closer; bold/link Ballot Issue phrases from measure ballot-text sources; YoY Details control on the headline line.",
      "Mill rate over time: caption restored in-popover, then ship polish to a full-width descriptive heading with year-dot InfoHint popovers; AUTH YoY e2e asserts 2018 mills.",
    ],
  },
  {
    version: "4.5.6",
    date: "2026-07-30",
    title: "County authority-chain templates moved into JSON facts",
    highlights: [
      "Arapahoe County 1A story lives in entry JSON (mills body, titlePlain, summarySource) instead of hard-coded pack copy; TABOR and credit gaps use authority.governmentBillName.",
      "Validation for mills.bodyTerms and at most one tabor_revenue_retention measure; gaps disclosure renamed to \"What we can't say for sure\"; resident 1A/TABOR copy clarified.",
    ],
  },
  {
    version: "4.5.5",
    date: "2026-07-28",
    title: "Arapahoe County authority chain (AUTH 2998 / Ballot Issue 1A)",
    highlights: [
      "Injectable school/county template packs so the county temporary-discount trail can use plain language with TABOR glossary help.",
      "Authority-chain validation tightened on CodeRabbit follow-ups.",
    ],
  },
  {
    version: "4.5.4",
    date: "2026-07-28",
    title: "Littleton authority chain v2 with ballot-text fallback",
    highlights: [
      "Authority-chain entries move to structured v2 templates; AUTH 0601 ships.",
      "When ballot wording is missing, link the county file-library hub instead of a dead or Spanish-only PDF.",
    ],
  },
  {
    version: "4.5.3",
    date: "2026-07-28",
    title: "Typeahead stays open when the mobile keyboard dismisses",
    highlights: [
      "Blur on list scroll (and iOS Done) no longer closes suggestions; dismiss via outside tap, Tab away, Escape, Search, or pick.",
      "E2e coverage for scroll-blur behavior; ZIP-only situs locality locked; Main Parcel export glossed in docs.",
    ],
  },
  {
    version: "4.5.2",
    date: "2026-07-27",
    title: "Multi-match address UX: typeahead, postage labels, ZIP-aware situs",
    highlights: [
      "Match lists sit above refine fields on mobile; typeahead expands to every unit; two-line city/ST/ZIP situs labels; scroll to top on property lock; PINs labeled on match rows.",
      "Situs JSON cache-bust on regenerate; dependency updates; typeahead a11y follow-ups.",
    ],
  },
  {
    version: "4.5.1",
    date: "2026-07-27",
    title: "Situs matching hardened; PIN or AIN accepted",
    highlights: [
      "Offline lookup: soft street-type cleanup, fuzzy street suggestions at the same house number, and typeahead.",
      "AIN resolves through the pin map so parcel-id paste works without a geocoder; authority-chain match helper follow-ups.",
    ],
  },
  {
    version: "4.5.0",
    date: "2026-07-27",
    title: "Who authorized this? authority-chain prototype (Cherry Creek AUTH 0501)",
    highlights: [
      "Curated levy-authority-chain-entries.json with https sources, open gaps, summarySource attribution, and allowedInlineTermIds; panel wired into levy tile details.",
      "Shared levyEntryMatch plus DisclosureChevron/DisclosureSummary; metro card simplified to one headline tile (debt when present, otherwise total metro share).",
      "Property classification moved under the first Property details panel; unit and Playwright coverage for AUTH 0501.",
    ],
  },
  {
    version: "4.4.4",
    date: "2026-07-25",
    title: "/data rate limiting and Civic Lookup rebrand",
    highlights: [
      "In-memory fixed-window rate limits on /data via src/proxy.ts (Next 16 proxy); platform IP headers only; privacy page aligned for voluntary email and IP use.",
      "Product rename to Civic Lookup with brand asserted separately from the AGPL code grant; demo-oriented rate-limit raises and IP-identity hardening followed the initial ship.",
      "Home levy/property DOM order and levy-breakdown landmark a11y fixes.",
    ],
  },
  {
    version: "4.4.3",
    date: "2026-07-23",
    title: "Comps PDF unavailable tile and dashboard summary layout",
    highlights: [
      "Clearer Comps PDF unavailable presentation and dashboard summary layout.",
      "Follow-ups on authority name, PDF path coercion, and chart caption copy.",
    ],
  },
  {
    version: "4.4.2",
    date: "2026-07-21",
    title: "Mill-rate history chart in the levy modal (Tax Years 2018-2025)",
    highlights: [
      "Levy detail modal shows mill-rate history for Tax Years 2018-2025.",
      "YoY docs aligned with 4.4.1 modal behavior.",
    ],
  },
  {
    version: "4.4.1",
    date: "2026-07-21",
    title: "Levy YoY detail modal clarity and usability",
    highlights: [
      "Polish for the year-over-year levy detail modal.",
      "Levy copy clarifications and tighter AUTH reconcile lookup.",
    ],
  },
  {
    version: "4.4.0",
    date: "2026-07-21",
    title: "All-tile mill-rate change (Tax Year 2025 vs 2024)",
    highlights: [
      "Year-over-year mill-rate transparency on every levy tile from county Taxing District Levy Percentage PDFs (AUTH codes); Changed badge and amber stack callout.",
      "Bundled arapahoe-authority-mills-by-tax-year.json; mills-first modal YoY; optional hypothetical dollars with treasurer disclaimer; metro purpose YoY only when Public Info reconciles to AUTH totals.",
      "Stack-level bill-direction dollars left for a later phase (Treasurer sources).",
    ],
  },
  {
    version: "4.3.1",
    date: "2026-07-20",
    title: "Neutral metro rate-change note",
    highlights: [
      "Replace the red/green whole-metro dollar callout with a neutral amber note that scrolls to the first Changed levy tile (respects reduced motion).",
      "Top bill-change callout kept high-level (not metro- or tile-specific); focus-after-scroll and YoY disclosure hardening.",
    ],
  },
  {
    version: "4.3.0",
    date: "2026-07-20",
    title: "Metro mill YoY UI and budget-year 2026 metro levy data",
    highlights: [
      "Re-extract metro-levies-2026.json; purpose-level YoY detection with bill-impact callout when prior totals are complete; Changed badge and What changed panel.",
      "Prior-year mills on levy rows when published; Tax year / Property tax tile behavior when years differ; Vitest, extract, and Playwright coverage.",
      "Stop committing supporting-data/ dumps; runtime stays on public/data JSON; county mart download stamp moves to tools/county-mart-data-as-of.txt.",
    ],
  },
  {
    version: "4.2.9",
    date: "2026-07-18",
    title: "More parcel shard fields and in-flow glossary help",
    highlights: [
      "Surface additional parcel-record shard fields; clarify in-flow glossary help.",
      "InfoHintPopover: keyboard focus, scroll Check the math into view, span root, dismiss UX.",
    ],
  },
  {
    version: "4.2.8",
    date: "2026-07-17",
    title: "Glossary deep links open in a new tab; shared definition underline",
    highlights: [
      "Glossary deep links open in a new tab so parcel results stay put.",
      "Definition cues use a thick indigo underline that inherits local label color.",
    ],
  },
  {
    version: "4.2.7",
    date: "2026-07-16",
    title: "Dedicated Glossary page; county data through 2026-07-15",
    highlights: [
      "Add /glossary as a dedicated key-terms page.",
      "Refresh bundled county data through 2026-07-15.",
    ],
  },
  {
    version: "4.2.6",
    date: "2026-07-14",
    title: "Clearer Details cues; privacy and open-code trust signals",
    highlights: [
      "Levy tile Details cues made clearer.",
      "Surface privacy and open-code trust signals in the UI.",
    ],
  },
  {
    version: "4.2.5",
    date: "2026-07-13",
    title: "Scrub PII from tests/demo; synthetic parcel-index tests",
    highlights: [
      "E2e and demo paths scrub real PII.",
      "Synthetic parcel-index tests added for the build pipeline.",
    ],
  },
  {
    version: "4.2.4",
    date: "2026-07-12",
    title: "Parcel record polish: missing-data mailto, DPT rates, footer",
    highlights: [
      "Missing-data mailto, DPT assessment-rate presentation, and footer polish on the parcel record path.",
    ],
  },
  {
    version: "4.2.3",
    date: "2026-07-12",
    title: "Parcel record: transfers, permits, sale links, county tables",
    highlights: [
      "Transfers, permits, and sale links on the parcel record; county-table polish.",
    ],
  },
  {
    version: "4.2.2",
    date: "2026-07-11",
    title: "Re-shard parcel records by 6-digit PIN prefix",
    highlights: [
      "Parcel-record JSON shards keyed by 6-digit PIN prefix (replacing the earlier 5-digit scheme).",
    ],
  },
  {
    version: "4.2.1",
    date: "2026-07-11",
    title: "Computed assessed splits and ownership type labels",
    highlights: [
      "Parcel-record assessed splits computed in the panel path.",
      "Ownership type labels corrected.",
    ],
  },
  {
    version: "4.2.0",
    date: "2026-07-04",
    title: "Property details panel with sharded parcel data",
    highlights: [
      "Home dashboard Property details column beside the levy stack: lazy-loaded Main Parcel fields after PIN levy lookup; compare card below.",
      "5-digit PIN-prefix JSON shards (~500 KiB per lookup) with fetchCountyParcelRecordForPin caching and stale-response guards on rapid PIN switches.",
      "bundledAsOf driven by maintainer county-mart download date; lg+ keyboard tab order hardened.",
    ],
  },
  {
    version: "4.1.3",
    date: "2026-06-25",
    title: "Levy tiles more obviously interactive",
    highlights: [
      "Consistent interactive layout so levy tiles read as clickable controls.",
    ],
  },
  {
    version: "4.1.2",
    date: "2026-06-22",
    title: "County parcel record link; centralized comps PDF guidance",
    highlights: [
      "Direct PPINum.aspx link and clearer county-compare card on the levy stack.",
      "Comps PDF availability copy centralized in countyCompsPdfGuidance.ts (icon popover, /sources, glossary).",
    ],
  },
  {
    version: "4.1.1",
    date: "2026-05-07",
    title: "Comps grid mobile cards and section help",
    highlights: [
      "Below sm: scrollable field cards; TanStack table only at sm+ to avoid duplicate row ids.",
      "Comps grid heading is the underlined popover trigger; table header associations and /sources updates.",
    ],
  },
  {
    version: "4.1.0",
    date: "2026-05-01",
    title: "NOV comps grid parser, demo grid, and comps PDF outage UX",
    highlights: [
      "Offline pdfplumber extractor for Arapahoe NOV page-2 comps grid; bundled definitions; parser tests and build hooks.",
      "Demo-mode NovCompsGridPanel (TanStack + row-label popovers); comps PDF flaky-host guidance via InfoHintPopover; standard InfoHintPopover on mobile home hints.",
      "Parser/fixture hardening (DWELLING markers, scrollport a11y, Vercel lazy pdfplumber) while this version was current.",
    ],
  },
  {
    version: "4.0.0",
    date: "2026-04-30",
    title: "AGPL-3.0 licensing",
    highlights: [
      "Project license migrates to GNU Affero General Public License v3.0 (or later); package.json license field and SPDX headers on first-party source.",
      "App behavior unchanged aside from license metadata and README terms.",
    ],
  },
  {
    version: "3.8.0",
    date: "2026-04-30",
    title: "Demo property flow and comps tile fallback",
    highlights: [
      "Dashboard demo entry loads the 791 N Amory levy stack with masked parcel details.",
      "Comps tile keeps a consistent icon with demo-only guidance when no demo comps PDF is available.",
    ],
  },
  {
    version: "3.7.2",
    date: "2026-04-21",
    title: "Levy matching and district directory coverage fixes",
    highlights: [
      "Mart-to-DOLA fuzzy matching normalizes common abbreviations; duplicate TAG rows collapse preferring active status and newest effective year.",
      "When the LG directory CSV omits a levy-referenced LGID, add a minimal name-only row from the property-tax entities export; rebuild Arapahoe and directory artifacts.",
    ],
  },
  {
    version: "3.7.1",
    date: "2026-04-19",
    title: "CodeRabbit tooling and UI nits",
    highlights: [
      "Follow-up fixes for tooling and UI notes from review.",
    ],
  },
  {
    version: "3.7.0",
    date: "2026-04-19",
    title: "AIN for county comps PDF; expanded key terms",
    highlights: [
      "Pin map and levy metadata carry Main Parcel AIN; Comps tile links a validated Arapahoe comps grid PDF URL.",
      "Glossary asides for PIN, Parcel, Comps, and TAG; TAG ID links to the TAG term; property wording alignment.",
    ],
  },
  {
    version: "3.6.1",
    date: "2026-04-09",
    title: "Parcel term definitions in accessible popovers",
    highlights: [
      "Home parcel terms use accessible InfoHint-style popovers.",
    ],
  },
  {
    version: "3.6.0",
    date: "2026-04-09",
    title: "Tiered address lookup with street sanitization",
    highlights: [
      "Home address lookup tiers and sanitizes street input; a11y fixes on the lookup path.",
    ],
  },
  {
    version: "3.5.3",
    date: "2026-04-09",
    title: "Parcel owner tile, TAG ID footnote, static county links",
    highlights: [
      "Dashboard parcel owner tile; levy footnote includes TAG ID; static county links.",
    ],
  },
  {
    version: "3.5.2",
    date: "2026-04-09",
    title: "In-modal definitions as primary levy-modal UX",
    highlights: [
      "Levy modal favors in-modal definitions; duplicate government panels trimmed.",
    ],
  },
  {
    version: "3.5.1",
    date: "2026-04-08",
    title: "Feedback mail card and centralized contact mailto",
    highlights: [
      "Feedback mail card on the product surface; contact mailto centralized; client JS trimmed.",
    ],
  },
  {
    version: "3.5.0",
    date: "2026-04-08",
    title: "DOLA LG directory pipeline, levy modal UX, deploy hardening",
    highlights: [
      "Filtered colorado-special-district-directory.json from DOLA LG export scoped to levy-stack LGIDs; build:district-directory script; Arapahoe index prefers LGIS CSV.",
      "Levy detail dialog: government-type panel from DOLA when no explainer, Contact block, focus improvements; ModalPortal inert/aria-hidden on #__next while open.",
    ],
  },
  {
    version: "3.4.3",
    date: "2026-04-08",
    title: "DOLA dlall provenance docs and export defaults",
    highlights: [
      "Document DOLA dlall provenance; align export defaults for reproducible builds.",
    ],
  },
  {
    version: "3.4.2",
    date: "2026-04-08",
    title: "Levy detail guidance refactor; simpler docs/rules",
    highlights: [
      "Refactor levy detail guidance copy and simplify project docs/rules.",
    ],
  },
  {
    version: "3.4.1",
    date: "2026-04-08",
    title: "County availability note; consistent border radius",
    highlights: [
      "County availability note on the lookup screen.",
      "Border radius standardized across the app.",
    ],
  },
  {
    version: "3.4.0",
    date: "2026-04-07",
    title: "Levy line explainer and parcel JSON prefetch",
    highlights: [
      "Levy line explainer content wired into the levy detail path.",
      "Parcel JSON prefetch to speed post-lookup loads.",
    ],
  },
  {
    version: "3.3.4",
    date: "2026-04-07",
    title: "Estimated levy dollars from assessed value",
    highlights: [
      "Home shows estimated levy dollars from assessed value; metro and copy aligned.",
    ],
  },
  {
    version: "3.3.3",
    date: "2026-04-07",
    title: "Drop hash-synced levy workbench; polish home levy flow",
    highlights: [
      "Remove hash-synced levy workbench behavior; polish the home levy flow.",
    ],
  },
  {
    version: "3.3.2",
    date: "2026-04-07",
    title: "Tax year tile, glossary copy, layout tokens",
    highlights: [
      "Parcel summary tax year tile; glossary copy and layout tokens; footer uses Next Link.",
    ],
  },
  {
    version: "3.3.1",
    date: "2026-04-07",
    title: "Footer visible without scroll-to-footer choreography",
    highlights: [
      "Footer stays visible with minimal page content; dedicated scroll-to-footer no longer required.",
    ],
  },
  {
    version: "3.3.0",
    date: "2026-04-07",
    title: "Home tax flow, parcel tiles, and PIN data refinements",
    highlights: [
      "Refine home tax flow, parcel tiles, and pin data.",
      "Address form field UI improvements.",
    ],
  },
  {
    version: "3.2.0",
    date: "2026-04-06",
    title: "New dashboard layout",
    highlights: [
      "Introduce the dashboard layout used by the home property/levy hub.",
    ],
  },
  {
    version: "3.1.5",
    date: "2026-04-06",
    title: "Unified bill card and metro-in-card flow",
    highlights: [
      "Bill card unifies metro-in-card flow and related copy.",
    ],
  },
  {
    version: "3.1.4",
    date: "2026-04-06",
    title: "Metro heading helper and a11y",
    highlights: [
      "Metro heading helper; rename metroFromLevyLines; metro a11y fixes.",
    ],
  },
  {
    version: "3.1.3",
    date: "2026-04-06",
    title: "Stack-only metros and combined multi-metro UI",
    highlights: [
      "Metro district card supports stack-only metros and combined multi-metro UI.",
      "Levy tile UI fixes.",
    ],
  },
  {
    version: "3.1.2",
    date: "2026-04-06",
    title: "Metro tax share: per-levy bar, debt headline, metric tiles",
    highlights: [
      "Metro district tax share visualization with per-levy bar, debt headline, metric tiles, and copy rules.",
    ],
  },
  {
    version: "3.1.1",
    date: "2026-04-06",
    title: "LG ID matching prefers directory ID, then fuzzy name",
    highlights: [
      "Property tax entity contact matching prefers LG ID first, then fuzzy name match.",
    ],
  },
  {
    version: "3.1.0",
    date: "2026-04-06",
    title: "Unified levy detail modal and glossary polish",
    highlights: [
      "Unified levy detail modal with glossary and copy polish.",
      "Metro district rate-split details UI simplified (removed nested box).",
    ],
  },
  {
    version: "3.0.2",
    date: "2026-04-05",
    title: "Home and metro UX; address autofill hardening",
    highlights: [
      "Home and metro UX improvements; harden address autofill handling.",
    ],
  },
  {
    version: "3.0.1",
    date: "2026-04-04",
    title: "Home help, single Start over, metro embed",
    highlights: [
      "Home help copy; single Start over control; metro embed polish.",
    ],
  },
  {
    version: "3.0.0",
    date: "2026-04-04",
    title: "Unified address + levy hub (breaking: /levy-breakdown removed)",
    highlights: [
      "HomeParcelAddressLookup becomes the hub: address to PIN, levy stack, embedded metro; /levy-breakdown permanently 308-redirects to /.",
      "Metro construction banner between levy and metro sections; contact page added; sources/footer coverage notes.",
    ],
  },
  {
    version: "2.2.0",
    date: "2026-04-03",
    title: "PIN/TAG levy stacks, district directory, and safe links",
    highlights: [
      "Static Arapahoe levy stacks and PIN-to-TAG mapping; Colorado special-district metadata; district detail from bundled data.",
      "safeExternalHref for http(s) and Arapahoe Levy.aspx links; /sources methodology expansion; Next 16.2.2.",
    ],
  },
  {
    version: "2.1.1",
    date: "2026-03-31",
    title: "Tools home page card UI",
    highlights: [
      "UI/UX updates to tools home page cards.",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-03-31",
    title: "Levy breakdown tool MVP",
    highlights: [
      "Levy breakdown reaches MVP with shared reusable components and UI polish.",
    ],
  },
  {
    version: "2.0.1",
    date: "2026-03-31",
    title: "Levy breakdown walkthrough and polish",
    highlights: [
      "Property tax levy breakdown walkthrough and related polish.",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-03-31",
    title: "Footer version and Mountain Time last-updated",
    highlights: [
      "Footer shows app version and a Mountain Time last-updated date tied to build/deploy, without git or risky config side effects.",
      "UI and content continuity fixes.",
    ],
  },
  {
    version: "1.0.3",
    date: "2026-03-20",
    title: "Levy snapshot date in UI; regenerated bundled JSON",
    highlights: [
      "UI surfaces the levy snapshot date; bundled JSON regenerated to match.",
    ],
  },
  {
    version: "1.0.2",
    date: "2026-03-20",
    title: "UI/UX cleanup and DRY fixes",
    highlights: [
      "General UI/UX cleanup and other DRY fixes after the 1.0.1 debt styling pass.",
    ],
  },
  {
    version: "1.0.1",
    date: "2026-03-20",
    title: "Debt styling and results card UI",
    highlights: [
      "Red styling to denote debt.",
      "Results card UI/UX changes.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-20",
    title: "All metro districts; total metro share as primary result",
    highlights: [
      "Show all metro districts and use total metro share as the primary result.",
      "Extract shared components (including StaticArticleShell); add CSP and related security headers; hero update.",
    ],
  },
  {
    version: "0.1.3",
    date: "2026-03-17",
    title: "Mills definition and metro flow copy/input polish",
    highlights: [
      "Updated mills definition.",
      "Levy extractor handles concatenated county+lgid; mill input limited to 3 decimal places; opening copy restructured; step order made more intuitive.",
    ],
  },
  {
    version: "0.1.2",
    date: "2026-03-17",
    title: "Metro result math, special-districts map, select a11y",
    highlights: [
      "Improve metro result card math, wording, and visuals.",
      "Link to Colorado special districts map; a11y for metro district select and result announcement.",
    ],
  },
  {
    version: "0.1.1",
    date: "2026-03-17",
    title: "Clearer property details instructions and early flow fixes",
    highlights: [
      "Clarify property details page instructions.",
      "Rework step 3 so it no longer asks for incorrect user info; additional early UI/UX fixes.",
    ],
  },
];
