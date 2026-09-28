// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Durable list of official documents we could not locate for authority-chain
 * trails. Canonical for authors (edit here; do not park hunts only in
 * `docs/_working/`). Open items also render in a disclosure on `/sources`.
 *
 * When a live Notice / English sample appears: flip `status` to `resolved`,
 * update the authority-chain JSON (`ballotTextKind`, sources, openGaps), then
 * keep the row here as history or remove it.
 */

export type AuthorityChainUnlocatedSourceStatus = "open" | "resolved";

export type AuthorityChainUnlocatedSource = {
  /** Stable id for authors and tests. */
  id: string;
  status: AuthorityChainUnlocatedSourceStatus;
  /** Month noted (YYYY-MM). */
  notedAsOf: string;
  /** Authority name residents recognize. */
  authorityLabel: string;
  /** County AUTH / levy line code when known. */
  authCode: string;
  /** Ballot or measure label (e.g. Ballot Issue 4C, November 2020). */
  measureLabel: string;
  /** What we looked for (resident-plain). */
  sought: string;
  /** Where we looked (resident-plain). */
  lookedWhere: string;
  /** What the trail links instead (next-best). */
  nextBest: {
    text: string;
    url: string;
  };
  /** Optional author-only note (not shown on /sources). */
  authorNote?: string;
};

/**
 * Disclosure label on `/sources` for open rows.
 * Progressive disclosure: default page stays short.
 */
export const AUTHORITY_CHAIN_UNLOCATED_SOURCES_DISCLOSURE =
  "Official documents we could not find";

export const AUTHORITY_CHAIN_UNLOCATED_SOURCES: readonly AuthorityChainUnlocatedSource[] =
  [
    {
      id: "littleton-0601-4c-2020-ballot-text",
      status: "open",
      notedAsOf: "2026-08",
      authorityLabel: "Littleton Public Schools",
      authCode: "0601",
      measureLabel: "Ballot Issue 4C (November 2020)",
      sought:
        "Arapahoe County Notice of Election / TABOR notice, or a usable English sample ballot, with the Ballot Issue 4C wording.",
      lookedWhere:
        "Arapahoe County Past Elections File Library for the 2020 general election. A Spanish sample ballot with Asunto 4C wording is published; no English Notice or English sample with 4C wording was found among the currently published files in that library. Vote totals are in the 2020 Official Summary Report.",
      nextBest: {
        text: "2020 County sample ballot (Spanish)",
        url: "https://files.arapahoeco.gov/Your%20County/Arapahoe%20Votes/Documents/Records%20And%20data/Past%20Elections%20File%20Library/2020/2020%20General%20Sample%20Ballot%20SPA.pdf#page=3",
      },
      authorNote:
        "Trail uses ballotTextKind sample_ballot + ballotTextLanguage es + ballotTextEnglishSource ai_translation + openGap ballot-text-spanish-only-ai-translation. County file library lists the SPA PDF twice (identical). Optional later hunt: English Notice/sample via clerk, Wayback, Colorado SOS.",
    },
    {
      id: "sky-ranch-4571-2020-ballot-wording",
      status: "open",
      notedAsOf: "2026-08",
      authorityLabel: "Sky Ranch Metropolitan District No. 3",
      authCode: "4571",
      measureLabel: "November 2020 district election",
      sought:
        "A public ballot issue letter, Notice of Election, or sample ballot with the district authorization wording.",
      lookedWhere:
        "Arapahoe County's 2020 election files and the Sky Ranch district website. The district-run election does not appear in the county's 2020 Official Summary.",
      nextBest: {
        text: "Sky Ranch Metropolitan District No. 3 2024 audit",
        url: "https://skyranch.colorado.gov/sites/g/files/lrnvjt826/files/SRMD3-Final-Audit-FS-Report-2024_0.pdf#page=16",
      },
      authorNote:
        "Do not assign a Ballot Issue letter. The authority-chain entry uses the 2024 audit's November 3, 2020 election narrative.",
    },
    {
      id: "sky-ranch-4571-2020-certified-tally",
      status: "open",
      notedAsOf: "2026-08",
      authorityLabel: "Sky Ranch Metropolitan District No. 3",
      authCode: "4571",
      measureLabel: "November 2020 district election",
      sought: "A public certified yes/no tally for the district authorization.",
      lookedWhere:
        "Arapahoe County's 2020 Official Summary and the Sky Ranch district website. No public certified tally was located.",
      nextBest: {
        text: "Sky Ranch Metropolitan District No. 3 2024 audit",
        url: "https://skyranch.colorado.gov/sites/g/files/lrnvjt826/files/SRMD3-Final-Audit-FS-Report-2024_0.pdf#page=16",
      },
      authorNote:
        "Metro validation accepts a cited official authorization record instead of requiring fabricated vote totals.",
    },
    {
      id: "smfr-4100-7a-2025-arapahoe-ballot-notice",
      status: "open",
      notedAsOf: "2026-08",
      authorityLabel: "South Metro Fire Rescue Fire Protection District",
      authCode: "4100",
      measureLabel: "Ballot Issue 7A (November 2025)",
      sought:
        "Arapahoe County Notice of Election / TABOR notice, or Arapahoe sample ballot, with the Ballot Issue 7A wording.",
      lookedWhere:
        "Arapahoe County election canvass documents for the 2025 coordinated election (Official Summary located). A county files-host path for an Arapahoe TABOR Notice was checked during authoring; that PDF is not currently available.",
      nextBest: {
        text: "Douglas County Ballot Issue Notice (Ballot Issue 7A)",
        url: "https://www.douglasco.gov/documents/2025-coordinated-election-ballot-issue-notices-tabor-book.pdf#page=11",
      },
      authorNote:
        "Multi-county district (Arapahoe, Douglas, Jefferson). Trail cites Douglas County TABOR booklet for ballot wording (same Ballot Issue 7A text), closed-summary NOTE for Arapahoe Notice not currently available, and Arapahoe Official Summary for Arapahoe-only vote totals + openGap multi-county-arapahoe-votes-only. Prefer Arapahoe Notice/sample when it is currently available again.",
    },
    {
      id: "aurora-3001-tax-levy-ordinance",
      status: "open",
      notedAsOf: "2026-09",
      authorityLabel: "City of Aurora",
      authCode: "3001",
      measureLabel: "Annual Tax Levy Ordinance (temporary mill under TABOR)",
      sought:
        "A durable City of Aurora Tax Levy Ordinance PDF (for example Ordinance 2024-70 for the 2025 collection year, or Ordinance 2025-97 for 2026) that states the mill rate and any temporary property-tax credit.",
      lookedWhere:
        "City Council agenda listings name the Tax Levy Ordinances, but the public GetFile agenda packages checked during authoring were agenda text only (not the full ordinance PDFs). The 2026 Adopted Budget discusses the temporary mill reductions.",
      nextBest: {
        text: "2026 Operating and Capital Improvement Budget (property tax / TABOR)",
        url: "https://www.auroragov.org/common/pages/GetFile.ashx?key=1%2f5CAWoA#page=108",
      },
      authorNote:
        "City family entry city-of-aurora-authority-chain uses the adopted budget as the official cite for temporary TABOR mill reductions. Prefer a stable ordinance PDF deep-link when one is currently available.",
    },
    {
      id: "antelope-hills-4042-founding-ordinance",
      status: "open",
      notedAsOf: "2026-09",
      authorityLabel: "Antelope Hills General Improvement District",
      authCode: "4042",
      measureLabel: "Town ordinance creating the municipal GID",
      sought:
        "A stable public copy of the Town of Bennett ordinance that created Antelope Hills General Improvement District (Town records cite Ordinance No. 383, Series 1999).",
      lookedWhere:
        "Town of Bennett website and Public Records page. Signed Resolution 2025-01GID (hosted under public/sourced-records/ after CORA) cites Ordinance 383 and C.R.S. § 31-25-609; the ordinance text itself is still not posted at a durable public file URL.",
      nextBest: {
        text: "Town of Bennett Public Records",
        url: "https://www.bennettco.gov/town-clerk/page/public-records",
      },
      authorNote:
        "municipal_gid entry cites C.R.S. § 31-25-609 for board structure. openGap municipal-gid-founding-ordinance-unlocated until Ordinance 383 PDF is sourced. CORA packet PDFs live under public/sourced-records/town-of-bennett/antelope-hills-gid/.",
    },
    {
      id: "antelope-hills-4042-bond-debt-disclosures",
      status: "open",
      notedAsOf: "2026-09",
      authorityLabel: "Antelope Hills General Improvement District",
      authCode: "4042",
      measureLabel: "Outstanding principal / bond continuing disclosures",
      sought:
        "A public official statement, amortization schedule, or EMMA continuing disclosure stating remaining principal and maturity for this GID's debt.",
      lookedWhere:
        "EMMA issuer browse for ANTELOPE HILLS COLO GEN IMPT DIST (CUSIP 03666RAA7 present; Financial / OS / Event tabs empty). Town CORA packet (now under public/sourced-records/) names Series 2006 budgeted principal, Board-directed $85k, and stated 2027 payoff; remaining balance still not stated.",
      nextBest: {
        text: "Town of Bennett Public Records",
        url: "https://www.bennettco.gov/town-clerk/page/public-records",
      },
      authorNote:
        "Trail cites sourced-records budget/minutes for $85k, 2027 payoff date, and Series 2006 budgeted principal. openGap municipal-gid-bond-debt-records-unlocated remains for remaining principal / remittance audit. Do not claim remittances were stolen.",
    },
  ];

/** Open blockers shown on `/sources`. */
export function openAuthorityChainUnlocatedSources(): AuthorityChainUnlocatedSource[] {
  return AUTHORITY_CHAIN_UNLOCATED_SOURCES.filter((row) => row.status === "open");
}
