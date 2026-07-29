// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Canonical resident-facing strings for the authority chain panel.
 * JSON supplies facts only; wording lives here (KISS / DRY).
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

/** Step titles (fixed order in the built trail). */
export const STEP_TITLE_WHO_GETS = "Who gets this money?";
export const STEP_TITLE_WHAT_CHANGED = "What changed?";
export const STEP_TITLE_HOW_VOTED = "How people voted";
export const STEP_TITLE_DISTRICT_BUDGET = "What the district's budget says";

/** Fact labels. */
export const FACT_LABEL_COUNTY_LIST_NAME = "Name on the county tax list";
export const FACT_LABEL_BALLOT_TEXT = "Ballot text";
export const FACT_LABEL_DISTRICT_BUDGET = "District budget";
export const FACT_VALUE_COUNTY_ELECTION_NOTICE = "County election notice";
export const FACT_VALUE_COUNTY_SAMPLE_BALLOT = "County sample ballot";
/** When no stable English notice or sample ballot can be linked (next-best: hub). */
export const FACT_VALUE_BALLOT_TEXT_UNAVAILABLE =
  "Not available in county election files";

export const GOVERNING_BODY_LABELS = {
  school_board: "school board",
  board: "board",
} as const;

export type LevyAuthorityChainGoverningBody =
  keyof typeof GOVERNING_BODY_LABELS;

export const OPEN_GAP_BODIES = {
  "no-fund-level-mill-split":
    "On your bill, this authority is one total mill rate, not separate amounts for each ballot issue. Public county records do not show how many mills came from each voter approval, from bond repayment, or from the base levy, so we cannot say which vote accounts for this year's change.",
  /**
   * Use when a measure's ballotTextKind is `unavailable`. Resident-facing only:
   * next-best is the year's county file library (show where we looked).
   */
  "no-stable-ballot-text":
    "For at least one ballot measure in this trail, Arapahoe County's published election files do not include a Notice of Election or a usable English sample ballot. We link that year's Past Elections File Library section so you can see what the county posted. Vote totals still come from the Official Summary Report.",
} as const;

export type LevyAuthorityChainOpenGapId = keyof typeof OPEN_GAP_BODIES;

/** Mill-rate step body; glossary popover on "rate". */
export const MILLS_STEP_BODY =
  "The county publishes one total rate for this authority each year. That is the number this app charts.";

export const VOTES_STEP_BODY = "County certified totals:";

export const BOND_REPAYMENT_CHANGE_SENTENCE =
  "Bonds may be sold over time, so the repayment part of your school tax can change.";

export const BOND_CEILING_SENTENCE =
  "That vote set ceilings. It did not lock in one fixed share of today's total rate.";

export const OVERRIDE_MAX_MILL_SENTENCE =
  "The rate could not rise by more than one mill in any one year.";

/** Override cap sentence; interpolates the curated max mills per year. */
export function overrideMaxMillSentence(maxMillIncreasePerYear: number): string {
  if (maxMillIncreasePerYear === 1) {
    return OVERRIDE_MAX_MILL_SENTENCE;
  }
  return `The rate could not rise by more than ${maxMillIncreasePerYear} mills in any one year.`;
}

export const DEBT_FREE_MILL_CLOSING =
  "That is a mill levy, not a bond.";

export type LevyAuthorityChainMeasureKind = "override" | "bond" | "debt_free_mill";

export type LevyAuthorityChainBodyLead =
  | "approved"
  | "also_approved"
  | "earlier_approved";

export const BODY_LEAD_PHRASES: Record<LevyAuthorityChainBodyLead, string> = {
  approved: "Voters approved",
  also_approved: "Voters also approved",
  earlier_approved: "Voters earlier approved",
};

export function whoGetsBody(displayName: string): string {
  return `This row goes to ${displayName}.`;
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

export function ballotStepTitle(
  ballotIssue: string,
  kind: LevyAuthorityChainMeasureKind,
  titleYearSuffix?: string,
): string {
  const yearPart = titleYearSuffix ? ` (${titleYearSuffix})` : "";
  switch (kind) {
    case "override":
      return `Ballot Issue ${ballotIssue}: More operating money`;
    case "bond":
      return `Ballot Issue ${ballotIssue}: Borrowing for buildings${yearPart}`;
    case "debt_free_mill":
      return `Ballot Issue ${ballotIssue}: Debt-free schools mill levy`;
  }
}

export function ballotStepBody(
  kind: LevyAuthorityChainMeasureKind,
  detail: string,
  bodyLead: LevyAuthorityChainBodyLead,
  maxMillIncreasePerYear?: number,
): string {
  const lead = BODY_LEAD_PHRASES[bodyLead];
  switch (kind) {
    case "override": {
      const parts = [`${lead} ${detail}.`];
      if (maxMillIncreasePerYear != null) {
        parts.push(overrideMaxMillSentence(maxMillIncreasePerYear));
      }
      return parts.join(" ");
    }
    case "bond":
      return `${lead} borrowing ${detail}. ${BOND_CEILING_SENTENCE} ${BOND_REPAYMENT_CHANGE_SENTENCE}`;
    case "debt_free_mill":
      return `${lead} a tax increase (${detail}) for classroom and facility needs, paid in cash instead of new bonds for those costs. ${DEBT_FREE_MILL_CLOSING}`;
  }
}

export function districtBudgetBody(
  authorityShortName: string,
  detail: string,
): string {
  return `${authorityShortName}'s budget ${detail}.`;
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
