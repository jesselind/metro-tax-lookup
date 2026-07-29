// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Validates `public/data/levy-authority-chain-entries.json` (version 2):
 * structured records, https sources, template alignment, no em dash on built copy.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PARCEL_GLOSSARY_TERM_IDS } from "@/content/termDefinitionBodies";
import {
  AUTHORITY_CHAIN_HEADING,
  OPEN_GAP_BODIES,
  SUMMARY_ATTRIBUTION_TEXT,
} from "@/content/levyAuthorityChainTemplates";
import {
  buildLevyAuthorityChainEntry,
  type LevyAuthorityChainEntryRecord,
} from "@/lib/levyAuthorityChainBuild";
import { LEVY_MODAL_TERM_IDS } from "@/lib/levyModalTermIds";

const EM_DASH = /\u2014/;

const EXTRA_FLOW_BRIEF_TERM_IDS = [
  "term-mill-levy",
  "term-pin",
  "term-tag",
  "term-debt-free-schools-mill-levy",
];

const MEASURE_KINDS = new Set(["override", "bond", "debt_free_mill"]);
const BODY_LEADS = new Set(["approved", "also_approved", "earlier_approved"]);
const BALLOT_TEXT_KINDS = new Set(["notice", "sample_ballot", "unavailable"]);
const GOVERNING_BODIES = new Set(["school_board", "board"]);
const OPEN_GAP_NO_STABLE_BALLOT_TEXT = "no-stable-ballot-text";

function isNonEmptyString(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function fail(msg: string): never {
  throw new Error(`levy-authority-chain validation: ${msg}`);
}

function assertObject(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${context} must be an object`);
  }
  return value as Record<string, unknown>;
}

function assertNoEmDash(str: string, context: string): void {
  if (typeof str !== "string" || !str.length) return;
  if (EM_DASH.test(str)) {
    const preview = str.length > 120 ? `${str.slice(0, 120)}...` : str;
    fail(
      `${context}: must not contain em dash (U+2014); use comma or period. Found in: ${JSON.stringify(preview)}`,
    );
  }
}

function assertHttpsSource(
  src: unknown,
  context: string,
): { text: string; url: string } {
  const obj = assertObject(src, context);
  const text = obj.text;
  const url = obj.url;
  if (!isNonEmptyString(text)) {
    fail(`${context} missing text`);
  }
  if (!isNonEmptyString(url) || !/^https:\/\//i.test(url)) {
    fail(`${context} url must use https`);
  }
  assertNoEmDash(text, `${context}.text`);
  return { text, url };
}

function normalizeLgId(raw: unknown): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const digits = t.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length <= 5 ? digits.padStart(5, "0") : digits;
}

function normalizeLabelFrag(raw: unknown): string {
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sortedLabelKey(frags: unknown): string {
  if (!Array.isArray(frags)) return "";
  const parts = frags
    .map((f) => normalizeLabelFrag(f))
    .filter((f) => f.length > 0)
    .sort();
  return parts.join("|");
}

function loadFlowGlossaryBriefTermIds(): Set<string> {
  const ids = new Set<string>(EXTRA_FLOW_BRIEF_TERM_IDS);
  for (const id of LEVY_MODAL_TERM_IDS) {
    ids.add(id);
  }
  for (const id of PARCEL_GLOSSARY_TERM_IDS) {
    ids.add(id);
  }
  return ids;
}

function assertInlineTermOnRecord(
  record: Record<string, unknown>,
  id: string,
  fieldPrefix: string,
  haystack: string,
  allowedTermIds: Set<string>,
): void {
  const termIdKey = `${fieldPrefix}TermId`;
  const matchKey = `${fieldPrefix}TermMatch`;
  const termId = record[termIdKey];
  const match = record[matchKey];
  const hasTermId = termId !== undefined;
  const hasTermMatch = match !== undefined;
  if (!hasTermId && !hasTermMatch) return;
  if (!isNonEmptyString(termId) || !allowedTermIds.has(termId)) {
    fail(
      `[${id}] ${termIdKey} must be one of ${[...allowedTermIds].join(", ")}`,
    );
  }
  if (!isNonEmptyString(match)) {
    fail(`[${id}] ${matchKey} must be a non-empty string`);
  }
  if (!haystack.toLowerCase().includes(match.toLowerCase())) {
    fail(`[${id}] ${matchKey} "${match}" not found in ${fieldPrefix}`);
  }
}

type LevyAuthorityChainFileV2 = {
  version: number;
  entries: LevyAuthorityChainEntryRecord[];
  allowedInlineTermIds: string[];
};

/**
 * @param root - Repo root (defaults to `process.cwd()`).
 */
export function validateLevyAuthorityChainEntries(root = process.cwd()): void {
  const path = join(root, "public/data/levy-authority-chain-entries.json");
  const raw = readFileSync(path, "utf8");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    fail(`invalid JSON: ${(e as Error).message}`);
  }
  validateLevyAuthorityChainData(data);
}

/**
 * Validate a parsed authority-chain file object (version 2).
 * Exported for focused negative-path unit tests.
 */
export function validateLevyAuthorityChainData(data: unknown): void {
  const flowBriefTermIds = loadFlowGlossaryBriefTermIds();

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    fail("top-level value must be an object");
  }
  const file = data as LevyAuthorityChainFileV2;

  if (file.version !== 2) {
    fail("top-level `version` must be 2 (structured template records)");
  }
  if (!Array.isArray(file.entries)) fail("top-level `entries` must be an array");
  if (
    !Array.isArray(file.allowedInlineTermIds) ||
    file.allowedInlineTermIds.length === 0
  ) {
    fail("top-level `allowedInlineTermIds` must be a non-empty array");
  }

  const allowedTermIds = new Set<string>();
  for (const termId of file.allowedInlineTermIds) {
    if (!isNonEmptyString(termId)) {
      fail("`allowedInlineTermIds` entries must be non-empty strings");
    }
    if (allowedTermIds.has(termId)) {
      fail(`duplicate allowedInlineTermIds entry: ${termId}`);
    }
    if (!flowBriefTermIds.has(termId)) {
      fail(
        `allowedInlineTermIds entry "${termId}" is not a flow glossary brief id (isFlowGlossaryTermId)`,
      );
    }
    allowedTermIds.add(termId);
  }

  const byEntryId = new Map<string, boolean>();
  const byLevyCode = new Map<string, string>();
  const bySourceTag = new Map<string, string>();
  const byLgAndLabel = new Map<string, string>();
  const byLabelOnly = new Map<string, string>();

  for (const record of file.entries) {
    if (!record || typeof record !== "object") fail("each entry must be an object");
    const id = record.id;
    if (!isNonEmptyString(id)) fail("entry missing non-empty `id`");
    if (byEntryId.has(id)) fail(`duplicate entry id: ${id}`);
    byEntryId.set(id, true);

    const match = record.match;
    if (!match || typeof match !== "object") fail(`[${id}] missing \`match\``);

    const code = isNonEmptyString(match.levyLineCode)
      ? match.levyLineCode.trim().toUpperCase()
      : "";
    const tag = isNonEmptyString(match.sourceTagId)
      ? match.sourceTagId.trim()
      : "";
    const lgRaw = isNonEmptyString(match.lgId) ? match.lgId.trim() : "";
    const lgNorm = normalizeLgId(lgRaw);
    const frags = Array.isArray(match.labelContainsAll)
      ? match.labelContainsAll
      : [];
    const labelKey = sortedLabelKey(frags);
    const hasFrags = labelKey.length > 0;

    if (!code && !tag && !lgNorm && !hasFrags) {
      fail(
        `[${id}] match needs levyLineCode, sourceTagId, lgId+labelContainsAll, or labelContainsAll`,
      );
    }
    if (lgRaw && !code) {
      if (!hasFrags) {
        fail(
          `[${id}] match has \`lgId\` but no \`levyLineCode\`: add \`labelContainsAll\``,
        );
      }
    }
    if (lgRaw && !lgNorm) fail(`[${id}] match.lgId has no digits`);

    if (code) {
      if (byLevyCode.has(code)) {
        fail(
          `[${id}] duplicate match.levyLineCode ${code} (also ${byLevyCode.get(code)})`,
        );
      }
      byLevyCode.set(code, id);
    }
    if (tag) {
      if (bySourceTag.has(tag)) {
        fail(
          `[${id}] duplicate match.sourceTagId ${tag} (also ${bySourceTag.get(tag)})`,
        );
      }
      bySourceTag.set(tag, id);
    }
    if (lgNorm && !code && hasFrags) {
      const k = `${lgNorm}|${labelKey}`;
      if (byLgAndLabel.has(k)) {
        fail(`[${id}] duplicate lgId+label match (also ${byLgAndLabel.get(k)})`);
      }
      byLgAndLabel.set(k, id);
    }
    if (!code && !tag && !lgNorm && hasFrags) {
      if (byLabelOnly.has(labelKey)) {
        fail(
          `[${id}] duplicate labelContainsAll-only match (also ${byLabelOnly.get(labelKey)})`,
        );
      }
      byLabelOnly.set(labelKey, id);
    }

    assertObject(record.authority, `[${id}] authority`);
    if (!isNonEmptyString(record.authority.displayName)) {
      fail(`[${id}] authority.displayName required`);
    }
    if (!isNonEmptyString(record.authority.countyListName)) {
      fail(`[${id}] authority.countyListName required`);
    }
    if (!GOVERNING_BODIES.has(record.authority.governingBody)) {
      fail(`[${id}] authority.governingBody must be school_board or board`);
    }
    assertNoEmDash(
      record.authority.displayName,
      `[${id}].authority.displayName`,
    );
    assertNoEmDash(
      record.authority.countyListName,
      `[${id}].authority.countyListName`,
    );

    const summarySource = assertHttpsSource(
      record.summarySource,
      `[${id}] summarySource`,
    );
    if (summarySource.text !== SUMMARY_ATTRIBUTION_TEXT) {
      fail(
        `[${id}] summarySource.text must equal SUMMARY_ATTRIBUTION_TEXT from levyAuthorityChainTemplates.ts`,
      );
    }

    assertObject(record.summary, `[${id}] summary`);
    if (
      !Array.isArray(record.summary.headlineIssues) ||
      record.summary.headlineIssues.length === 0
    ) {
      fail(`[${id}] summary.headlineIssues must be a non-empty array`);
    }
    if (!isNonEmptyString(record.summary.headlineElection)) {
      fail(`[${id}] summary.headlineElection required`);
    }
    if (record.summary.headlineNote !== undefined) {
      assertNoEmDash(
        record.summary.headlineNote,
        `[${id}].summary.headlineNote`,
      );
    }
    if (record.summary.also !== undefined) {
      if (!Array.isArray(record.summary.also)) {
        fail(`[${id}] summary.also must be an array`);
      }
      for (const also of record.summary.also) {
        assertObject(also, `[${id}] summary.also item`);
        if (!Array.isArray(also.issues) || also.issues.length === 0) {
          fail(`[${id}] summary.also.issues must be non-empty`);
        }
        if (!isNonEmptyString(also.election)) {
          fail(`[${id}] summary.also.election required`);
        }
        if (also.suffix !== undefined) {
          assertNoEmDash(also.suffix, `[${id}].summary.also.suffix`);
        }
      }
    }

    assertObject(record.mills, `[${id}] mills`);
    if (typeof record.mills.currentYear !== "number") {
      fail(`[${id}] mills.currentYear must be a number`);
    }
    if (typeof record.mills.priorYear !== "number") {
      fail(`[${id}] mills.priorYear must be a number`);
    }
    if (!isNonEmptyString(record.mills.currentMills)) {
      fail(`[${id}] mills.currentMills required`);
    }
    if (!isNonEmptyString(record.mills.priorMills)) {
      fail(`[${id}] mills.priorMills required`);
    }
    assertHttpsSource(
      record.mills.currentRateSource,
      `[${id}] mills.currentRateSource`,
    );
    assertHttpsSource(
      record.mills.priorRateSource,
      `[${id}] mills.priorRateSource`,
    );

    if (!Array.isArray(record.measures) || record.measures.length === 0) {
      fail(`[${id}] measures must be a non-empty array`);
    }
    const stepIds = new Set<string>();
    let hasUnavailableBallotText = false;
    for (const measure of record.measures) {
      assertObject(measure, `[${id}] measure`);
      if (!isNonEmptyString(measure.stepId))
        fail(`[${id}] measure missing stepId`);
      if (stepIds.has(measure.stepId)) {
        fail(`[${id}] duplicate measure stepId: ${measure.stepId}`);
      }
      stepIds.add(measure.stepId);
      if (!isNonEmptyString(measure.ballotIssue)) {
        fail(`[${id}] measure ${measure.stepId} missing ballotIssue`);
      }
      if (!MEASURE_KINDS.has(measure.kind)) {
        fail(
          `[${id}] measure ${measure.stepId} kind must be override, bond, or debt_free_mill`,
        );
      }
      if (!isNonEmptyString(measure.electionMonthYear)) {
        fail(`[${id}] measure ${measure.stepId} missing electionMonthYear`);
      }
      if (!isNonEmptyString(measure.detail)) {
        fail(`[${id}] measure ${measure.stepId} missing detail`);
      }
      assertNoEmDash(measure.detail, `[${id}].measure.${measure.stepId}.detail`);
      if (measure.bodyLead !== undefined && !BODY_LEADS.has(measure.bodyLead)) {
        fail(`[${id}] measure ${measure.stepId} invalid bodyLead`);
      }
      if (measure.maxMillIncreasePerYear !== undefined) {
        if (measure.kind !== "override") {
          fail(
            `[${id}] measure ${measure.stepId} maxMillIncreasePerYear only on override measures`,
          );
        }
        if (
          typeof measure.maxMillIncreasePerYear !== "number" ||
          !Number.isFinite(measure.maxMillIncreasePerYear) ||
          measure.maxMillIncreasePerYear <= 0
        ) {
          fail(
            `[${id}] measure ${measure.stepId} maxMillIncreasePerYear must be a positive number`,
          );
        }
      }
      if (measure.titleYearSuffix !== undefined) {
        if (measure.kind !== "bond") {
          fail(
            `[${id}] measure ${measure.stepId} titleYearSuffix only on bond measures`,
          );
        }
        if (!isNonEmptyString(measure.titleYearSuffix)) {
          fail(
            `[${id}] measure ${measure.stepId} titleYearSuffix must be a non-empty string`,
          );
        }
      }
      if (!BALLOT_TEXT_KINDS.has(measure.ballotTextKind)) {
        fail(
          `[${id}] measure ${measure.stepId} ballotTextKind must be notice, sample_ballot, or unavailable`,
        );
      }
      if (measure.ballotTextKind === "unavailable") {
        hasUnavailableBallotText = true;
      }
      assertHttpsSource(
        measure.ballotTextSource,
        `[${id}] measure ${measure.stepId} ballotTextSource`,
      );
      assertObject(measure.votes, `[${id}] measure ${measure.stepId} votes`);
      for (const key of ["yes", "yesPct", "no", "noPct"] as const) {
        if (!isNonEmptyString(measure.votes[key])) {
          fail(`[${id}] measure ${measure.stepId} votes.${key} required`);
        }
      }
      assertHttpsSource(
        measure.resultsSource,
        `[${id}] measure ${measure.stepId} resultsSource`,
      );
      if (measure.bodyTermId === "term-bonds" && measure.kind !== "bond") {
        fail(
          `[${id}] measure ${measure.stepId} term-bonds only on bond measures`,
        );
      }
    }

    if (record.districtBudget !== undefined) {
      assertObject(record.districtBudget, `[${id}] districtBudget`);
      if (!isNonEmptyString(record.districtBudget.authorityShortName)) {
        fail(`[${id}] districtBudget.authorityShortName required`);
      }
      if (!isNonEmptyString(record.districtBudget.detail)) {
        fail(`[${id}] districtBudget.detail required`);
      }
      if (!isNonEmptyString(record.districtBudget.factValue)) {
        fail(`[${id}] districtBudget.factValue required`);
      }
      assertNoEmDash(
        record.districtBudget.detail,
        `[${id}].districtBudget.detail`,
      );
      assertHttpsSource(
        record.districtBudget.source,
        `[${id}] districtBudget.source`,
      );
    }

    if (!Array.isArray(record.openGapIds)) {
      fail(`[${id}] openGapIds must be an array`);
    }
    const gapIds = new Set<string>();
    for (const gapId of record.openGapIds) {
      if (!isNonEmptyString(gapId))
        fail(`[${id}] openGapIds entry must be non-empty`);
      if (!OPEN_GAP_BODIES[gapId as keyof typeof OPEN_GAP_BODIES]) {
        fail(`[${id}] unknown openGapIds entry: ${gapId}`);
      }
      if (gapIds.has(gapId)) fail(`[${id}] duplicate openGapId: ${gapId}`);
      gapIds.add(gapId);
    }
    if (
      hasUnavailableBallotText &&
      !gapIds.has(OPEN_GAP_NO_STABLE_BALLOT_TEXT)
    ) {
      fail(
        `[${id}] openGapIds must include ${OPEN_GAP_NO_STABLE_BALLOT_TEXT} when any measure has ballotTextKind unavailable`,
      );
    }

    const built = buildLevyAuthorityChainEntry(record);
    if (built.heading !== AUTHORITY_CHAIN_HEADING) {
      fail(`[${id}] built heading must be AUTHORITY_CHAIN_HEADING`);
    }
    if (!built.summary.includes(SUMMARY_ATTRIBUTION_TEXT)) {
      fail(`[${id}] built summary must include attribution text`);
    }
    assertNoEmDash(built.summary, `[${id}] built summary`);
    for (const step of built.steps) {
      assertNoEmDash(step.title, `[${id}] built step ${step.id} title`);
      assertNoEmDash(step.body, `[${id}] built step ${step.id} body`);
      assertInlineTermOnRecord(
        step as unknown as Record<string, unknown>,
        id,
        "title",
        step.title,
        allowedTermIds,
      );
      assertInlineTermOnRecord(
        step as unknown as Record<string, unknown>,
        id,
        "body",
        step.body,
        allowedTermIds,
      );
      for (const fact of step.facts) {
        assertNoEmDash(fact.label, `[${id}] built fact label`);
        assertNoEmDash(fact.value, `[${id}] built fact value`);
      }
    }
    for (const gap of built.openGaps) {
      assertNoEmDash(gap.body, `[${id}] built openGap ${gap.id}`);
    }
    assertInlineTermOnRecord(
      record.summary as unknown as Record<string, unknown>,
      id,
      "summary",
      built.summary,
      allowedTermIds,
    );
  }
}
