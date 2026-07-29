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
  buildSummaryAlsoClause,
  buildSummarySecondSentence,
  buildSummaryVoterClause,
  ballotStepBody,
  ballotStepTitle,
  districtBudgetBody,
  FACT_LABEL_BALLOT_TEXT,
  FACT_LABEL_COUNTY_LIST_NAME,
  FACT_LABEL_DISTRICT_BUDGET,
  FACT_VALUE_BALLOT_TEXT_UNAVAILABLE,
  FACT_VALUE_COUNTY_ELECTION_NOTICE,
  FACT_VALUE_COUNTY_SAMPLE_BALLOT,
  formatVoteTotals,
  MILLS_STEP_BODY,
  millsYearLabel,
  OPEN_GAP_BODIES,
  type LevyAuthorityChainBodyLead,
  type LevyAuthorityChainGoverningBody,
  type LevyAuthorityChainMeasureKind,
  type LevyAuthorityChainOpenGapId,
  STEP_TITLE_DISTRICT_BUDGET,
  STEP_TITLE_HOW_VOTED,
  STEP_TITLE_WHAT_CHANGED,
  STEP_TITLE_WHO_GETS,
  SUMMARY_ATTRIBUTION_TEXT,
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
  titleYearSuffix?: string;
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
};

export type LevyAuthorityChainDistrictBudgetSpec = {
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
};

/** Structured JSON entry (version 2). No free-form step prose. */
export type LevyAuthorityChainEntryRecord = {
  id: string;
  match: LevyEntryMatchKeys;
  authority: LevyAuthorityChainAuthoritySpec;
  summarySource: LevyAuthorityChainSourceLink;
  summary: LevyAuthorityChainSummarySpec;
  mills: LevyAuthorityChainMillsSpec;
  measures: LevyAuthorityChainMeasureRecord[];
  districtBudget?: LevyAuthorityChainDistrictBudgetSpec;
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

function buildSummary(record: LevyAuthorityChainEntryRecord): string {
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
  const first = `${SUMMARY_ATTRIBUTION_TEXT}, ${voterParts[0]}.`;
  const middle =
    voterParts.length > 1
      ? ` ${voterParts.slice(1).join(". ")}.`
      : "";
  return `${first}${middle} ${buildSummarySecondSentence(record.authority.governingBody)}`;
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
  const { mills } = record;
  return {
    id: "certified-mills",
    title: STEP_TITLE_WHAT_CHANGED,
    body: MILLS_STEP_BODY,
    bodyTermId: "term-mill-levy",
    bodyTermMatch: "rate",
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
}

function buildMeasureStep(measure: LevyAuthorityChainMeasureRecord): LevyAuthorityChainStep {
  const bodyLead = measure.bodyLead ?? "approved";
  return {
    id: measure.stepId,
    title: ballotStepTitle(
      measure.ballotIssue,
      measure.kind,
      measure.titleYearSuffix,
    ),
    titleTermId: measure.titleTermId,
    titleTermMatch: measure.titleTermMatch,
    body: ballotStepBody(
      measure.kind,
      measure.detail,
      bodyLead,
      measure.maxMillIncreasePerYear,
    ),
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

function buildDistrictBudgetStep(
  budget: LevyAuthorityChainDistrictBudgetSpec,
): LevyAuthorityChainStep {
  return {
    id: "district-budget-attribution",
    title: STEP_TITLE_DISTRICT_BUDGET,
    body: districtBudgetBody(budget.authorityShortName, budget.detail),
    bodyTermId: budget.bodyTermId,
    bodyTermMatch: budget.bodyTermMatch,
    facts: [
      {
        label: FACT_LABEL_DISTRICT_BUDGET,
        value: budget.factValue,
        sources: [budget.source],
      },
    ],
  };
}

function buildOpenGaps(ids: LevyAuthorityChainOpenGapId[]): LevyAuthorityChainOpenGap[] {
  return ids.map((id) => ({
    id,
    body: OPEN_GAP_BODIES[id],
  }));
}

/**
 * Expand a structured v2 record into the UI entry shape (steps, summary, gaps).
 */
export function buildLevyAuthorityChainEntry(
  record: LevyAuthorityChainEntryRecord,
): LevyAuthorityChainEntry {
  const summarySource = record.summarySource;
  if (summarySource.text !== SUMMARY_ATTRIBUTION_TEXT) {
    throw new Error(
      `[${record.id}] summarySource.text must be exactly SUMMARY_ATTRIBUTION_TEXT`,
    );
  }

  const steps: LevyAuthorityChainStep[] = [
    buildWhoSetsStep(record),
    buildMillsStep(record),
    ...record.measures.map(buildMeasureStep),
    buildVotesStep(record.measures),
  ];

  if (record.districtBudget) {
    steps.push(buildDistrictBudgetStep(record.districtBudget));
  }

  const entry: LevyAuthorityChainEntry = {
    id: record.id,
    match: record.match,
    heading: AUTHORITY_CHAIN_HEADING,
    summary: buildSummary(record),
    summarySource,
    steps,
    openGaps: buildOpenGaps(record.openGapIds),
  };

  if (record.summary.summaryTermId && record.summary.summaryTermMatch) {
    entry.summaryTermId = record.summary.summaryTermId;
    entry.summaryTermMatch = record.summary.summaryTermMatch;
  }

  return entry;
}
