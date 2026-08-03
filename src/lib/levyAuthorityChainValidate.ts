// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Validates `public/data/levy-authority-chain-entries.json` (version 2):
 * structured records, https sources, template alignment, no em dash on built copy.
 *
 * Hard-facts: `unavailable` → forbid `detail`, require `no-stable-ballot-text`.
 * Spanish sample + AI English → require language/englishSource fields, `detail`,
 * and openGap `ballot-text-spanish-only-ai-translation`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PARCEL_GLOSSARY_TERM_IDS } from "@/content/termDefinitionBodies";
import {
  AUTHORITY_CHAIN_HEADING,
  getAuthorityChainFamilyPack,
  KNOWN_OPEN_GAP_IDS,
  OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT,
  type LevyAuthorityChainFamily,
  type LevyAuthorityChainOpenGapId,
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
  "term-de-brucing",
  "term-tabor",
];

const FAMILIES = new Set<LevyAuthorityChainFamily>(["school", "county"]);
const MEASURE_KINDS = new Set([
  "override",
  "bond",
  "debt_free_mill",
  "tabor_revenue_retention",
]);
const BODY_LEADS = new Set(["approved", "also_approved", "earlier_approved"]);
const BALLOT_TEXT_KINDS = new Set(["notice", "sample_ballot", "unavailable"]);
const GOVERNING_BODIES = new Set([
  "school_board",
  "board",
  "board_of_county_commissioners",
]);
const OPEN_GAP_NO_STABLE_BALLOT_TEXT = "no-stable-ballot-text";
const OPEN_GAP_BALLOT_TEXT_SPANISH_ONLY_AI =
  "ballot-text-spanish-only-ai-translation";
const BALLOT_TEXT_LANGUAGES = new Set(["es"]);
const BALLOT_TEXT_ENGLISH_SOURCES = new Set(["ai_translation"]);

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

    if (!FAMILIES.has(record.family as LevyAuthorityChainFamily)) {
      fail(`[${id}] family must be school or county`);
    }
    const family = record.family as LevyAuthorityChainFamily;
    const familyPack = getAuthorityChainFamilyPack(family);

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
      fail(
        `[${id}] authority.governingBody must be school_board, board, or board_of_county_commissioners`,
      );
    }
    assertNoEmDash(
      record.authority.displayName,
      `[${id}].authority.displayName`,
    );
    assertNoEmDash(
      record.authority.countyListName,
      `[${id}].authority.countyListName`,
    );
    if (record.authority.governmentBillName !== undefined) {
      if (!isNonEmptyString(record.authority.governmentBillName)) {
        fail(`[${id}] authority.governmentBillName must be a non-empty string when set`);
      }
      assertNoEmDash(
        record.authority.governmentBillName,
        `[${id}].authority.governmentBillName`,
      );
      if (family !== "county") {
        fail(
          `[${id}] authority.governmentBillName only applies to county family entries`,
        );
      }
    }

    const summarySource = assertHttpsSource(
      record.summarySource,
      `[${id}] summarySource`,
    );
    if (!summarySource.text.trim()) {
      fail(`[${id}] summarySource.text must be non-empty`);
    }
    if (summarySource.text !== summarySource.text.trim()) {
      fail(
        `[${id}] summarySource.text must not have leading or trailing whitespace`,
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
    if (record.mills.stepBody !== undefined) {
      if (!isNonEmptyString(record.mills.stepBody)) {
        fail(`[${id}] mills.stepBody must be a non-empty string when set`);
      }
      assertNoEmDash(record.mills.stepBody, `[${id}].mills.stepBody`);
    }
    if (record.mills.bodyTerms !== undefined) {
      if (!Array.isArray(record.mills.bodyTerms)) {
        fail(`[${id}] mills.bodyTerms must be an array when set`);
      }
      if (!isNonEmptyString(record.mills.stepBody)) {
        fail(
          `[${id}] mills.bodyTerms requires mills.stepBody (pack defaults use pack millsBodyTerms instead)`,
        );
      }
      const stepBodyHaystack = record.mills.stepBody;
      for (const [i, term] of record.mills.bodyTerms.entries()) {
        assertObject(term, `[${id}] mills.bodyTerms entry`);
        if (!isNonEmptyString(term.termId) || !allowedTermIds.has(term.termId)) {
          fail(
            `[${id}] mills.bodyTerms[${i}].termId must be one of ${[...allowedTermIds].join(", ")}`,
          );
        }
        if (!isNonEmptyString(term.match)) {
          fail(`[${id}] mills.bodyTerms[${i}].match must be a non-empty string`);
        }
        if (!stepBodyHaystack.toLowerCase().includes(term.match.toLowerCase())) {
          fail(
            `[${id}] mills.bodyTerms[${i}].match "${term.match}" not found in mills.stepBody`,
          );
        }
      }
    }

    if (!Array.isArray(record.measures) || record.measures.length === 0) {
      fail(`[${id}] measures must be a non-empty array`);
    }
    const stepIds = new Set<string>();
    let hasUnavailableBallotText = false;
    let hasSpanishAiTranslatedBallotText = false;
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
          `[${id}] measure ${measure.stepId} kind must be override, bond, debt_free_mill, or tabor_revenue_retention`,
        );
      }
      if (!familyPack.measureKinds.has(measure.kind)) {
        fail(
          `[${id}] measure ${measure.stepId} kind ${measure.kind} is not valid for family ${family}`,
        );
      }
      if (!isNonEmptyString(measure.electionMonthYear)) {
        fail(`[${id}] measure ${measure.stepId} missing electionMonthYear`);
      }
      if (!BALLOT_TEXT_KINDS.has(measure.ballotTextKind)) {
        fail(
          `[${id}] measure ${measure.stepId} ballotTextKind must be notice, sample_ballot, or unavailable`,
        );
      }
      // Hard-facts: ballot-framed `detail` only with live Notice / sample ballot.
      // When unavailable, substance belongs in supportingFacts / budget, not detail.
      if (measure.ballotTextKind === "unavailable") {
        hasUnavailableBallotText = true;
        if (
          measure.detail !== undefined &&
          typeof measure.detail === "string" &&
          measure.detail.trim().length > 0
        ) {
          fail(
            `[${id}] measure ${measure.stepId} must omit detail when ballotTextKind is unavailable (use supportingFacts and/or budget; vote-identity body only)`,
          );
        }
      } else if (!isNonEmptyString(measure.detail)) {
        fail(
          `[${id}] measure ${measure.stepId} missing detail (required when ballotTextKind is notice or sample_ballot)`,
        );
      }
      if (typeof measure.detail === "string") {
        assertNoEmDash(
          measure.detail,
          `[${id}].measure.${measure.stepId}.detail`,
        );
      }
      if (measure.ballotTextLanguage !== undefined) {
        if (!BALLOT_TEXT_LANGUAGES.has(measure.ballotTextLanguage)) {
          fail(
            `[${id}] measure ${measure.stepId} ballotTextLanguage must be es when set`,
          );
        }
        if (measure.ballotTextKind !== "sample_ballot") {
          fail(
            `[${id}] measure ${measure.stepId} ballotTextLanguage only on sample_ballot measures`,
          );
        }
        if (measure.ballotTextEnglishSource !== "ai_translation") {
          fail(
            `[${id}] measure ${measure.stepId} ballotTextLanguage es requires ballotTextEnglishSource ai_translation`,
          );
        }
        assertHttpsSource(
          measure.ballotTextEnglishHuntSource,
          `[${id}] measure ${measure.stepId} ballotTextEnglishHuntSource`,
        );
        hasSpanishAiTranslatedBallotText = true;
      }
      if (measure.ballotTextEnglishSource !== undefined) {
        if (!BALLOT_TEXT_ENGLISH_SOURCES.has(measure.ballotTextEnglishSource)) {
          fail(
            `[${id}] measure ${measure.stepId} ballotTextEnglishSource must be ai_translation when set`,
          );
        }
        if (measure.ballotTextLanguage !== "es") {
          fail(
            `[${id}] measure ${measure.stepId} ballotTextEnglishSource requires ballotTextLanguage es`,
          );
        }
      }
      if (measure.ballotTextEnglishHuntSource !== undefined) {
        if (measure.ballotTextLanguage !== "es") {
          fail(
            `[${id}] measure ${measure.stepId} ballotTextEnglishHuntSource only when ballotTextLanguage is es`,
          );
        }
      }
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
      if (measure.maxAuthorizedMills !== undefined) {
        if (measure.kind !== "tabor_revenue_retention") {
          fail(
            `[${id}] measure ${measure.stepId} maxAuthorizedMills only on tabor_revenue_retention measures`,
          );
        }
        if (
          typeof measure.maxAuthorizedMills !== "number" ||
          !Number.isFinite(measure.maxAuthorizedMills) ||
          measure.maxAuthorizedMills <= 0
        ) {
          fail(
            `[${id}] measure ${measure.stepId} maxAuthorizedMills must be a positive number`,
          );
        }
      }
      if (measure.kind === "tabor_revenue_retention") {
        if (
          typeof measure.maxAuthorizedMills !== "number" ||
          !Number.isFinite(measure.maxAuthorizedMills) ||
          measure.maxAuthorizedMills <= 0
        ) {
          fail(
            `[${id}] measure ${measure.stepId} tabor_revenue_retention requires maxAuthorizedMills`,
          );
        }
        if (!isNonEmptyString(measure.titlePlain)) {
          fail(
            `[${id}] measure ${measure.stepId} tabor_revenue_retention requires titlePlain`,
          );
        }
        assertNoEmDash(
          measure.titlePlain,
          `[${id}].measure.${measure.stepId}.titlePlain`,
        );
      }
      if (measure.titlePlain !== undefined) {
        if (measure.kind !== "tabor_revenue_retention") {
          fail(
            `[${id}] measure ${measure.stepId} titlePlain only on tabor_revenue_retention measures`,
          );
        }
        if (!isNonEmptyString(measure.titlePlain)) {
          fail(
            `[${id}] measure ${measure.stepId} titlePlain must be a non-empty string`,
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
      assertHttpsSource(
        measure.ballotTextSource,
        `[${id}] measure ${measure.stepId} ballotTextSource`,
      );
      if (measure.supportingFacts !== undefined) {
        if (!Array.isArray(measure.supportingFacts)) {
          fail(
            `[${id}] measure ${measure.stepId} supportingFacts must be an array`,
          );
        }
        measure.supportingFacts.forEach((fact, factIndex) => {
          assertObject(
            fact,
            `[${id}] measure ${measure.stepId} supportingFacts[${factIndex}]`,
          );
          if (!isNonEmptyString(fact.label)) {
            fail(
              `[${id}] measure ${measure.stepId} supportingFacts[${factIndex}] missing label`,
            );
          }
          if (!isNonEmptyString(fact.value)) {
            fail(
              `[${id}] measure ${measure.stepId} supportingFacts[${factIndex}] missing value`,
            );
          }
          assertNoEmDash(
            fact.label,
            `[${id}].measure.${measure.stepId}.supportingFacts[${factIndex}].label`,
          );
          assertNoEmDash(
            fact.value,
            `[${id}].measure.${measure.stepId}.supportingFacts[${factIndex}].value`,
          );
          if (!Array.isArray(fact.sources) || fact.sources.length === 0) {
            fail(
              `[${id}] measure ${measure.stepId} supportingFacts[${factIndex}] needs at least one source`,
            );
          }
          fact.sources.forEach((source, sourceIndex) => {
            assertHttpsSource(
              source,
              `[${id}] measure ${measure.stepId} supportingFacts[${factIndex}].sources[${sourceIndex}]`,
            );
          });
        });
      }
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

    if (
      record.measures.filter((m) => m.kind === "tabor_revenue_retention").length >
      1
    ) {
      fail(`[${id}] at most one tabor_revenue_retention measure per entry`);
    }

    if (record.budget !== undefined) {
      assertObject(record.budget, `[${id}] budget`);
      if (!isNonEmptyString(record.budget.authorityShortName)) {
        fail(`[${id}] budget.authorityShortName required`);
      }
      if (!isNonEmptyString(record.budget.detail)) {
        fail(`[${id}] budget.detail required`);
      }
      if (!isNonEmptyString(record.budget.factValue)) {
        fail(`[${id}] budget.factValue required`);
      }
      assertNoEmDash(record.budget.detail, `[${id}].budget.detail`);
      assertHttpsSource(record.budget.source, `[${id}] budget.source`);
    }
    if (
      (record as { districtBudget?: unknown }).districtBudget !== undefined
    ) {
      fail(
        `[${id}] districtBudget was renamed to budget; update the JSON field`,
      );
    }

    if (!Array.isArray(record.openGapIds)) {
      fail(`[${id}] openGapIds must be an array`);
    }
    const gapIds = new Set<string>();
    for (const gapId of record.openGapIds) {
      if (!isNonEmptyString(gapId))
        fail(`[${id}] openGapIds entry must be non-empty`);
      if (!KNOWN_OPEN_GAP_IDS.has(gapId as LevyAuthorityChainOpenGapId)) {
        fail(`[${id}] unknown openGapIds entry: ${gapId}`);
      }
      if (gapIds.has(gapId)) fail(`[${id}] duplicate openGapId: ${gapId}`);
      gapIds.add(gapId);
    }
    if (gapIds.has(OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT)) {
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
        fail(
          `[${id}] openGapIds ${OPEN_GAP_NO_TEMPORARY_CREDIT_MILL_SPLIT} requires exactly one tabor_revenue_retention measure with maxAuthorizedMills`,
        );
      }
    }
    if (
      hasUnavailableBallotText &&
      !gapIds.has(OPEN_GAP_NO_STABLE_BALLOT_TEXT)
    ) {
      fail(
        `[${id}] openGapIds must include ${OPEN_GAP_NO_STABLE_BALLOT_TEXT} when any measure has ballotTextKind unavailable`,
      );
    }
    if (
      hasSpanishAiTranslatedBallotText &&
      !gapIds.has(OPEN_GAP_BALLOT_TEXT_SPANISH_ONLY_AI)
    ) {
      fail(
        `[${id}] openGapIds must include ${OPEN_GAP_BALLOT_TEXT_SPANISH_ONLY_AI} when any measure uses Spanish sample + AI translation`,
      );
    }

    const built = buildLevyAuthorityChainEntry(record);
    if (built.heading !== AUTHORITY_CHAIN_HEADING) {
      fail(`[${id}] built heading must be AUTHORITY_CHAIN_HEADING`);
    }
    if (!built.summary.includes(summarySource.text)) {
      fail(`[${id}] built summary must include summarySource.text`);
    }
    assertNoEmDash(built.summary, `[${id}] built summary`);
    for (const mark of built.summaryIssueMarks ?? []) {
      if (!isNonEmptyString(mark.match)) {
        fail(`[${id}] summaryIssueMarks.match must be non-empty`);
      }
      if (!built.summary.includes(mark.match)) {
        fail(
          `[${id}] summaryIssueMarks match "${mark.match}" must appear in built summary`,
        );
      }
      if (mark.url !== undefined) {
        assertHttpsSource(
          { text: mark.match, url: mark.url },
          `[${id}] summaryIssueMarks url for "${mark.match}"`,
        );
      }
    }
    for (const step of built.steps) {
      assertNoEmDash(step.title, `[${id}] built step ${step.id} title`);
      assertNoEmDash(step.body, `[${id}] built step ${step.id} body`);
      if (step.bodyDisclosure) {
        if (!isNonEmptyString(step.bodyDisclosure.label)) {
          fail(`[${id}] built step ${step.id} bodyDisclosure.label required`);
        }
        if (!isNonEmptyString(step.bodyDisclosure.body)) {
          fail(`[${id}] built step ${step.id} bodyDisclosure.body required`);
        }
        assertNoEmDash(
          step.bodyDisclosure.label,
          `[${id}] built step ${step.id} bodyDisclosure.label`,
        );
        assertNoEmDash(
          step.bodyDisclosure.body,
          `[${id}] built step ${step.id} bodyDisclosure.body`,
        );
      }
      if (step.bodyLink) {
        if (!isNonEmptyString(step.bodyLink.match)) {
          fail(`[${id}] built step ${step.id} bodyLink.match required`);
        }
        if (!step.body.includes(step.bodyLink.match)) {
          fail(
            `[${id}] built step ${step.id} bodyLink.match must appear in body`,
          );
        }
        assertHttpsSource(
          { text: step.bodyLink.match, url: step.bodyLink.url },
          `[${id}] built step ${step.id} bodyLink`,
        );
      }
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
      if (step.bodyTerms) {
        for (const [i, term] of step.bodyTerms.entries()) {
          if (!isNonEmptyString(term.termId) || !allowedTermIds.has(term.termId)) {
            fail(
              `[${id}] built step ${step.id} bodyTerms[${i}].termId must be allowed`,
            );
          }
          if (!isNonEmptyString(term.match)) {
            fail(
              `[${id}] built step ${step.id} bodyTerms[${i}].match must be non-empty`,
            );
          }
          if (!step.body.toLowerCase().includes(term.match.toLowerCase())) {
            fail(
              `[${id}] built step ${step.id} bodyTerms[${i}].match "${term.match}" not found in body`,
            );
          }
        }
      }
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
