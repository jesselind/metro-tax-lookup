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
 */

import {
  AUTHORITY_CHAIN_HEADING,
  ballotIssuePhrase,
  buildSummaryAlsoClause,
  buildSummaryVoterClause,
  COUNTY_GOVERNMENT_BILL_NAME_DEFAULT,
  FACT_LABEL_BALLOT_TEXT,
  FACT_LABEL_COUNTY_LIST_NAME,
  FACT_VALUE_BALLOT_TEXT_UNAVAILABLE,
  FACT_VALUE_COUNTY_ELECTION_NOTICE,
  FACT_VALUE_COUNTY_SAMPLE_BALLOT,
  formatVoteTotals,
  getAuthorityChainFamilyPack,
  millsYearLabel,
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
  VOTES_STEP_BODY,
  voteFactLabel,
  whoGetsBody,
} from "@/content/levyAuthorityChainTemplates";
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
  /** Injected into the kind-specific body template. */
  detail: string;
  maxMillIncreasePerYear?: number;
  /** Cap stated on the ballot (e.g. county TABOR retention max mills). */
  maxAuthorizedMills?: number;
  titleYearSuffix?: string;
  /**
   * Plain-language title after "Ballot Issue X: " (required for
   * `tabor_revenue_retention`; bill-first, not a nickname headline).
   */
  titlePlain?: string;
  bodyLead?: LevyAuthorityChainBodyLead;
  /**
   * Ballot wording source. Follow the next-best ladder: Notice of Election /
   * TABOR PDF, else English sample ballot, else (`unavailable`) the year's
   * Past Elections File Library section so residents see where we looked.
   */
  ballotTextSource: LevyAuthorityChainSourceLink;
  ballotTextKind: "notice" | "sample_ballot" | "unavailable";
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
): string {
  switch (kind) {
    case "notice":
      return FACT_VALUE_COUNTY_ELECTION_NOTICE;
    case "sample_ballot":
      return FACT_VALUE_COUNTY_SAMPLE_BALLOT;
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
 * Bold (and link when possible) each Ballot Issue phrase in the always-visible
 * summary. URLs come from the matching measure's ballotTextSource (notice,
 * sample, or next-best hub). No match / no URL → bold-only fallback so the
 * summary stays useful without a brittle hard requirement.
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

  const urlByIssue = new Map<string, string>();
  for (const measure of record.measures) {
    const url = measure.ballotTextSource.url.trim();
    if (!url || urlByIssue.has(measure.ballotIssue)) continue;
    urlByIssue.set(measure.ballotIssue, url);
  }

  const marks: LevyAuthorityChainSummaryIssueMark[] = [];
  for (const id of issueIds) {
    const match = ballotIssuePhrase(id);
    if (!summary.includes(match)) continue;
    const url = urlByIssue.get(id);
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
  return {
    id: measure.stepId,
    title: pack.ballotStepTitle(measure.ballotIssue, measure.kind, {
      titleYearSuffix: measure.titleYearSuffix,
      titlePlain: measure.titlePlain,
    }),
    titleTermId: measure.titleTermId,
    titleTermMatch: measure.titleTermMatch,
    body: pack.ballotStepBody(measure.kind, measure.detail, bodyLead, {
      maxMillIncreasePerYear: measure.maxMillIncreasePerYear,
      maxAuthorizedMills: measure.maxAuthorizedMills,
      governmentBillName,
    }),
    bodyTermId: measure.bodyTermId,
    bodyTermMatch: measure.bodyTermMatch,
    facts: [
      {
        label: FACT_LABEL_BALLOT_TEXT,
        value: ballotTextFactValue(measure.ballotTextKind),
        sources: [measure.ballotTextSource],
      },
    ],
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
