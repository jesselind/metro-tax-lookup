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
  FACT_LABEL_BALLOT_TEXT,
  FACT_LABEL_COUNTY_LIST_NAME,
  FACT_VALUE_BALLOT_TEXT_UNAVAILABLE,
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
  STEP_TITLE_HOW_VOTED,
  STEP_TITLE_WHAT_CHANGED,
  STEP_TITLE_WHO_GETS,
  unavailableBallotMeasureBody,
  VOTES_STEP_BODY,
  voteFactLabel,
  whoGetsBody,
} from "@/content/levyAuthorityChainTemplates";
import { AUTHORITY_CHAIN_AI_TRANSLATION_DISCLOSURE } from "@/content/levyAuthorityChainCopy";
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
  ballotIssue: string;
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
  votes: {
    yes: string;
    yesPct: string;
    no: string;
    noPct: string;
  };
  resultsSource: LevyAuthorityChainSourceLink;
  titleTermId?: string;
  titleTermMatch?: string;
  bodyTermId?: string;
  bodyTermMatch?: string;
};

export type LevyAuthorityChainSummarySpec = {
  headlineIssues: string[];
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
  currentYear: number;
  currentMills: string;
  priorYear: number;
  priorMills: string;
  currentRateSource: LevyAuthorityChainSourceLink;
  priorRateSource: LevyAuthorityChainSourceLink;
  /**
   * Optional entry-specific "What changed?" takeaway. When omitted, the family
   * pack default chrome is used (shared school/county rate-table sentence).
   */
  stepBody?: string;
  /** Glossary popovers for `stepBody` (or pack default when `stepBody` omitted). */
  bodyTerms?: LevyAuthorityChainMillsBodyTerm[];
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
  kind: "notice" | "sample_ballot" | "unavailable",
  language?: "es",
): string {
  switch (kind) {
    case "notice":
      return FACT_VALUE_COUNTY_ELECTION_NOTICE;
    case "sample_ballot":
      return language === "es"
        ? FACT_VALUE_COUNTY_SAMPLE_BALLOT_SPANISH_ONLY
        : FACT_VALUE_COUNTY_SAMPLE_BALLOT;
    case "unavailable":
      return FACT_VALUE_BALLOT_TEXT_UNAVAILABLE;
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
  const headline = buildSummaryVoterClause(
    record.summary.headlineIssues,
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
  for (const id of record.summary.headlineIssues) {
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
    const url = measure.ballotTextSource.url.trim();
    if (!url || ballotTextUrlByIssue.has(measure.ballotIssue)) continue;
    ballotTextUrlByIssue.set(measure.ballotIssue, url);
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
    body: whoGetsBody(record.authority.displayName),
    facts: [
      {
        label: FACT_LABEL_COUNTY_LIST_NAME,
        value: record.authority.countyListName,
        sources: [],
      },
    ],
  };
}

function buildMillsStep(record: LevyAuthorityChainEntryRecord): LevyAuthorityChainStep {
  const pack = getAuthorityChainFamilyPack(record.family);
  const { mills } = record;
  const body = mills.stepBody?.trim() ? mills.stepBody.trim() : pack.millsStepBody;
  const terms = mills.bodyTerms ?? pack.millsBodyTerms;
  const [primary, ...rest] = terms;
  const step: LevyAuthorityChainStep = {
    id: "certified-mills",
    title: STEP_TITLE_WHAT_CHANGED,
    body,
    facts: [
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
    ],
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
  if (measure.ballotTextKind === "unavailable") {
    body = unavailableBallotMeasureBody(
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
      ballotIssue: measure.ballotIssue,
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
  const facts: LevyAuthorityChainFact[] = [
    {
      label: FACT_LABEL_BALLOT_TEXT,
      value: ballotTextFactValue(
        measure.ballotTextKind,
        measure.ballotTextLanguage,
      ),
      sources: [measure.ballotTextSource],
    },
    ...(measure.supportingFacts ?? []),
  ];
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

function buildVotesStep(measures: LevyAuthorityChainMeasureRecord[]): LevyAuthorityChainStep {
  const facts: LevyAuthorityChainFact[] = measures.map((m) => ({
    label: voteFactLabel(m.ballotIssue, m.electionMonthYear),
    value: formatVoteTotals(
      m.votes.yes,
      m.votes.yesPct,
      m.votes.no,
      m.votes.noPct,
    ),
    sources: [m.resultsSource],
  }));
  return {
    id: "county-reported-results",
    title: STEP_TITLE_HOW_VOTED,
    body: VOTES_STEP_BODY,
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
    buildVotesStep(record.measures),
  ];

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
