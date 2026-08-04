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
 * accurate technical takeaways over resident-softened marketing. Earlier
 * releases are not fully backfilled yet; fill them in when convenient.
 */

export type ChangelogEntry = {
  /** Semver matching a shipped `package.json` version. */
  version: string;
  /** Calendar date the version shipped (YYYY-MM-DD, America/Denver). */
  date: string;
  /** One-line resident takeaway. */
  title: string;
  /** Short bullets: what changed for someone using the tool. */
  highlights: string[];
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "4.6.2",
    date: "2026-08-04",
    title: "E2e hardening and synthetic multi-PIN fixtures",
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
];
