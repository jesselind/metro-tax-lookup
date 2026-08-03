// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Canonical resident-facing strings for the authority chain panel.
 * JSON supplies facts only; wording lives here (KISS / DRY).
 *
 * Master trail (shared step order + chrome) + family packs (`school`, `county`,
 * `metro`) inject nouns, measure kinds, budget labels, and mills takeaways.
 *
 * Ideology (also in `docs/levy-explainer-authoring.md`): always show the
 * next-best official source. Prefer the exact document; when it is missing,
 * wrong language, or dead, link where we looked (year file library / hub) so
 * residents understand why, and use openGaps for honest limits. Never invent
 * a 404 path or leave a sourced fact with nowhere to go when a hub exists.
 *
 * Hard-facts rule (ballot substance):
 * - `notice` / English `sample_ballot`: pack ballot body + `detail` from that PDF.
 * - Spanish sample (locked): if that is the only ballot wording we can link among
 *   currently published county files, **use it**. Do not imply English never existed.
 *   Set `ballotTextLanguage: "es"` + `ballotTextEnglishSource: "ai_translation"`.
 *   Link the Spanish PDF; intro via {@link nonEnglishSampleAiTranslatedMeasureIntro};
 *   AI English behind a collapsed disclosure
 *   (label discloses AI / not legal English; body is translated `detail` only).
 *   Disclose clearly: not legal English ballot text, not an official
 *   county English translation. Keep openGap + unlocated row for missing English.
 * - `unavailable`: {@link unavailableBallotMeasureBody} only; omit `detail`;
 *   put other official restatements in `supportingFacts` / `budget`.
 * Dead / resident-unreachable URLs are not cites.
 */

export const AUTHORITY_CHAIN_HEADING = "Who authorized this?";

/** Default bill wording for county-family entries when JSON omits `governmentBillName`. */
export const COUNTY_GOVERNMENT_BILL_NAME_DEFAULT = "the county";

/** Default bill wording for metro-family entries when JSON omits `governmentBillName`. */
export const METRO_GOVERNMENT_BILL_NAME_DEFAULT = "the district";

/** Step titles shared across families (budget title comes from the pack). */
export const STEP_TITLE_WHO_GETS = "Who gets this money?";
export const STEP_TITLE_WHAT_CHANGED = "What changed?";
export const STEP_TITLE_HOW_VOTED = "How people voted";

/** Fact labels shared across families (budget fact label comes from the pack). */
export const FACT_LABEL_COUNTY_LIST_NAME = "Name on the county tax list";
export const FACT_LABEL_BALLOT_TEXT = "Ballot text";
export const FACT_VALUE_COUNTY_ELECTION_NOTICE = "County election notice";
export const FACT_VALUE_COUNTY_SAMPLE_BALLOT = "County sample ballot";
/** Sample ballot linked in Spanish (English Notice/sample not located among published files). */
export const FACT_VALUE_COUNTY_SAMPLE_BALLOT_SPANISH_ONLY =
  "County sample ballot (Spanish)";
/** When no stable notice or sample ballot can be linked (next-best: hub). */
export const FACT_VALUE_BALLOT_TEXT_UNAVAILABLE =
  "Not available in county election files";

/**
 * Allowed `authority.governingBody` ids in JSON (validation + future trail inject).
 * Do not invent unsourced summary claims from these (e.g. who "sets" the rate).
 */
export const GOVERNING_BODY_IDS = [
  "school_board",
  "board",
  "board_of_county_commissioners",
] as const;

export type LevyAuthorityChainGoverningBody =
  (typeof GOVERNING_BODY_IDS)[number];

export type LevyAuthorityChainFamily = "school" | "county" | "metro";

/** Static open-gap copy (no entry-specific numbers). */
export const OPEN_GAP_BODIES = {
  "no-fund-level-mill-split":
    "On your bill, this authority is one total mill rate, not separate amounts for each ballot issue. Public county records do not show how many mills came from each voter approval, from bond repayment, or from the base levy, so we cannot say which vote accounts for this year's change.",
  /**
   * Use when a measure's ballotTextKind is `unavailable`. Resident-facing only:
   * next-best is the year's county file library (show where we looked).
   */
  "no-stable-ballot-text":
    "For at least one ballot measure in this trail, Arapahoe County's published election files do not include a Notice of Election or a usable English sample ballot. We link that year's Past Elections File Library section so you can see what the county posted. Vote totals still come from the Official Summary Report.",
  /**
   * Use when the linked sample is non-English and the measure body English is
   * an AI translation (ballotTextLanguage es + ballotTextEnglishSource
   * ai_translation).
   */
  "ballot-text-spanish-only-ai-translation":
    "For at least one ballot measure in this trail, we could not locate an English Notice of Election or English sample ballot among Arapahoe County's currently published election files. Those files do include a Spanish sample ballot with the measure wording, which we link. That does not mean an English ballot never existed. The English wording in the measure step is an AI translation of that Spanish sample. It is not the legal English ballot text, and it is not an official county English translation.",
} as const;

/**
 * Parameterized gap: billed total vs ballot max after a temporary tax credit ends.
 * Numbers come from the entry's mills pair + TABOR retention measure (not pack prose).
 */
export const OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT =
  "no-temporary-credit-mill-split" as const;

export type LevyAuthorityChainOpenGapId =
  | keyof typeof OPEN_GAP_BODIES
  | typeof OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT;

export function temporaryCreditMillSplitOpenGapBody(params: {
  publisherBillName: string;
  currentMills: string;
  currentYear: number;
  ballotIssue: string;
  maxAuthorizedMills: number;
}): string {
  const max = params.maxAuthorizedMills.toFixed(3);
  const publisher = capitalizeResidentPhrase(params.publisherBillName);
  return `${publisher} publishes one total rate on the bill (${params.currentMills} mills for Tax Year ${params.currentYear}). Ballot Issue ${params.ballotIssue}'s maximum rate of ${max} mills is not that same total, so the ballot cap does not describe every part of today's published county rate. From the rate table alone, we cannot separate how much of the jump came from ending the temporary tax credit versus other small year-to-year changes.`;
}

/** All known openGap ids (static + parameterized). */
export const KNOWN_OPEN_GAP_IDS: ReadonlySet<LevyAuthorityChainOpenGapId> =
  new Set<LevyAuthorityChainOpenGapId>([
    ...(Object.keys(OPEN_GAP_BODIES) as Array<keyof typeof OPEN_GAP_BODIES>),
    OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT,
  ]);

export const VOTES_STEP_BODY = "County certified totals:";

export type LevyAuthorityChainMeasureKind =
  | "override"
  | "bond"
  | "debt_free_mill"
  | "tabor_revenue_retention"
  /** Metro O&M / general mill authorization (bill-first `titlePlain` required). */
  | "operations_mill";

export type LevyAuthorityChainBodyLead =
  | "approved"
  | "also_approved"
  | "earlier_approved";

export const BODY_LEAD_PHRASES: Record<LevyAuthorityChainBodyLead, string> = {
  approved: "Voters approved",
  also_approved: "Voters also approved",
  earlier_approved: "Voters earlier approved",
};

/**
 * Measure-step body when `ballotTextKind` is `unavailable`.
 * Claims only that voters approved the named issue in that election (vote
 * totals stay on How people voted + resultsSource). Does not interpolate
 * program detail. Reusable for every family/kind until a live ballot PDF exists.
 */
export function unavailableBallotMeasureBody(
  ballotIssue: string,
  electionMonthYear: string,
): string {
  return `Voters approved Ballot Issue ${ballotIssue} in ${electionMonthYear}. The county's published election files do not include the ballot wording for this measure.`;
}

/**
 * Sentence used when English Notice/sample was not located among currently
 * published county files (Spanish sample is linked separately). Linked at
 * build time to the year's Past Elections File Library hub.
 */
export const NON_ENGLISH_SAMPLE_ENGLISH_NOT_LOCATED_SENTENCE =
  "We could not locate an English Notice of Election or English sample ballot among the currently published files.";

/**
 * Measure-step intro when the official linked sample is Spanish (English
 * Notice/sample not located among currently published county files) and English
 * substance is an AI translation behind {@link AUTHORITY_CHAIN_AI_TRANSLATION_DISCLOSURE}.
 * Plain findability ("we could only locate"); do not imply an English ballot never
 * existed. The English-not-located sentence is linked to the file-library hub at
 * build time.
 */
export function nonEnglishSampleAiTranslatedMeasureIntro(params: {
  ballotIssue: string;
  electionMonthYear: string;
  /** Resident language label, e.g. "Spanish". */
  languageLabel: string;
}): string {
  return `Voters approved Ballot Issue ${params.ballotIssue} in ${params.electionMonthYear}. We could only locate a sample ballot in ${params.languageLabel}. ${NON_ENGLISH_SAMPLE_ENGLISH_NOT_LOCATED_SENTENCE}`;
}

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

const METRO_BOND_REPAYMENT_CHANGE_SENTENCE =
  "Bonds may be sold over time, so the repayment part of your metro district tax can change.";

const METRO_BOND_CEILING_SENTENCE =
  "That vote set ceilings. It did not lock in one fixed share of today's total rate.";

const SCHOOL_DEBT_FREE_MILL_CLOSING = "That is a mill levy, not a bond.";

/**
 * Default mills chrome for school and county packs when the entry does not
 * supply an entry-specific `mills.stepBody` takeaway.
 */
export const MILLS_STEP_BODY =
  "The county publishes one total rate for this authority each year. The figures below compare two tax years.";

export type LevyAuthorityChainMillsBodyTerm = {
  termId: "term-mill-levy" | "term-tabor";
  match: string;
};

export type LevyAuthorityChainBallotTitleOptions = {
  titleYearSuffix?: string;
  /** Plain-language title after "Ballot Issue X: " (required for some kinds). */
  titlePlain?: string;
};

export type LevyAuthorityChainFamilyPack = {
  budgetStepTitle: string;
  budgetFactLabel: string;
  /** Default "What changed?" body when JSON omits `mills.stepBody`. */
  millsStepBody: string;
  /** Glossary popovers on the default mills body (entry may override via `mills.bodyTerms`). */
  millsBodyTerms: readonly LevyAuthorityChainMillsBodyTerm[];
  measureKinds: ReadonlySet<LevyAuthorityChainMeasureKind>;
  ballotStepTitle: (
    ballotIssue: string,
    kind: LevyAuthorityChainMeasureKind,
    options?: LevyAuthorityChainBallotTitleOptions,
  ) => string;
  /**
   * Ballot-framed measure body for official English `notice` / `sample_ballot`
   * text. Do not use for Spanish AI-translated samples
   * (`ballotTextLanguage: "es"` + `ballotTextEnglishSource: "ai_translation"`);
   * the builder supplies findability copy + disclosed translation instead.
   * For `unavailable`, the builder uses {@link unavailableBallotMeasureBody}
   * (hard-facts rule).
   */
  ballotStepBody: (
    kind: LevyAuthorityChainMeasureKind,
    detail: string,
    bodyLead: LevyAuthorityChainBodyLead,
    options?: {
      maxMillIncreasePerYear?: number;
      maxAuthorizedMills?: number;
      /** County TABOR retention: who keeps revenue (e.g. "the county"). */
      governmentBillName?: string;
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
  ballotStepTitle(ballotIssue, kind, options) {
    const yearPart = options?.titleYearSuffix
      ? ` (${options.titleYearSuffix})`
      : "";
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
  millsStepBody: MILLS_STEP_BODY,
  millsBodyTerms: [{ termId: "term-mill-levy", match: "rate" }],
  measureKinds: new Set(["tabor_revenue_retention"]),
  ballotStepTitle(ballotIssue, kind, options) {
    switch (kind) {
      case "tabor_revenue_retention": {
        const titlePlain = options?.titlePlain?.trim();
        if (!titlePlain) {
          throw new Error(
            "tabor_revenue_retention requires titlePlain (bill-first step title)",
          );
        }
        return `Ballot Issue ${ballotIssue}: ${titlePlain}`;
      }
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
        const governmentBillName =
          options?.governmentBillName?.trim() ||
          COUNTY_GOVERNMENT_BILL_NAME_DEFAULT;
        const max = options.maxAuthorizedMills.toFixed(3);
        return `${lead} letting ${governmentBillName} keep and spend money that under TABOR would otherwise have to go back to taxpayers, for needs such as ${detail}. People often call this kind of vote de-Brucing. The ballot said this was without a new tax and without raising the maximum rate (${max} mills).`;
      }
      default:
        throw new Error(`county pack does not support measure kind: ${kind}`);
    }
  },
  budgetBody(authorityShortName, detail) {
    return `${authorityShortName}'s budget ${detail}.`;
  },
};

function requireTrimmedBallotTitlePlain(
  titlePlain: string | undefined,
  kind: "operations_mill" | "tabor_revenue_retention",
): string {
  const trimmed = titlePlain?.trim();
  if (!trimmed) {
    throw new Error(
      `${kind} requires titlePlain (bill-first step title)`,
    );
  }
  return trimmed;
}

/**
 * Metropolitan / Title-32 special district pack. First consumer: Sky Ranch
 * (`4571`). Kinds cover common metro ballots: debt, O&M mill authorizations,
 * and TABOR retention. Prefer `titlePlain` for bill-first O&M / retention titles.
 */
const METRO_PACK: LevyAuthorityChainFamilyPack = {
  budgetStepTitle: "What the district's budget says",
  budgetFactLabel: "District budget",
  millsStepBody: MILLS_STEP_BODY,
  millsBodyTerms: [{ termId: "term-mill-levy", match: "rate" }],
  measureKinds: new Set(["bond", "operations_mill", "tabor_revenue_retention"]),
  ballotStepTitle(ballotIssue, kind, options) {
    const yearPart = options?.titleYearSuffix
      ? ` (${options.titleYearSuffix})`
      : "";
    switch (kind) {
      case "bond":
        return `Ballot Issue ${ballotIssue}: Borrowing for district projects${yearPart}`;
      case "operations_mill": {
        const titlePlain = requireTrimmedBallotTitlePlain(
          options?.titlePlain,
          "operations_mill",
        );
        return `Ballot Issue ${ballotIssue}: ${titlePlain}`;
      }
      case "tabor_revenue_retention": {
        const titlePlain = requireTrimmedBallotTitlePlain(
          options?.titlePlain,
          "tabor_revenue_retention",
        );
        return `Ballot Issue ${ballotIssue}: ${titlePlain}`;
      }
      default:
        throw new Error(`metro pack does not support measure kind: ${kind}`);
    }
  },
  ballotStepBody(kind, detail, bodyLead, options) {
    const lead = BODY_LEAD_PHRASES[bodyLead];
    switch (kind) {
      case "bond":
        return `${lead} borrowing ${detail}. ${METRO_BOND_CEILING_SENTENCE} ${METRO_BOND_REPAYMENT_CHANGE_SENTENCE}`;
      case "operations_mill":
        return `${lead} ${detail}.`;
      case "tabor_revenue_retention": {
        if (options?.maxAuthorizedMills == null) {
          throw new Error(
            "tabor_revenue_retention requires maxAuthorizedMills",
          );
        }
        const governmentBillName =
          options?.governmentBillName?.trim() ||
          METRO_GOVERNMENT_BILL_NAME_DEFAULT;
        const max = options.maxAuthorizedMills.toFixed(3);
        return `${lead} letting ${governmentBillName} keep and spend money that under TABOR would otherwise have to go back to taxpayers, for needs such as ${detail}. People often call this kind of vote de-Brucing. The ballot said this was without a new tax and without raising the maximum rate (${max} mills).`;
      }
      default:
        throw new Error(`metro pack does not support measure kind: ${kind}`);
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
  metro: METRO_PACK,
};

export function getAuthorityChainFamilyPack(
  family: LevyAuthorityChainFamily,
): LevyAuthorityChainFamilyPack {
  return FAMILY_PACKS[family];
}

export function capitalizeResidentPhrase(phrase: string): string {
  const trimmed = phrase.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
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

/** Single ballot-issue phrase as it appears in summary prose. */
export function ballotIssuePhrase(ballotIssue: string): string {
  return `Ballot Issue ${ballotIssue}`;
}

/** Format ballot issue list for summary ("4A and 4B" or "4A"). */
export function formatBallotIssueList(issues: string[]): string {
  if (issues.length === 0) return "";
  if (issues.length === 1) return ballotIssuePhrase(issues[0]!);
  const last = issues[issues.length - 1]!;
  const rest = issues.slice(0, -1).map((i) => ballotIssuePhrase(i));
  return `${rest.join(", ")} and ${ballotIssuePhrase(last)}`;
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
