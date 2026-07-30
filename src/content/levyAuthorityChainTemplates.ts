// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Canonical resident-facing strings for the authority chain panel.
 * JSON supplies facts only; wording lives here (KISS / DRY).
 *
 * Master trail (shared step order + chrome) + family packs (`school`, `county`)
 * inject nouns, measure kinds, budget labels, and mills takeaways.
 *
 * Ideology (also in `docs/levy-explainer-authoring.md`): always show the
 * next-best official source. Prefer the exact document; when it is missing,
 * wrong language, or dead, link where we looked (year file library / hub) so
 * residents understand why, and use openGaps for honest limits. Never invent
 * a 404 path or leave a sourced fact with nowhere to go when a hub exists.
 */

export const AUTHORITY_CHAIN_HEADING = "Who authorized this?";

export const SUMMARY_ATTRIBUTION_TEXT =
  "According to Arapahoe County's certified election results";

/** Step titles shared across families (budget title comes from the pack). */
export const STEP_TITLE_WHO_GETS = "Who gets this money?";
export const STEP_TITLE_WHAT_CHANGED = "What changed?";
export const STEP_TITLE_HOW_VOTED = "How people voted";

/** Fact labels shared across families (budget fact label comes from the pack). */
export const FACT_LABEL_COUNTY_LIST_NAME = "Name on the county tax list";
export const FACT_LABEL_BALLOT_TEXT = "Ballot text";
export const FACT_VALUE_COUNTY_ELECTION_NOTICE = "County election notice";
export const FACT_VALUE_COUNTY_SAMPLE_BALLOT = "County sample ballot";
/** When no stable English notice or sample ballot can be linked (next-best: hub). */
export const FACT_VALUE_BALLOT_TEXT_UNAVAILABLE =
  "Not available in county election files";

export const GOVERNING_BODY_LABELS = {
  school_board: "school board",
  board: "board",
  board_of_county_commissioners: "Board of County Commissioners",
} as const;

export type LevyAuthorityChainGoverningBody =
  keyof typeof GOVERNING_BODY_LABELS;

export type LevyAuthorityChainFamily = "school" | "county";

export const OPEN_GAP_BODIES = {
  "no-fund-level-mill-split":
    "On your bill, this authority is one total mill rate, not separate amounts for each ballot issue. Public county records do not show how many mills came from each voter approval, from bond repayment, or from the base levy, so we cannot say which vote accounts for this year's change.",
  /**
   * Use when a measure's ballotTextKind is `unavailable`. Resident-facing only:
   * next-best is the year's county file library (show where we looked).
   */
  "no-stable-ballot-text":
    "For at least one ballot measure in this trail, Arapahoe County's published election files do not include a Notice of Election or a usable English sample ballot. We link that year's Past Elections File Library section so you can see what the county posted. Vote totals still come from the Official Summary Report.",
  /** County temporary-discount story: one published total, no component split. */
  "no-temporary-credit-mill-split":
    "The county publishes one total rate on the bill (15.885 mills for Tax Year 2024). Ballot Issue 1A's maximum rate of 15.821 mills is not that same total, so the ballot cap does not describe every part of today's published county rate. From the rate table alone, we cannot separate how much of the jump came from ending the temporary tax credit versus other small year-to-year changes.",
} as const;

export type LevyAuthorityChainOpenGapId = keyof typeof OPEN_GAP_BODIES;

export const VOTES_STEP_BODY = "County certified totals:";

export type LevyAuthorityChainMeasureKind =
  | "override"
  | "bond"
  | "debt_free_mill"
  | "tabor_revenue_retention";

export type LevyAuthorityChainBodyLead =
  | "approved"
  | "also_approved"
  | "earlier_approved";

export const BODY_LEAD_PHRASES: Record<LevyAuthorityChainBodyLead, string> = {
  approved: "Voters approved",
  also_approved: "Voters also approved",
  earlier_approved: "Voters earlier approved",
};

/** School pack: override cap sentence; interpolates curated max mills per year. */
export const OVERRIDE_MAX_MILL_SENTENCE =
  "The rate could not rise by more than one mill in any one year.";

export function overrideMaxMillSentence(maxMillIncreasePerYear: number): string {
  if (maxMillIncreasePerYear === 1) {
    return OVERRIDE_MAX_MILL_SENTENCE;
  }
  return `The rate could not rise by more than ${maxMillIncreasePerYear} mills in any one year.`;
}

const SCHOOL_BOND_REPAYMENT_CHANGE_SENTENCE =
  "Bonds may be sold over time, so the repayment part of your school tax can change.";

const SCHOOL_BOND_CEILING_SENTENCE =
  "That vote set ceilings. It did not lock in one fixed share of today's total rate.";

const SCHOOL_DEBT_FREE_MILL_CLOSING = "That is a mill levy, not a bond.";

/** Default school mills chrome (also exported for unit tests). */
export const MILLS_STEP_BODY =
  "The county publishes one total rate for this authority each year. The figures below compare two tax years.";

const COUNTY_MILLS_STEP_BODY =
  "Ballot Issue 1A changed the amount of tax money the county is required to return to you. Voters let the county keep money that TABOR would otherwise have required returning to taxpayers, so you pay more on the county line of your bill. That vote did not raise the county's maximum tax rate. Before 1A, the county stayed under the TABOR keep-limit with a temporary tax credit that lowered the mill rate on your bill (collecting less up front, instead of taking the full authorized amount and sending refunds later). After voters allowed the county to keep more, that credit ended and the billed rate rose. The figures below are the county's total rate for Tax Years 2023 and 2024, the years that show that jump.";

export type LevyAuthorityChainMillsBodyTerm = {
  termId: "term-mill-levy" | "term-tabor";
  match: string;
};

export type LevyAuthorityChainFamilyPack = {
  budgetStepTitle: string;
  budgetFactLabel: string;
  millsStepBody: string;
  /** Glossary popovers on the mills step body (first-match each; non-overlapping). */
  millsBodyTerms: readonly LevyAuthorityChainMillsBodyTerm[];
  measureKinds: ReadonlySet<LevyAuthorityChainMeasureKind>;
  ballotStepTitle: (
    ballotIssue: string,
    kind: LevyAuthorityChainMeasureKind,
    titleYearSuffix?: string,
  ) => string;
  ballotStepBody: (
    kind: LevyAuthorityChainMeasureKind,
    detail: string,
    bodyLead: LevyAuthorityChainBodyLead,
    options?: {
      maxMillIncreasePerYear?: number;
      maxAuthorizedMills?: number;
    },
  ) => string;
  budgetBody: (authorityShortName: string, detail: string) => string;
};

const SCHOOL_PACK: LevyAuthorityChainFamilyPack = {
  budgetStepTitle: "What the district's budget says",
  budgetFactLabel: "District budget",
  millsStepBody: MILLS_STEP_BODY,
  millsBodyTerms: [{ termId: "term-mill-levy", match: "rate" }],
  measureKinds: new Set(["override", "bond", "debt_free_mill"]),
  ballotStepTitle(ballotIssue, kind, titleYearSuffix) {
    const yearPart = titleYearSuffix ? ` (${titleYearSuffix})` : "";
    switch (kind) {
      case "override":
        return `Ballot Issue ${ballotIssue}: More operating money`;
      case "bond":
        return `Ballot Issue ${ballotIssue}: Borrowing for buildings${yearPart}`;
      case "debt_free_mill":
        return `Ballot Issue ${ballotIssue}: Debt-free schools mill levy`;
      default:
        throw new Error(`school pack does not support measure kind: ${kind}`);
    }
  },
  ballotStepBody(kind, detail, bodyLead, options) {
    const lead = BODY_LEAD_PHRASES[bodyLead];
    switch (kind) {
      case "override": {
        const parts = [`${lead} ${detail}.`];
        if (options?.maxMillIncreasePerYear != null) {
          parts.push(overrideMaxMillSentence(options.maxMillIncreasePerYear));
        }
        return parts.join(" ");
      }
      case "bond":
        return `${lead} borrowing ${detail}. ${SCHOOL_BOND_CEILING_SENTENCE} ${SCHOOL_BOND_REPAYMENT_CHANGE_SENTENCE}`;
      case "debt_free_mill":
        return `${lead} a tax increase (${detail}) for classroom and facility needs, paid in cash instead of new bonds for those costs. ${SCHOOL_DEBT_FREE_MILL_CLOSING}`;
      default:
        throw new Error(`school pack does not support measure kind: ${kind}`);
    }
  },
  budgetBody(authorityShortName, detail) {
    return `${authorityShortName}'s budget ${detail}.`;
  },
};

const COUNTY_PACK: LevyAuthorityChainFamilyPack = {
  budgetStepTitle: "What the county's budget says",
  budgetFactLabel: "County budget",
  millsStepBody: COUNTY_MILLS_STEP_BODY,
  millsBodyTerms: [
    { termId: "term-tabor", match: "TABOR" },
    { termId: "term-mill-levy", match: "total rate" },
  ],
  measureKinds: new Set(["tabor_revenue_retention"]),
  ballotStepTitle(ballotIssue, kind) {
    switch (kind) {
      case "tabor_revenue_retention":
        return `Ballot Issue ${ballotIssue}: Ending the temporary tax credit on your bill`;
      default:
        throw new Error(`county pack does not support measure kind: ${kind}`);
    }
  },
  ballotStepBody(kind, detail, bodyLead, options) {
    const lead = BODY_LEAD_PHRASES[bodyLead];
    switch (kind) {
      case "tabor_revenue_retention": {
        if (options?.maxAuthorizedMills == null) {
          throw new Error(
            "tabor_revenue_retention requires maxAuthorizedMills",
          );
        }
        const max = options.maxAuthorizedMills.toFixed(3);
        return `${lead} letting the county keep and spend money that under TABOR would otherwise have to go back to taxpayers, for needs such as ${detail}. People often call this kind of vote de-Brucing. The ballot said this was without a new tax and without raising the maximum rate (${max} mills).`;
      }
      default:
        throw new Error(`county pack does not support measure kind: ${kind}`);
    }
  },
  budgetBody(authorityShortName, detail) {
    return `${authorityShortName}'s budget ${detail}.`;
  },
};

const FAMILY_PACKS: Record<
  LevyAuthorityChainFamily,
  LevyAuthorityChainFamilyPack
> = {
  school: SCHOOL_PACK,
  county: COUNTY_PACK,
};

export function getAuthorityChainFamilyPack(
  family: LevyAuthorityChainFamily,
): LevyAuthorityChainFamilyPack {
  return FAMILY_PACKS[family];
}

export function whoGetsBody(displayName: string): string {
  return displayName;
}

export function millsYearLabel(year: number): string {
  return `${year} total rate (mills)`;
}

export function voteFactLabel(ballotIssue: string, electionMonthYear: string): string {
  return `Ballot Issue ${ballotIssue} (${electionMonthYear})`;
}

export function formatVoteTotals(
  yes: string,
  yesPct: string,
  no: string,
  noPct: string,
): string {
  return `Yes: ${yes} (${yesPct})\nNo: ${no} (${noPct})`;
}

/** Format ballot issue list for summary ("4A and 4B" or "4A"). */
export function formatBallotIssueList(issues: string[]): string {
  if (issues.length === 0) return "";
  if (issues.length === 1) return `Ballot Issue ${issues[0]}`;
  const last = issues[issues.length - 1]!;
  const rest = issues.slice(0, -1).map((i) => `Ballot Issue ${i}`);
  return `${rest.join(", ")} and Ballot Issue ${last}`;
}

export function buildSummarySecondSentence(
  governingBody: LevyAuthorityChainGoverningBody,
): string {
  return `The ${GOVERNING_BODY_LABELS[governingBody]} sets the rate that appears on your bill.`;
}

export function buildSummaryVoterClause(
  issues: string[],
  election: string,
  note?: string,
): string {
  const list = formatBallotIssueList(issues);
  const notePart = note ? ` ${note}` : "";
  return `voters approved ${list} in ${election}${notePart}`;
}

export function buildSummaryAlsoClause(
  issues: string[],
  election: string,
  suffix?: string,
): string {
  const list = formatBallotIssueList(issues);
  const suffixPart = suffix ? ` ${suffix}` : "";
  return `Voters had also approved ${list} in ${election}${suffixPart}`;
}
