// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Builds resident-facing {@link LevyAuthorityChainEntry} objects from structured
 * JSON records. All prose templates live in `levyAuthorityChainTemplates.ts`.
 *
 * Source ladder: prefer the best verified official document; when unavailable,
 * keep a next-best hub link (show where we looked). See authoring
 * "Next-best source" in `docs/levy-explainer-authoring.md`.
 *
 * Hard-facts (measure body): English `notice` / `sample_ballot` → pack body +
 * `detail`. Non-English sample (`ballotTextLanguage: "es"` +
 * `ballotTextEnglishSource: "ai_translation"`) → intro + collapsed
 * `bodyDisclosure` AI translation. `unavailable` →
 * {@link unavailableBallotMeasureBody}; omit `detail`. See templates header.
 */

import {
  AUTHORITY_CHAIN_HEADING,
  ballotIssuePhrase,
  buildSummaryAlsoClause,
  buildSummaryVoterClause,
  COUNTY_GOVERNMENT_BILL_NAME_DEFAULT,
  METRO_GOVERNMENT_BILL_NAME_DEFAULT,
  FACT_LABEL_COUNTY_LIST_NAME,
  FACT_VALUE_COUNTY_ELECTION_NOTICE,
  FACT_VALUE_COUNTY_SAMPLE_BALLOT,
  FACT_VALUE_COUNTY_SAMPLE_BALLOT_SPANISH_ONLY,
  formatVoteTotals,
  getAuthorityChainFamilyPack,
  millsYearLabel,
  nonEnglishSampleAiTranslatedMeasureIntro,
  NON_ENGLISH_SAMPLE_ENGLISH_NOT_LOCATED_SENTENCE,
  OPEN_GAP_BODIES,
  OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT,
  temporaryCreditMillSplitOpenGapBody,
  type LevyAuthorityChainBodyLead,
  type LevyAuthorityChainFamily,
  type LevyAuthorityChainGoverningBody,
  type LevyAuthorityChainMeasureKind,
  type LevyAuthorityChainMillsBodyTerm,
  type LevyAuthorityChainOpenGapId,
  STEP_TITLE_WHAT_CHANGED,
  STEP_TITLE_WHO_GETS,
  voteFactLabel,
} from "@/content/levyAuthorityChainTemplates";
import { AUTHORITY_CHAIN_AI_TRANSLATION_DISCLOSURE } from "@/content/levyAuthorityChainCopy";
import {
  formatMetroMillsChangeFactValue,
  METRO_MILLS_CHANGE_FROM_LAST_YEAR_LABEL,
  METRO_MILLS_MOST_NOTABLE_CHANGE_LABEL,
  selectMetroAuthorityMillsChangeBlocks,
  type AuthorityMillsYoYChange,
} from "@/lib/authorityMillsChangeBlocks";
import {
  authorityMillsSeries,
  levyPercentageResidentLinkForTaxYear,
} from "@/lib/authorityMillsHistory";
import type { LevyEntryMatchKeys } from "@/lib/levyEntryMatch";
import type {
  LevyAuthorityChainEntry,
  LevyAuthorityChainFact,
  LevyAuthorityChainLink,
  LevyAuthorityChainOpenGap,
  LevyAuthorityChainStep,
  LevyAuthorityChainSummaryIssueMark,
} from "@/lib/levyAuthorityChain";

export type LevyAuthorityChainSourceLink = LevyAuthorityChainLink;

export type LevyAuthorityChainMeasureRecord = {
  stepId: string;
  /** County-style ballot label when one is published. Optional for metro records. */
  ballotIssue?: string;
  kind: LevyAuthorityChainMeasureKind;
  electionMonthYear: string;
  /**
   * Injected into the kind-specific **ballot** body template when
   * `ballotTextKind` is `notice` or English `sample_ballot`. For Spanish
   * sample + AI translation, `detail` is the AI-translated substance after the
   * disclosure sentences. Omit when `ballotTextKind` is `unavailable`.
   */
  detail?: string;
  maxMillIncreasePerYear?: number;
  /** Cap stated on the ballot (e.g. county TABOR retention max mills). */
  maxAuthorizedMills?: number;
  titleYearSuffix?: string;
  /**
   * Plain-language title after "Ballot Issue X: " (required for
   * `tabor_revenue_retention` and metro `operations_mill`; bill-first, not a
   * nickname headline).
   */
  titlePlain?: string;
  bodyLead?: LevyAuthorityChainBodyLead;
  /**
   * Ballot wording source. Ladder: Notice of Election / TABOR PDF, else
   * English sample ballot, else Spanish sample with AI-translation
   * disclosure fields, else (`unavailable`) the year's file-library hub.
   */
  ballotTextSource: LevyAuthorityChainSourceLink;
  ballotTextKind: "notice" | "sample_ballot" | "unavailable";
  /**
   * Language of the linked sample/notice. Omit for English. `"es"` requires
   * `ballotTextEnglishSource: "ai_translation"` and openGap
   * `ballot-text-spanish-only-ai-translation`.
   */
  ballotTextLanguage?: "es";
  /**
   * How English measure-body substance was produced when the linked PDF is
   * non-English. Required when `ballotTextLanguage` is `"es"`.
   */
  ballotTextEnglishSource?: "ai_translation";
  /**
   * Where we looked for English Notice / English sample when only a non-English
   * sample is linked (typically that year's Past Elections File Library hub).
   * Required when `ballotTextLanguage` is `"es"`. The built step links
   * {@link NON_ENGLISH_SAMPLE_ENGLISH_NOT_LOCATED_SENTENCE} from templates to this URL.
   */
  ballotTextEnglishHuntSource?: LevyAuthorityChainSourceLink;
  /**
   * Extra attributed facts on the measure step (after Ballot text). Use when
   * ballot wording is missing but another official public record restates the
   * measure (district budget excerpt, another district's resolution, etc.).
   * Label and value must match what that source says; do not sell as ballot text.
   */
  supportingFacts?: LevyAuthorityChainFact[];
  votes?: {
    yes: string;
    yesPct: string;
    no: string;
    noPct: string;
  };
  resultsSource?: LevyAuthorityChainSourceLink;
  /**
   * Cited authorization record used when public yes/no totals are unavailable.
   * Metro entries may use this instead of `votes` + `resultsSource`.
   */
  approval?: {
    label: string;
    value: string;
    source: LevyAuthorityChainSourceLink;
  };
  titleTermId?: string;
  titleTermMatch?: string;
  bodyTermId?: string;
  bodyTermMatch?: string;
};

export type LevyAuthorityChainSummarySpec = {
  /** School/county ballot labels. Metro may omit when no letter is public. */
  headlineIssues?: string[];
  /** Metro authorization substance, without an invented ballot label. */
  headlinePlain?: string;
  headlineElection: string;
  headlineNote?: string;
  summaryTermId?: string;
  summaryTermMatch?: string;
  also?: Array<{
    issues: string[];
    election: string;
    suffix?: string;
  }>;
};

export type LevyAuthorityChainMillsSpec = {
  /**
   * School/county: authored current/prior rates with cites.
   * Metro: omit these; rates are derived from the AUTH mills series
   * ({@link authorityMillsSeries}) shared with the history chart.
   */
  currentYear?: number;
  currentMills?: string;
  priorYear?: number;
  priorMills?: string;
  currentRateSource?: LevyAuthorityChainSourceLink;
  priorRateSource?: LevyAuthorityChainSourceLink;
  /**
   * Optional entry-specific "What changed?" takeaway. When omitted, the family
   * pack default chrome is used.
   */
  stepBody?: string;
  /** Glossary popovers for `stepBody` (or pack default when `stepBody` omitted). */
  bodyTerms?: LevyAuthorityChainMillsBodyTerm[];
  /**
   * School/county only: optional older comparison fact. Metro must omit this;
   * most-notable change is derived from the AUTH series instead.
   */
  historicalComparison?: {
    label: string;
    fromYear: number;
    fromMills: string;
    fromRateSource: LevyAuthorityChainSourceLink;
    toYear: number;
    toMills: string;
    toRateSource: LevyAuthorityChainSourceLink;
  };
};

export type LevyAuthorityChainBudgetSpec = {
  authorityShortName: string;
  detail: string;
  factValue: string;
  source: LevyAuthorityChainSourceLink;
  bodyTermId?: string;
  bodyTermMatch?: string;
};

export type LevyAuthorityChainAuthoritySpec = {
  displayName: string;
  countyListName: string;
  governingBody: LevyAuthorityChainGoverningBody;
  /**
   * Bill wording for county-family retention copy (e.g. "the county").
   * Defaults to {@link COUNTY_GOVERNMENT_BILL_NAME_DEFAULT} when omitted.
   */
  governmentBillName?: string;
  /** Optional entry-specific recipient explanation with cited facts. */
  whoGetsBody?: string;
  whoGetsFacts?: LevyAuthorityChainFact[];
};

/** Structured JSON entry (version 2). No free-form step prose. */
export type LevyAuthorityChainEntryRecord = {
  id: string;
  /** Selects the family pack (school / county / …) for injected wording. */
  family: LevyAuthorityChainFamily;
  match: LevyEntryMatchKeys;
  authority: LevyAuthorityChainAuthoritySpec;
  summarySource: LevyAuthorityChainSourceLink;
  summary: LevyAuthorityChainSummarySpec;
  mills: LevyAuthorityChainMillsSpec;
  measures: LevyAuthorityChainMeasureRecord[];
  budget?: LevyAuthorityChainBudgetSpec;
  openGapIds: LevyAuthorityChainOpenGapId[];
};

function ballotTextFactValue(
  family: LevyAuthorityChainFamily,
  kind: "notice" | "sample_ballot" | "unavailable",
  language?: "es",
): string {
  const pack = getAuthorityChainFamilyPack(family);
  switch (kind) {
    case "notice":
      return FACT_VALUE_COUNTY_ELECTION_NOTICE;
    case "sample_ballot":
      return language === "es"
        ? FACT_VALUE_COUNTY_SAMPLE_BALLOT_SPANISH_ONLY
        : FACT_VALUE_COUNTY_SAMPLE_BALLOT;
    case "unavailable":
      return pack.unavailableBallotFactValue;
  }
}

function governmentBillNameForRecord(
  record: LevyAuthorityChainEntryRecord,
): string {
  const custom = record.authority.governmentBillName?.trim();
  if (custom) return custom;
  if (record.family === "county") {
    return COUNTY_GOVERNMENT_BILL_NAME_DEFAULT;
  }
  if (record.family === "metro") {
    return METRO_GOVERNMENT_BILL_NAME_DEFAULT;
  }
  return "";
}

function buildSummary(
  record: LevyAuthorityChainEntryRecord,
  summaryAttribution: string,
): string {
  if (record.family === "metro") {
    const headlinePlain = record.summary.headlinePlain?.trim();
    if (!headlinePlain) {
      throw new Error(
        `[${record.id}] metro summary.headlinePlain must be non-empty`,
      );
    }
    return `${summaryAttribution}, eligible electors authorized ${headlinePlain} in ${record.summary.headlineElection}.`;
  }
  const headline = buildSummaryVoterClause(
    record.summary.headlineIssues ?? [],
    record.summary.headlineElection,
    record.summary.headlineNote,
  );
  const alsoClauses =
    record.summary.also?.map((a) =>
      buildSummaryAlsoClause(a.issues, a.election, a.suffix),
    ) ?? [];
  const voterParts = [headline, ...alsoClauses];
  const first = `${summaryAttribution}, ${voterParts[0]}.`;
  if (voterParts.length === 1) {
    return first;
  }
  return `${first} ${voterParts.slice(1).join(". ")}.`;
}

/**
 * Bold (and link when we have real ballot wording) each Ballot Issue phrase in
 * the always-visible summary. Link URLs come only from measures with
 * `ballotTextKind` `notice` or `sample_ballot`. `unavailable` keeps bold-only:
 * the hub stays on the trail fact / next-best path, not on the issue name.
 * No match → skip. Election results stay on `summarySource` / votes facts.
 */
function buildSummaryIssueMarks(
  record: LevyAuthorityChainEntryRecord,
  summary: string,
): LevyAuthorityChainSummaryIssueMark[] {
  const issueIds = new Set<string>();
  for (const id of record.summary.headlineIssues ?? []) {
    issueIds.add(id);
  }
  for (const also of record.summary.also ?? []) {
    for (const id of also.issues) {
      issueIds.add(id);
    }
  }

  const ballotTextUrlByIssue = new Map<string, string>();
  for (const measure of record.measures) {
    if (
      measure.ballotTextKind !== "notice" &&
      measure.ballotTextKind !== "sample_ballot"
    ) {
      continue;
    }
    const issue = measure.ballotIssue;
    if (!issue) continue;
    const url = measure.ballotTextSource.url.trim();
    if (!url || ballotTextUrlByIssue.has(issue)) continue;
    ballotTextUrlByIssue.set(issue, url);
  }

  const marks: LevyAuthorityChainSummaryIssueMark[] = [];
  for (const id of issueIds) {
    const match = ballotIssuePhrase(id);
    if (!summary.includes(match)) continue;
    const url = ballotTextUrlByIssue.get(id);
    marks.push(url ? { match, url } : { match });
  }
  marks.sort((a, b) => summary.indexOf(a.match) - summary.indexOf(b.match));
  return marks;
}

function buildWhoSetsStep(record: LevyAuthorityChainEntryRecord): LevyAuthorityChainStep {
  return {
    id: "who-sets",
    title: STEP_TITLE_WHO_GETS,
    body: record.authority.whoGetsBody ?? record.authority.displayName,
    facts: record.authority.whoGetsFacts ?? [
      {
        label: FACT_LABEL_COUNTY_LIST_NAME,
        value: record.authority.countyListName,
        sources: [],
      },
    ],
  };
}

function levyPercentageSourceForYear(
  taxYear: number,
): LevyAuthorityChainSourceLink {
  return levyPercentageResidentLinkForTaxYear(taxYear);
}

function buildMetroMillsChangeFact(
  label: string,
  change: AuthorityMillsYoYChange,
): LevyAuthorityChainFact {
  return {
    label,
    value: formatMetroMillsChangeFactValue(change),
    sources: [
      levyPercentageSourceForYear(change.fromYear),
      levyPercentageSourceForYear(change.toYear),
    ],
  };
}

/**
 * Metro "What changed?": derive Change from last year and optional Most notable
 * change from the AUTH series (same numbers as the mills history chart).
 */
function buildMetroMillsStep(
  record: LevyAuthorityChainEntryRecord,
): LevyAuthorityChainStep {
  const pack = getAuthorityChainFamilyPack("metro");
  const code = record.match.levyLineCode?.trim();
  if (!code) {
    throw new Error(
      `[${record.id}] metro mills step requires match.levyLineCode for AUTH series lookup`,
    );
  }
  const series = authorityMillsSeries(code);
  const { changeFromLastYear, mostNotableChange } =
    selectMetroAuthorityMillsChangeBlocks(series);
  if (!changeFromLastYear) {
    throw new Error(
      `[${record.id}] AUTH mills series for ${code} needs at least two published years`,
    );
  }

  const facts: LevyAuthorityChainFact[] = [
    buildMetroMillsChangeFact(
      METRO_MILLS_CHANGE_FROM_LAST_YEAR_LABEL,
      changeFromLastYear,
    ),
  ];
  if (mostNotableChange) {
    facts.push(
      buildMetroMillsChangeFact(
        METRO_MILLS_MOST_NOTABLE_CHANGE_LABEL,
        mostNotableChange,
      ),
    );
  }

  return millsStepWithTerms({
    body: millsStepBodyTrim(record, pack.millsStepBody),
    terms: record.mills.bodyTerms ?? pack.millsBodyTerms,
    facts,
  });
}

function millsStepBodyTrim(
  record: LevyAuthorityChainEntryRecord,
  packDefault: string,
): string {
  return record.mills.stepBody?.trim()
    ? record.mills.stepBody.trim()
    : packDefault;
}

function millsStepWithTerms(args: {
  body: string;
  terms: readonly LevyAuthorityChainMillsBodyTerm[];
  facts: LevyAuthorityChainFact[];
}): LevyAuthorityChainStep {
  const [primary, ...rest] = args.terms;
  const step: LevyAuthorityChainStep = {
    id: "certified-mills",
    title: STEP_TITLE_WHAT_CHANGED,
    body: args.body,
    facts: args.facts,
  };
  if (primary) {
    step.bodyTermId = primary.termId;
    step.bodyTermMatch = primary.match;
  }
  if (rest.length > 0) {
    step.bodyTerms = rest.map((t) => ({ termId: t.termId, match: t.match }));
  }
  return step;
}

function buildAuthoredMillsStep(
  record: LevyAuthorityChainEntryRecord,
): LevyAuthorityChainStep {
  const pack = getAuthorityChainFamilyPack(record.family);
  const { mills } = record;
  if (
    typeof mills.currentYear !== "number" ||
    typeof mills.priorYear !== "number" ||
    !mills.currentMills?.trim() ||
    !mills.priorMills?.trim() ||
    !mills.currentRateSource ||
    !mills.priorRateSource
  ) {
    throw new Error(
      `[${record.id}] school/county mills require current/prior year, mills, and rate sources`,
    );
  }
  const facts: LevyAuthorityChainFact[] = [
    {
      label: millsYearLabel(mills.currentYear),
      value: mills.currentMills,
      sources: [mills.currentRateSource],
    },
    {
      label: millsYearLabel(mills.priorYear),
      value: mills.priorMills,
      sources: [mills.priorRateSource],
    },
  ];
  if (mills.historicalComparison) {
    const comparison = mills.historicalComparison;
    facts.push({
      label: comparison.label,
      value: `${comparison.fromYear}: ${comparison.fromMills} mills\n${comparison.toYear}: ${comparison.toMills} mills`,
      sources: [comparison.fromRateSource, comparison.toRateSource],
    });
  }
  return millsStepWithTerms({
    body: millsStepBodyTrim(record, pack.millsStepBody),
    terms: mills.bodyTerms ?? pack.millsBodyTerms,
    facts,
  });
}

function buildMillsStep(record: LevyAuthorityChainEntryRecord): LevyAuthorityChainStep {
  if (record.family === "metro") {
    return buildMetroMillsStep(record);
  }
  return buildAuthoredMillsStep(record);
}

function buildMeasureStep(
  record: LevyAuthorityChainEntryRecord,
  measure: LevyAuthorityChainMeasureRecord,
): LevyAuthorityChainStep {
  const family = record.family;
  const pack = getAuthorityChainFamilyPack(family);
  const bodyLead = measure.bodyLead ?? "approved";
  const governmentBillName =
    measure.kind === "tabor_revenue_retention"
      ? governmentBillNameForRecord(record)
      : undefined;
  let body: string;
  let bodyDisclosure: LevyAuthorityChainStep["bodyDisclosure"];
  let bodyLink: LevyAuthorityChainStep["bodyLink"];
  if (measure.kind === "metro_commitment") {
    body = pack.ballotStepBody(measure.kind, measure.detail ?? "", bodyLead, {
      maxMillIncreasePerYear: measure.maxMillIncreasePerYear,
      maxAuthorizedMills: measure.maxAuthorizedMills,
      governmentBillName,
    });
  } else if (measure.ballotTextKind === "unavailable") {
    body = pack.unavailableMeasureBody(
      measure.ballotIssue,
      measure.electionMonthYear,
    );
  } else if (
    measure.ballotTextKind === "sample_ballot" &&
    measure.ballotTextLanguage === "es" &&
    measure.ballotTextEnglishSource === "ai_translation"
  ) {
    // Hard-facts: Spanish sample is official; AI English stays collapsed;
    // English-not-located sentence links the file-library hunt hub.
    body = nonEnglishSampleAiTranslatedMeasureIntro({
      ballotIssue: measure.ballotIssue ?? "",
      electionMonthYear: measure.electionMonthYear,
      languageLabel: "Spanish",
    });
    const huntUrl = measure.ballotTextEnglishHuntSource?.url?.trim();
    if (huntUrl) {
      bodyLink = {
        match: NON_ENGLISH_SAMPLE_ENGLISH_NOT_LOCATED_SENTENCE,
        url: huntUrl,
      };
    }
    const substance = (measure.detail ?? "").trim();
    bodyDisclosure = {
      label: AUTHORITY_CHAIN_AI_TRANSLATION_DISCLOSURE,
      // Translation only; caveats live on the disclosure label (no duplicate lead).
      body: substance,
    };
  } else {
    body = pack.ballotStepBody(measure.kind, measure.detail ?? "", bodyLead, {
      maxMillIncreasePerYear: measure.maxMillIncreasePerYear,
      maxAuthorizedMills: measure.maxAuthorizedMills,
      governmentBillName,
    });
  }
  const omitDuplicateMetroUnavailableFact =
    family === "metro" &&
    measure.ballotTextKind === "unavailable" &&
    (measure.approval !== undefined ||
      (measure.votes !== undefined && measure.resultsSource !== undefined));
  const facts: LevyAuthorityChainFact[] = [
    ...(measure.kind !== "metro_commitment" &&
    !omitDuplicateMetroUnavailableFact
      ? [
          {
            label: pack.ballotFactLabel,
            value: ballotTextFactValue(
              family,
              measure.ballotTextKind,
              measure.ballotTextLanguage,
            ),
            sources: [measure.ballotTextSource],
          },
        ]
      : []),
  ];
  if (family !== "metro") {
    facts.push(...(measure.supportingFacts ?? []));
  }
  // Metro: keep approval/votes on the measure step so chronology stays in-trail
  // (no separate trailing "How this was authorized" dump of the same cites).
  // Approval comes before supporting facts so an election is not displayed
  // after a later county action described by those supporting facts.
  if (family === "metro") {
    if (measure.votes && measure.resultsSource) {
      facts.push({
        label: metroVoteFactLabel(measure),
        value: formatVoteTotals(
          measure.votes.yes,
          measure.votes.yesPct,
          measure.votes.no,
          measure.votes.noPct,
        ),
        sources: [measure.resultsSource],
      });
    } else if (measure.approval) {
      facts.push({
        label: measure.approval.label,
        value: measure.approval.value,
        sources: [measure.approval.source],
      });
    } else {
      throw new Error(
        `[${record.id}] metro measure ${measure.stepId} needs votes + resultsSource or approval`,
      );
    }
    facts.push(...(measure.supportingFacts ?? []));
  }
  return {
    id: measure.stepId,
    title: pack.ballotStepTitle(measure.ballotIssue, measure.kind, {
      titleYearSuffix: measure.titleYearSuffix,
      titlePlain: measure.titlePlain,
    }),
    titleTermId: measure.titleTermId,
    titleTermMatch: measure.titleTermMatch,
    body,
    ...(bodyLink ? { bodyLink } : {}),
    ...(bodyDisclosure ? { bodyDisclosure } : {}),
    bodyTermId: measure.bodyTermId,
    bodyTermMatch: measure.bodyTermMatch,
    facts,
  };
}

/** Vote fact label: Ballot Issue prefix only when a letter is published. */
function metroVoteFactLabel(measure: LevyAuthorityChainMeasureRecord): string {
  if (measure.ballotIssue) {
    return voteFactLabel(measure.ballotIssue, measure.electionMonthYear);
  }
  const title = measure.titlePlain?.trim() || "Authorization";
  return `${title} (${measure.electionMonthYear})`;
}

function buildApprovalStep(
  record: LevyAuthorityChainEntryRecord,
): LevyAuthorityChainStep {
  const pack = getAuthorityChainFamilyPack(record.family);
  const facts: LevyAuthorityChainFact[] = record.measures.map((measure) => {
    if (measure.votes && measure.resultsSource) {
      return {
        label: metroVoteFactLabel(measure),
        value: formatVoteTotals(
          measure.votes.yes,
          measure.votes.yesPct,
          measure.votes.no,
          measure.votes.noPct,
        ),
        sources: [measure.resultsSource],
      };
    }
    if (!measure.approval) {
      throw new Error(
        `[${record.id}] measure ${measure.stepId} needs votes + resultsSource or approval`,
      );
    }
    return {
      label: measure.approval.label,
      value: measure.approval.value,
      sources: [measure.approval.source],
    };
  });
  return {
    id: record.family === "metro" ? "official-authorization-record" : "county-reported-results",
    title: pack.approvalStepTitle,
    body: pack.approvalStepBody,
    facts,
  };
}

function buildBudgetStep(
  family: LevyAuthorityChainFamily,
  budget: LevyAuthorityChainBudgetSpec,
): LevyAuthorityChainStep {
  const pack = getAuthorityChainFamilyPack(family);
  return {
    id: "budget-attribution",
    title: pack.budgetStepTitle,
    body: pack.budgetBody(budget.authorityShortName, budget.detail),
    bodyTermId: budget.bodyTermId,
    bodyTermMatch: budget.bodyTermMatch,
    facts: [
      {
        label: pack.budgetFactLabel,
        value: budget.factValue,
        sources: [budget.source],
      },
    ],
  };
}

function buildOpenGaps(
  record: LevyAuthorityChainEntryRecord,
): LevyAuthorityChainOpenGap[] {
  return record.openGapIds.map((id) => {
    if (id === OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT) {
      const taborMeasures = record.measures.filter(
        (m) => m.kind === "tabor_revenue_retention",
      );
      const tabor = taborMeasures[0];
        if (
          taborMeasures.length !== 1 ||
          !tabor ||
          typeof tabor.maxAuthorizedMills !== "number" ||
          !Number.isFinite(tabor.maxAuthorizedMills)
        ) {
          throw new Error(
            `[${record.id}] openGap ${OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT} requires exactly one tabor_revenue_retention measure with maxAuthorizedMills`,
          );
        }
        if (
          !record.mills.currentMills?.trim() ||
          typeof record.mills.currentYear !== "number"
        ) {
          throw new Error(
            `[${record.id}] openGap ${OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT} requires authored mills.currentMills and mills.currentYear`,
          );
        }
        return {
          id,
          body: temporaryCreditMillSplitOpenGapBody({
            publisherBillName: governmentBillNameForRecord(record),
            currentMills: record.mills.currentMills,
            currentYear: record.mills.currentYear,
            ballotIssue: tabor.ballotIssue,
            maxAuthorizedMills: tabor.maxAuthorizedMills,
          }),
        };
    }
    return {
      id,
      body: OPEN_GAP_BODIES[id as keyof typeof OPEN_GAP_BODIES],
    };
  });
}

/**
 * Expand a structured v2 record into the UI entry shape (steps, summary, gaps).
 */
export function buildLevyAuthorityChainEntry(
  record: LevyAuthorityChainEntryRecord,
): LevyAuthorityChainEntry {
  const trimmedSummaryText = record.summarySource.text.trim();
  if (!trimmedSummaryText) {
    throw new Error(`[${record.id}] summarySource.text must be non-empty`);
  }
  const summarySource: LevyAuthorityChainSourceLink = {
    text: trimmedSummaryText,
    url: record.summarySource.url,
  };

  const pack = getAuthorityChainFamilyPack(record.family);
  const taborMeasureCount = record.measures.filter(
    (m) => m.kind === "tabor_revenue_retention",
  ).length;
  if (taborMeasureCount > 1) {
    throw new Error(
      `[${record.id}] at most one tabor_revenue_retention measure per entry`,
    );
  }
  for (const measure of record.measures) {
    if (!pack.measureKinds.has(measure.kind)) {
      throw new Error(
        `[${record.id}] measure kind ${measure.kind} is not valid for family ${record.family}`,
      );
    }
  }

  const steps: LevyAuthorityChainStep[] = [
    buildWhoSetsStep(record),
    buildMillsStep(record),
    ...record.measures.map((m) => buildMeasureStep(record, m)),
  ];
  // School/county: separate certified-results step. Metro folds approval onto
  // each measure so the trail stays chronological.
  if (record.family !== "metro") {
    steps.push(buildApprovalStep(record));
  }

  if (record.budget) {
    steps.push(buildBudgetStep(record.family, record.budget));
  }

  const summary = buildSummary(record, summarySource.text);
  const summaryIssueMarks = buildSummaryIssueMarks(record, summary);

  const entry: LevyAuthorityChainEntry = {
    id: record.id,
    match: record.match,
    heading: AUTHORITY_CHAIN_HEADING,
    summary,
    summarySource,
    steps,
    openGaps: buildOpenGaps(record),
  };

  if (summaryIssueMarks.length > 0) {
    entry.summaryIssueMarks = summaryIssueMarks;
  }

  if (record.summary.summaryTermId && record.summary.summaryTermMatch) {
    entry.summaryTermId = record.summary.summaryTermId;
    entry.summaryTermMatch = record.summary.summaryTermMatch;
  }

  return entry;
}
