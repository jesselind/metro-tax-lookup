// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Release notes for `/changelog` (footer version link). Hand-written, high-level
 * highlights only - not a commit or file dump. Newest first. When you bump
 * `package.json` version, add a matching entry here (unit test enforces the
 * current version appears). Follow `.cursor/rules/changelog.mdc`.
 *
 * Audience: contributors, forkers, and anyone tracking what shipped. Prefer
 * accurate product takeaways over implementation detail.
 */

export type ChangelogSectionKind = "added" | "changed" | "fixed" | "removed";

export const CHANGELOG_SECTION_ORDER: {
  kind: ChangelogSectionKind;
  label: string;
}[] = [
  { kind: "added", label: "Added" },
  { kind: "changed", label: "Changed" },
  { kind: "fixed", label: "Fixed" },
  { kind: "removed", label: "Removed" },
];

export type ChangelogEntry = {
  /** Semver matching a shipped `package.json` version. */
  version: string;
  /** Calendar date the version went live (YYYY-MM-DD, America/Denver). */
  date: string;
  /** One-line takeaway for the release. */
  title: string;
  /** Keep a Changelog-style sections; omit empty kinds. */
  sections: Partial<Record<ChangelogSectionKind, string[]>>;
};

/** Flatten section bullets in Added → Changed → Fixed → Removed order. */
export function changelogEntryBullets(entry: ChangelogEntry): string[] {
  return CHANGELOG_SECTION_ORDER.flatMap(
    ({ kind }) => entry.sections[kind] ?? [],
  );
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "5.28.1",
    date: "2026-10-10",
    title: "Search and Try demo stay side by side on mobile",
    sections: {
      changed: [
        "Address lookup keeps Search and Try demo property on one row at every screen size."
      ]
    },
  },
  {
    version: "5.28.0",
    date: "2026-10-08",
    title: "Ballot panel shows parcel dollar impact",
    sections: {
      added: [
        "Levy ballot panel can show an estimated yearly dollar impact when Notice mills and assessed value are known."
      ],
      changed: [
        "Property details spacing before Sale history matches other major sections."
      ]
    },
  },
  {
    version: "5.27.2",
    date: "2026-10-06",
    title: "More reliable address fill in end-to-end tests",
    sections: {
      fixed: [
        "Street-address fill in Playwright is stable on Linux WebKit with React 19."
      ]
    },
  },
  {
    version: "5.27.1",
    date: "2026-10-06",
    title: "TABOR Support/Oppose bar wraps cleanly",
    sections: {
      fixed: [
        "Support and Oppose halves stay aligned when labels wrap in the popover and glossary."
      ]
    },
  },
  {
    version: "5.27.0",
    date: "2026-10-06",
    title: "Arapahoe November 2026 TABOR Notice on levy tiles",
    sections: {
      added: [
        "On the ballot badge and proposal panel for Arapahoe authorities in the Clerk TABOR Notice.",
        "Home and report jumps to property-tax ballot issues when the levy stack includes a Notice authority.",
        "TABOR Support/Oppose contrast bar in the glossary and related popovers."
      ],
      changed: [
        "Mill year-over-year box titled Historical change for this period.",
        "Clearer fiscal-year, bonds, and property-tax revenue limit popover copy."
      ]
    },
  },
  {
    version: "5.26.0",
    date: "2026-10-02",
    title: "Douglas comps PDF lookup from the Assessor",
    sections: {
      added: [
        "Comparable properties checks the county documents list and links the comps PDF when present."
      ],
      changed: [
        "Locked-report section titles show the same Jump icons as the TOC."
      ],
      fixed: [
        "Clear on-site error when the documents lookup fails, instead of a silent handoff."
      ]
    },
  },
  {
    version: "5.25.0",
    date: "2026-09-29",
    title: "Aurora Public Schools authority chain",
    sections: {
      added: [
        "Who authorized this? trail for Aurora Public Schools (Ballot Issues 5A and 5B)."
      ]
    },
  },
  {
    version: "5.24.0",
    date: "2026-09-29",
    title: "Developmental Disabilities local-levy authority chain",
    sections: {
      added: [
        "Local-levy authority-chain family for county-collected program mills.",
        "Arapahoe Developmental Disabilities Who authorized this? trail."
      ]
    },
  },
  {
    version: "5.23.1",
    date: "2026-09-29",
    title: "Summary bar polish and clearer Close controls",
    sections: {
      changed: [
        "Home teaching and locked Own Summary share one two-lever bar.",
        "Arapahoe Property value face states the county does not publish prior years.",
        "Levy detail and account-switcher Close use the same solid primary style as Search."
      ]
    },
  },
  {
    version: "5.23.0",
    date: "2026-09-28",
    title: "Property-report Summary with multi-year faces",
    sections: {
      added: [
        "Locked Own report Summary section with appraised and mill faces when history is publishable."
      ]
    },
  },
  {
    version: "5.22.0",
    date: "2026-09-28",
    title: "Home teaching bar for property value and mill levy",
    sections: {
      added: [
        "Unlocked home shows a two-segment bar explaining the two numbers that raise property tax."
      ]
    },
  },
  {
    version: "5.21.0",
    date: "2026-09-28",
    title: "Antelope Hills municipal GID authority chain",
    sections: {
      added: [
        "Municipal GID authority-chain family.",
        "Antelope Hills General Improvement District Who authorized this? trail.",
        "Sourced-records path for official PDFs without a durable issuer URL."
      ]
    },
  },
  {
    version: "5.20.0",
    date: "2026-09-26",
    title: "Arapahoe Library District authority chain",
    sections: {
      added: [
        "Who authorized this? trail for Arapahoe Library District (Ballot Issue 4A)."
      ],
      changed: [
        "Home shows the latest three Arapahoe-related authorization updates under the privacy line."
      ]
    },
  },
  {
    version: "5.19.3",
    date: "2026-09-22",
    title: "CodeRabbit skips large parcel data shards",
    sections: {
      changed: [
        "PR review excludes large parcel and valuation shard trees so reviews stay under the file cap."
      ]
    },
  },
  {
    version: "5.19.2",
    date: "2026-09-22",
    title: "Antelope Hills TAG mill join corrections",
    sections: {
      fixed: [
        "Antelope Hills GID, Bennett Fire, and North Kiowa Bijou groundwater mills match the county levy total for the curated TAG."
      ]
    },
  },
  {
    version: "5.19.1",
    date: "2026-09-21",
    title: "Always-visible prior-year gap on Arapahoe value cards",
    sections: {
      changed: [
        "Appraised and Assessed cards show an in-card COUNTY DATA GAP when prior-year values are missing.",
        "Values section table disclosures stack cleanly on mobile and sit side by side from sm up."
      ]
    },
  },
  {
    version: "5.19.0",
    date: "2026-09-21",
    title: "Appraised and assessed value kind cards",
    sections: {
      added: [
        "One kind card per value type with always-visible year-over-year and in-flow charts when history exists."
      ],
      removed: [
        "Separate valuation-history dialog for those cards."
      ]
    },
  },
  {
    version: "5.18.1",
    date: "2026-09-21",
    title: "Values section after levies; quieter Total bar",
    sections: {
      changed: [
        "Locked report order: levies, then appraised and assessed values, then Property details.",
        "Levy stack Total bar shows dollars, mills, and percent only."
      ]
    },
  },
  {
    version: "5.18.0",
    date: "2026-09-20",
    title: "One sticky comps table on every viewport",
    sections: {
      changed: [
        "Comparable properties uses one sticky table everywhere (no separate mobile card stack).",
        "Wide locked-report tables share horizontal scroll with a soft fade when more columns remain."
      ]
    },
  },
  {
    version: "5.17.1",
    date: "2026-09-19",
    title: "Mobile Jump jumps stay reliable",
    sections: {
      fixed: [
        "Mobile Jump no longer uses scroll-spy, so sequential section jumps keep working."
      ]
    },
  },
  {
    version: "5.17.0",
    date: "2026-09-19",
    title: "Levy-first locked report with sticky section nav",
    sections: {
      added: [
        "Desktop sidenav and mobile Jump strip for section navigation."
      ],
      changed: [
        "Locked report leads with levies; summary tile cluster removed."
      ],
      removed: [
        "Summary / Value summary tile cluster."
      ]
    },
  },
  {
    version: "5.16.0",
    date: "2026-09-17",
    title: "Est. property tax matches the mill-levy stack",
    sections: {
      changed: [
        "Default face Property tax dollars use the same dual-base math as the mill-levy stack.",
        "Estimate copy focuses on tax statement differences, not face-vs-stack divergence."
      ]
    },
  },
  {
    version: "5.15.0",
    date: "2026-09-15",
    title: "Douglas Realware face tax and dual-rate levy dollars",
    sections: {
      added: [
        "Douglas face Property tax uses Realware tax dollars for the face year."
      ],
      changed: [
        "School levy lines use school assessed when it differs from local assessed.",
        "Tax year follows the Realware face year when valuation history loads."
      ]
    },
  },
  {
    version: "5.14.3",
    date: "2026-09-14",
    title: "Douglas known-issue banner and comps Coming soon",
    sections: {
      added: [
        "Douglas locked report shows a known-issue banner when tax year or estimate can disagree with the Assessor site."
      ],
      changed: [
        "Comparable properties shows Coming soon while the comps PDF path is unwired."
      ]
    },
  },
  {
    version: "5.14.2",
    date: "2026-09-13",
    title: "Clearer multi-street address matching",
    sections: {
      changed: [
        "Typeahead lists distinct street lines that share one situs key.",
        "Matching properties sorts by place, then Real vs business personal.",
        "Multi-match help is shorter so the list sits higher on mobile."
      ]
    },
  },
  {
    version: "5.14.1",
    date: "2026-09-13",
    title: "Safer district Contact matching; Aurora schools fixed",
    sections: {
      changed: [
        "Campaign outline disclosure moves to the site footer on every page."
      ],
      fixed: [
        "Low-confidence DOLA name matches no longer drive Contact; Aurora Public Schools Contact points to the correct district."
      ]
    },
  },
  {
    version: "5.14.0",
    date: "2026-09-11",
    title: "City of Aurora authority chain; levy modal popovers",
    sections: {
      added: [
        "Who authorized this? trail for the City of Aurora."
      ],
      changed: [
        "Levy modal definitions use popovers only (no separate jump-to definition panel)."
      ]
    },
  },
  {
    version: "5.13.1",
    date: "2026-09-11",
    title: "Campaign disclosure matches Assessor outline branding",
    sections: {
      changed: [
        "Home campaign outline control uses the campaign green outline style."
      ]
    },
  },
  {
    version: "5.13.0",
    date: "2026-09-10",
    title: "Sticky Jump to a section on the locked report",
    sections: {
      added: [
        "Sticky On this page / Jump to a section strip on the locked report."
      ]
    },
  },
  {
    version: "5.12.0",
    date: "2026-09-08",
    title: "Real+BPP switch across counties; Rent unit count from Units",
    sections: {
      changed: [
        "Switch account type appears whenever a situs mixes real and business personal property.",
        "Rent dwelling count prefers building Units attributes when present."
      ]
    },
  },
  {
    version: "5.11.0",
    date: "2026-09-08",
    title: "County feature gates; Douglas metro purpose rows",
    sections: {
      added: [
        "Douglas metro purpose breakdown from Abstract of Assessment tax rates."
      ],
      changed: [
        "Metro purposes, mill history, and related features resolve per county with no silent Arapahoe fill-in."
      ]
    },
  },
  {
    version: "5.10.0",
    date: "2026-09-07",
    title: "West Metro Fire Contact join on Douglas",
    sections: {
      fixed: [
        "Douglas West Metro Fire joins the correct DOLA tax entity (not South Metro Fire Rescue)."
      ]
    },
  },
  {
    version: "5.9.0",
    date: "2026-09-06",
    title: "Douglas valuation history and per-year levy dollars",
    sections: {
      added: [
        "Douglas valuation history from Realware detail; year-over-year on assessed and actual value."
      ],
      changed: [
        "Levy year-over-year dollars use per-year assessed when history has the prior year."
      ]
    },
  },
  {
    version: "5.8.0",
    date: "2026-09-04",
    title: "Douglas prior-year Coming soon chrome",
    sections: {
      added: [
        "Sky IN PROGRESS / Coming soon chrome for Douglas prior-year assessed values."
      ],
      changed: [
        "Arapahoe prior-year COUNTY DATA GAP unchanged."
      ]
    },
  },
  {
    version: "5.7.0",
    date: "2026-09-04",
    title: "/sources methodology split by county module",
    sections: {
      changed: [
        "/sources methodology content lives in per-county modules behind a shared page shell."
      ]
    },
  },
  {
    version: "5.6.0",
    date: "2026-09-04",
    title: "Douglas e2e coverage and prior-year data gap",
    sections: {
      added: [
        "Douglas search and Sources county deep-link coverage in Playwright."
      ],
      changed: [
        "Douglas shows Prior years missing on Assessed value with county-specific guidance."
      ]
    },
  },
  {
    version: "5.5.0",
    date: "2026-09-02",
    title: "District directory covers Douglas stack LGIDs",
    sections: {
      changed: [
        "Special-district Contact directory includes LGIDs from both Arapahoe and Douglas levy stacks."
      ]
    },
  },
  {
    version: "5.4.0",
    date: "2026-09-02",
    title: "Douglas mill history from county mill PDFs",
    sections: {
      added: [
        "Douglas mill-rate history for levy tiles and charts from Tax Districts and Mill Levies PDFs."
      ]
    },
  },
  {
    version: "5.3.1",
    date: "2026-09-02",
    title: "Statewide DOLA tax-entities refresh",
    sections: {
      changed: [
        "Refreshed statewide DOLA Property Tax Entities export; registry LG IDs backfilled for shared authorities."
      ]
    },
  },
  {
    version: "5.3.0",
    date: "2026-08-31",
    title: "Cross-county authority registry",
    sections: {
      added: [
        "Registry maps one logical district to per-county AUTH codes for shared authorities."
      ],
      changed: [
        "Douglas stacks join DOLA tax entities; shared authority-chain trails stay county-neutral."
      ]
    },
  },
  {
    version: "5.2.0",
    date: "2026-08-30",
    title: "County-neutral data loaders",
    sections: {
      changed: [
        "Parcel and situs loaders are county-agnostic; Arapahoe-named modules remain as compatibility shims."
      ]
    },
  },
  {
    version: "5.1.0",
    date: "2026-08-28",
    title: "Douglas County lookup beside Arapahoe",
    sections: {
      added: [
        "Douglas account-id and address lookup with parcel-record details.",
        "County picker and multi-county search when more than one county is wired."
      ],
      changed: [
        "Dashboard, footer, and COUNTY DATA GAP chrome follow the resolved county."
      ]
    },
  },
  {
    version: "5.0.1",
    date: "2026-08-25",
    title: "Maintainer download lists; Douglas inventory Go",
    sections: {
      changed: [
        "Documented county download hubs and confirmed Douglas source files can fill required app JSON shapes."
      ]
    },
  },
  {
    version: "5.0.0",
    date: "2026-08-24",
    title: "Arapahoe shipping data built by ingest engine v2",
    sections: {
      changed: [
        "Arapahoe shipping JSON rebuilds through the new ingest engine with an atomic ship step."
      ]
    },
  },
  {
    version: "4.15.1",
    date: "2026-08-24",
    title: "Typeahead omits condo unit in place captions",
    sections: {
      changed: [
        "Multi-PIN place suggestions no longer show a single condo unit when Matching properties still lists every account."
      ]
    },
  },
  {
    version: "4.15.0",
    date: "2026-08-23",
    title: "County-agnostic static data paths",
    sections: {
      changed: [
        "Shipping JSON URLs resolve from county id so loaders are not Arapahoe-hardcoded."
      ]
    },
  },
  {
    version: "4.14.0",
    date: "2026-08-22",
    title: "New ingest engine proved against shipping data",
    sections: {
      changed: [
        "New ingest reproduces committed Arapahoe shipping JSON locally; live site data unchanged until ship-from-new."
      ]
    },
  },
  {
    version: "4.13.0",
    date: "2026-08-18",
    title: "New ingest reader, writer, and compare",
    sections: {
      added: [
        "New ingest mapping, reader, writer, and compare tools beside the current Arapahoe rebuild."
      ]
    },
  },
  {
    version: "4.12.0",
    date: "2026-08-18",
    title: "Ingest classifier for county drop folders",
    sections: {
      added: [
        "Classifier inspects county drop folders and reports what can feed required app JSON."
      ]
    },
  },
  {
    version: "4.11.0",
    date: "2026-08-18",
    title: "County config and feature-available flags",
    sections: {
      added: [
        "County config holds identifier rules, URL templates, and feature-available flags."
      ]
    },
  },
  {
    version: "4.10.0",
    date: "2026-08-18",
    title: "App JSON contract for the new ingest",
    sections: {
      added: [
        "Validated contract for required and optional shipping JSON shapes ahead of the new ingest."
      ]
    },
  },
  {
    version: "4.9.4",
    date: "2026-08-18",
    title: "Mill levy summary chip and prior-year gap badge",
    sections: {
      added: [
        "Mill levy summary chip with Changed when the total moved."
      ],
      changed: [
        "Prior-year COUNTY DATA GAP sits as a Prior years missing badge on Assessed value."
      ],
      removed: [
        "Amber whole-bill changed banner and Property tax change teaching chip."
      ]
    },
  },
  {
    version: "4.9.3",
    date: "2026-08-17",
    title: "COUNTY DATA GAP callouts",
    sections: {
      added: [
        "Shared COUNTY DATA GAP chrome on the dashboard and matching /sources hub boxes."
      ]
    },
  },
  {
    version: "4.9.2",
    date: "2026-08-16",
    title: "Neighborhood from Assessor Open GIS Parcels",
    sections: {
      added: [
        "Property details Neighborhood and code fill from the Assessor Open GIS Parcels layer."
      ]
    },
  },
  {
    version: "4.9.1",
    date: "2026-08-16",
    title: "Fire authority chain and rate-table page cites",
    sections: {
      added: [
        "Fire Who authorized this? family; South Metro Fire Rescue Ballot Issue 7A trail."
      ],
      changed: [
        "Levy % source links deep-link to the parcel tax-area page when known."
      ]
    },
  },
  {
    version: "4.9.0",
    date: "2026-08-15",
    title: "Metro authority chain from published mill series",
    sections: {
      changed: [
        "Metro Who authorized this? rate changes come from the same AUTH mill series as the history chart."
      ]
    },
  },
  {
    version: "4.8.2",
    date: "2026-08-13",
    title: "BPP hides Rent; Switch account type is Real+BPP only",
    sections: {
      changed: [
        "Own | Rent hidden on business personal property accounts.",
        "Switch account type only when the situs mixes Real and business personal property."
      ]
    },
  },
  {
    version: "4.8.1",
    date: "2026-08-12",
    title: "Python tooling docstrings on non-obvious helpers",
    sections: {
      changed: [
        "Offline tools gain useful docstrings on non-obvious helpers."
      ]
    },
  },
  {
    version: "4.8.0",
    date: "2026-08-12",
    title: "Own / Rent audience lens",
    sections: {
      added: [
        "Own | Rent switch with equal-split tax pressure tiles and per-unit levy dollars in Rent mode."
      ]
    },
  },
  {
    version: "4.7.3",
    date: "2026-08-12",
    title: "Summary tiles beside levies; unified Property details",
    sections: {
      changed: [
        "Summary tiles sit beside the levy stack on large screens; Property details is one full-width block."
      ]
    },
  },
  {
    version: "4.7.2",
    date: "2026-08-11",
    title: "In-dashboard multi-account switcher",
    sections: {
      added: [
        "Switch account type opens an in-dashboard modal instead of unlocking the post-search chooser."
      ]
    },
  },
  {
    version: "4.7.1",
    date: "2026-08-09",
    title: "Business personal property dashboard",
    sections: {
      added: [
        "Business personal property accounts use a thin Real-style dashboard with levy stack and totals."
      ]
    },
  },
  {
    version: "4.7.0",
    date: "2026-08-05",
    title: "Campaign disclosure, Open Graph image, footer accuracy",
    sections: {
      added: [
        "Campaign disclosure controls, Open Graph share image, and clearer footer accuracy copy."
      ]
    },
  },
  {
    version: "4.6.2",
    date: "2026-08-04",
    title: "E2E hardening and synthetic multi-PIN fixtures",
    sections: {
      changed: [
        "Playwright helpers and synthetic multi-PIN fixtures; cite health separated from UI panel tests."
      ]
    },
  },
  {
    version: "4.6.1",
    date: "2026-08-03",
    title: "Clearer assessed-rate labels; Changelog page",
    sections: {
      added: [
        "In-app Changelog page for release notes."
      ],
      changed: [
        "Non-residential assessed rows show a percent only when the class maps cleanly to the state chart."
      ]
    },
  },
  {
    version: "4.6.0",
    date: "2026-08-03",
    title: "Shared-address account chooser",
    sections: {
      added: [
        "When several tax accounts share one street address, search shows every account after the place."
      ],
      changed: [
        "Non-residential Real assessed display follows state use (no residential school row)."
      ]
    },
  },
  {
    version: "4.5.8",
    date: "2026-08-03",
    title: "Spanish sample-ballot pattern; metro authority-chain pack",
    sections: {
      added: [
        "Metro family pack for Sky Ranch; Spanish-only sample ballot pattern with AI-translated English disclosure."
      ]
    },
  },
  {
    version: "4.5.7",
    date: "2026-07-31",
    title: "Authority-chain summary links and mill-history polish",
    sections: {
      changed: [
        "Authority-chain summaries link Ballot Issue phrases; mill-rate-over-time chart polish."
      ]
    },
  },
  {
    version: "4.5.6",
    date: "2026-07-30",
    title: "County authority-chain templates in JSON",
    sections: {
      changed: [
        "Arapahoe County 1A story lives in entry JSON instead of hard-coded pack copy."
      ]
    },
  },
  {
    version: "4.5.5",
    date: "2026-07-28",
    title: "Arapahoe County authority chain (Ballot Issue 1A)",
    sections: {
      added: [
        "Who authorized this? trail for Arapahoe County Ballot Issue 1A."
      ]
    },
  },
  {
    version: "4.5.4",
    date: "2026-07-28",
    title: "Littleton authority chain with ballot-text fallback",
    sections: {
      added: [
        "Littleton schools Who authorized this? trail with a file-library fallback when ballot wording is missing."
      ]
    },
  },
  {
    version: "4.5.3",
    date: "2026-07-28",
    title: "Typeahead stays open when the mobile keyboard dismisses",
    sections: {
      fixed: [
        "Suggestions stay open on list scroll and iOS Done; dismiss via outside tap, Tab, Escape, Search, or pick."
      ]
    },
  },
  {
    version: "4.5.2",
    date: "2026-07-27",
    title: "Multi-match address UX polish",
    sections: {
      changed: [
        "Match lists, postage-style labels, and ZIP-aware situs captions for multi-match addresses."
      ]
    },
  },
  {
    version: "4.5.1",
    date: "2026-07-27",
    title: "Harder situs matching; PIN or AIN accepted",
    sections: {
      changed: [
        "Softer street matching with typeahead; AIN paste resolves through the pin map."
      ]
    },
  },
  {
    version: "4.5.0",
    date: "2026-07-27",
    title: "Who authorized this? authority-chain prototype",
    sections: {
      added: [
        "Curated Who authorized this? panel in levy details (Cherry Creek schools first)."
      ]
    },
  },
  {
    version: "4.4.4",
    date: "2026-07-25",
    title: "/data rate limiting and Civic Lookup rebrand",
    sections: {
      added: [
        "Rate limits on /data responses."
      ],
      changed: [
        "Product rename to Civic Lookup."
      ]
    },
  },
  {
    version: "4.4.3",
    date: "2026-07-23",
    title: "Comps PDF unavailable tile and summary layout",
    sections: {
      changed: [
        "Clearer Comps PDF unavailable presentation and dashboard summary layout."
      ]
    },
  },
  {
    version: "4.4.2",
    date: "2026-07-21",
    title: "Mill-rate history chart in the levy modal",
    sections: {
      added: [
        "Levy detail modal shows mill-rate history for Tax Years 2018-2025."
      ]
    },
  },
  {
    version: "4.4.1",
    date: "2026-07-21",
    title: "Levy year-over-year modal clarity",
    sections: {
      changed: [
        "Clearer year-over-year levy detail modal."
      ]
    },
  },
  {
    version: "4.4.0",
    date: "2026-07-21",
    title: "Year-over-year mill-rate change on every levy tile",
    sections: {
      added: [
        "Changed badge and mill year-over-year detail from county Levy Percentage PDFs."
      ]
    },
  },
  {
    version: "4.3.1",
    date: "2026-07-20",
    title: "Neutral metro rate-change note",
    sections: {
      changed: [
        "Whole-metro dollar callout becomes a neutral amber note that scrolls to the first Changed tile."
      ]
    },
  },
  {
    version: "4.3.0",
    date: "2026-07-20",
    title: "Metro mill year-over-year and 2026 metro levy data",
    sections: {
      added: [
        "Purpose-level metro mill changes with bill-impact callout when prior totals are complete."
      ],
      changed: [
        "Budget-year 2026 metro levy data refreshed."
      ]
    },
  },
  {
    version: "4.2.9",
    date: "2026-07-18",
    title: "More parcel fields and in-flow glossary help",
    sections: {
      changed: [
        "Additional parcel-record fields; clearer in-flow glossary help."
      ]
    },
  },
  {
    version: "4.2.8",
    date: "2026-07-17",
    title: "Glossary deep links open in a new tab",
    sections: {
      changed: [
        "Glossary deep links open in a new tab; shared thick indigo definition underline."
      ]
    },
  },
  {
    version: "4.2.7",
    date: "2026-07-16",
    title: "Dedicated Glossary page",
    sections: {
      added: [
        "/glossary key-terms page."
      ],
      changed: [
        "Bundled county data through 2026-07-15."
      ]
    },
  },
  {
    version: "4.2.6",
    date: "2026-07-14",
    title: "Clearer Details cues; privacy and open-code signals",
    sections: {
      changed: [
        "Clearer levy Details cues; privacy and open-code trust signals in the UI."
      ]
    },
  },
  {
    version: "4.2.5",
    date: "2026-07-13",
    title: "Scrub PII from tests and demo",
    sections: {
      changed: [
        "E2e and demo paths use synthetic identities; synthetic parcel-index tests."
      ]
    },
  },
  {
    version: "4.2.4",
    date: "2026-07-12",
    title: "Parcel record polish",
    sections: {
      changed: [
        "Missing-data mailto, assessment-rate presentation, and footer polish on the parcel record path."
      ]
    },
  },
  {
    version: "4.2.3",
    date: "2026-07-12",
    title: "Parcel record transfers, permits, and sale links",
    sections: {
      added: [
        "Transfers, permits, and sale links on the parcel record."
      ]
    },
  },
  {
    version: "4.2.2",
    date: "2026-07-11",
    title: "Parcel records re-sharded by 6-digit PIN prefix",
    sections: {
      changed: [
        "Parcel-record shards keyed by 6-digit PIN prefix."
      ]
    },
  },
  {
    version: "4.2.1",
    date: "2026-07-11",
    title: "Computed assessed splits and ownership labels",
    sections: {
      changed: [
        "Parcel-record assessed splits and ownership type labels corrected."
      ]
    },
  },
  {
    version: "4.2.0",
    date: "2026-07-04",
    title: "Property details panel with sharded parcel data",
    sections: {
      added: [
        "Property details column with lazy-loaded parcel fields after PIN levy lookup."
      ]
    },
  },
  {
    version: "4.1.3",
    date: "2026-06-25",
    title: "Levy tiles more obviously interactive",
    sections: {
      changed: [
        "Levy tiles read more clearly as clickable controls."
      ]
    },
  },
  {
    version: "4.1.2",
    date: "2026-06-22",
    title: "County parcel record link; comps PDF guidance",
    sections: {
      changed: [
        "Clearer county-compare card; comps PDF availability copy centralized."
      ]
    },
  },
  {
    version: "4.1.1",
    date: "2026-05-07",
    title: "Comps grid mobile cards and section help",
    sections: {
      changed: [
        "Mobile field cards for the comps grid; section heading opens the popover."
      ]
    },
  },
  {
    version: "4.1.0",
    date: "2026-05-01",
    title: "NOV comps grid parser and demo grid",
    sections: {
      added: [
        "Offline NOV comps grid extract; demo comps grid; clearer comps PDF outage guidance."
      ]
    },
  },
  {
    version: "4.0.0",
    date: "2026-04-30",
    title: "AGPL-3.0 licensing",
    sections: {
      changed: [
        "Project license migrates to GNU Affero General Public License v3.0 or later."
      ]
    },
  },
  {
    version: "3.8.0",
    date: "2026-04-30",
    title: "Demo property flow",
    sections: {
      added: [
        "Try demo property loads a masked sample levy stack."
      ]
    },
  },
  {
    version: "3.7.2",
    date: "2026-04-21",
    title: "Levy matching and district directory fixes",
    sections: {
      fixed: [
        "Mart-to-DOLA matching and directory coverage for levy-referenced districts."
      ]
    },
  },
  {
    version: "3.7.1",
    date: "2026-04-19",
    title: "Review follow-ups",
    sections: {
      fixed: [
        "Small tooling and UI fixes from review."
      ]
    },
  },
  {
    version: "3.7.0",
    date: "2026-04-19",
    title: "AIN for county comps PDF; expanded key terms",
    sections: {
      added: [
        "Comps tile links the county comps PDF when AIN is available."
      ],
      changed: [
        "Glossary asides for PIN, Parcel, Comps, and TAG."
      ]
    },
  },
  {
    version: "3.6.1",
    date: "2026-04-09",
    title: "Parcel terms in accessible popovers",
    sections: {
      changed: [
        "Home parcel terms use accessible popovers."
      ]
    },
  },
  {
    version: "3.6.0",
    date: "2026-04-09",
    title: "Tiered address lookup",
    sections: {
      changed: [
        "Address lookup tiers and sanitizes street input."
      ]
    },
  },
  {
    version: "3.5.3",
    date: "2026-04-09",
    title: "Parcel owner tile and TAG ID footnote",
    sections: {
      added: [
        "Dashboard parcel owner tile; levy footnote includes TAG ID."
      ]
    },
  },
  {
    version: "3.5.2",
    date: "2026-04-09",
    title: "In-modal definitions as primary levy-modal UX",
    sections: {
      changed: [
        "Levy modal favors in-modal definitions; duplicate panels trimmed."
      ]
    },
  },
  {
    version: "3.5.1",
    date: "2026-04-08",
    title: "Feedback mail card",
    sections: {
      added: [
        "Feedback mail card; centralized contact mailto."
      ]
    },
  },
  {
    version: "3.5.0",
    date: "2026-04-08",
    title: "District directory and levy modal Contact",
    sections: {
      added: [
        "Filtered Colorado special-district directory; Contact block in the levy detail dialog."
      ]
    },
  },
  {
    version: "3.4.3",
    date: "2026-04-08",
    title: "DOLA export provenance docs",
    sections: {
      changed: [
        "Documented DOLA export provenance and reproducible build defaults."
      ]
    },
  },
  {
    version: "3.4.2",
    date: "2026-04-08",
    title: "Levy detail guidance and simpler docs",
    sections: {
      changed: [
        "Clearer levy detail guidance; simpler project docs and rules."
      ]
    },
  },
  {
    version: "3.4.1",
    date: "2026-04-08",
    title: "County availability note; consistent radius",
    sections: {
      changed: [
        "County availability note on lookup; border radius standardized."
      ]
    },
  },
  {
    version: "3.4.0",
    date: "2026-04-07",
    title: "Levy line explainer and parcel prefetch",
    sections: {
      added: [
        "Levy line explainer in the levy detail path."
      ],
      changed: [
        "Parcel JSON prefetch after lookup."
      ]
    },
  },
  {
    version: "3.3.4",
    date: "2026-04-07",
    title: "Estimated levy dollars from assessed value",
    sections: {
      added: [
        "Home shows estimated levy dollars from assessed value."
      ]
    },
  },
  {
    version: "3.3.3",
    date: "2026-04-07",
    title: "Drop hash-synced levy workbench",
    sections: {
      changed: [
        "Home levy flow polish."
      ],
      removed: [
        "Hash-synced levy workbench behavior."
      ]
    },
  },
  {
    version: "3.3.2",
    date: "2026-04-07",
    title: "Tax year tile and glossary polish",
    sections: {
      added: [
        "Parcel summary tax year tile."
      ],
      changed: [
        "Glossary copy and layout tokens."
      ]
    },
  },
  {
    version: "3.3.1",
    date: "2026-04-07",
    title: "Footer visible without scroll choreography",
    sections: {
      fixed: [
        "Footer stays visible with minimal page content."
      ]
    },
  },
  {
    version: "3.3.0",
    date: "2026-04-07",
    title: "Home tax flow and parcel tile refinements",
    sections: {
      changed: [
        "Home tax flow, parcel tiles, and PIN data refinements."
      ]
    },
  },
  {
    version: "3.2.0",
    date: "2026-04-06",
    title: "New dashboard layout",
    sections: {
      added: [
        "Dashboard layout for the home property and levy hub."
      ]
    },
  },
  {
    version: "3.1.5",
    date: "2026-04-06",
    title: "Unified bill card and metro-in-card flow",
    sections: {
      changed: [
        "Bill card unifies metro-in-card flow and related copy."
      ]
    },
  },
  {
    version: "3.1.4",
    date: "2026-04-06",
    title: "Metro heading helper and a11y",
    sections: {
      changed: [
        "Metro heading helper and metro accessibility fixes."
      ]
    },
  },
  {
    version: "3.1.3",
    date: "2026-04-06",
    title: "Stack-only and multi-metro UI",
    sections: {
      changed: [
        "Metro card supports stack-only metros and combined multi-metro UI."
      ]
    },
  },
  {
    version: "3.1.2",
    date: "2026-04-06",
    title: "Metro tax share visualization",
    sections: {
      added: [
        "Metro district tax share with per-levy bar, debt headline, and metric tiles."
      ]
    },
  },
  {
    version: "3.1.1",
    date: "2026-04-06",
    title: "LG ID matching prefers directory ID",
    sections: {
      changed: [
        "District Contact matching prefers LG ID, then fuzzy name."
      ]
    },
  },
  {
    version: "3.1.0",
    date: "2026-04-06",
    title: "Unified levy detail modal",
    sections: {
      changed: [
        "Unified levy detail modal with glossary polish."
      ]
    },
  },
  {
    version: "3.0.2",
    date: "2026-04-05",
    title: "Home and metro UX; autofill hardening",
    sections: {
      changed: [
        "Home and metro UX improvements; harder address autofill handling."
      ]
    },
  },
  {
    version: "3.0.1",
    date: "2026-04-04",
    title: "Home help and single Start over",
    sections: {
      changed: [
        "Home help copy; single Start over control; metro embed polish."
      ]
    },
  },
  {
    version: "3.0.0",
    date: "2026-04-04",
    title: "Unified address and levy hub",
    sections: {
      added: [
        "Home becomes the address-to-levy hub with embedded metro."
      ],
      removed: [
        "Standalone /levy-breakdown page (permanent redirect to home)."
      ]
    },
  },
  {
    version: "2.2.0",
    date: "2026-04-03",
    title: "PIN/TAG levy stacks and district directory",
    sections: {
      added: [
        "Static Arapahoe levy stacks, PIN-to-TAG mapping, and special-district metadata."
      ]
    },
  },
  {
    version: "2.1.1",
    date: "2026-03-31",
    title: "Tools home page card UI",
    sections: {
      changed: [
        "Tools home page card UI updates."
      ]
    },
  },
  {
    version: "2.1.0",
    date: "2026-03-31",
    title: "Levy breakdown tool MVP",
    sections: {
      added: [
        "Levy breakdown tool reaches MVP."
      ]
    },
  },
  {
    version: "2.0.1",
    date: "2026-03-31",
    title: "Levy breakdown walkthrough",
    sections: {
      changed: [
        "Property tax levy breakdown walkthrough and polish."
      ]
    },
  },
  {
    version: "2.0.0",
    date: "2026-03-31",
    title: "Footer version and last-updated date",
    sections: {
      added: [
        "Footer shows app version and Mountain Time last-updated from build/deploy."
      ]
    },
  },
  {
    version: "1.0.3",
    date: "2026-03-20",
    title: "Levy snapshot date in the UI",
    sections: {
      changed: [
        "UI surfaces the levy snapshot date; bundled data regenerated to match."
      ]
    },
  },
  {
    version: "1.0.2",
    date: "2026-03-20",
    title: "UI/UX cleanup",
    sections: {
      changed: [
        "General UI/UX cleanup after the debt styling pass."
      ]
    },
  },
  {
    version: "1.0.1",
    date: "2026-03-20",
    title: "Debt styling and results card UI",
    sections: {
      changed: [
        "Red styling for debt; results card UI updates."
      ]
    },
  },
  {
    version: "1.0.0",
    date: "2026-03-20",
    title: "All metro districts; total metro share primary",
    sections: {
      added: [
        "Show all metro districts with total metro share as the primary result."
      ]
    },
  },
  {
    version: "0.1.3",
    date: "2026-03-17",
    title: "Mills definition and metro flow polish",
    sections: {
      changed: [
        "Updated mills definition; metro flow copy and input polish."
      ]
    },
  },
  {
    version: "0.1.2",
    date: "2026-03-17",
    title: "Metro result math and select a11y",
    sections: {
      changed: [
        "Clearer metro result math and wording; metro district select accessibility."
      ]
    },
  },
  {
    version: "0.1.1",
    date: "2026-03-17",
    title: "Clearer early flow instructions",
    sections: {
      changed: [
        "Clearer property details instructions and early flow fixes."
      ]
    },
  },
];
