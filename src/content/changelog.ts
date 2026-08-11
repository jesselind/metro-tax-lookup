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
      "5-digit PIN-prefix JSON shards (~500 KiB per lookup) with fetchArapahoeParcelRecordForPin caching and stale-response guards on rapid PIN switches.",
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
