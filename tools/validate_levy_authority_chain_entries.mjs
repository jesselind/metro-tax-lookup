#!/usr/bin/env node
/**
 * Validates public/data/levy-authority-chain-entries.json:
 * shape, unique ids/match keys, https sources on every fact, no em dash.
 * allowedInlineTermIds must resolve a flow glossary brief (same set as
 * isFlowGlossaryTermId in GlossaryTermPopover).
 *
 * Usage: node tools/validate_levy_authority_chain_entries.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const path = join(root, "public/data/levy-authority-chain-entries.json");

const EM_DASH = /\u2014/;

/** Extra briefs on FlowGlossaryTermId beyond parcel + levy-modal registries. */
const EXTRA_FLOW_BRIEF_TERM_IDS = ["term-mill-levy", "term-pin", "term-tag"];

function assertInlineTerm(step, id, fieldPrefix, haystack, allowedTermIds) {
  const termIdKey = `${fieldPrefix}TermId`;
  const matchKey = `${fieldPrefix}TermMatch`;
  const hasTermId = step[termIdKey] !== undefined;
  const hasTermMatch = step[matchKey] !== undefined;
  if (!hasTermId && !hasTermMatch) return;
  if (!isNonEmptyString(step[termIdKey]) || !allowedTermIds.has(step[termIdKey])) {
    fail(
      `[${id}] step ${step.id} ${termIdKey} must be one of ${[...allowedTermIds].join(", ")}`,
    );
  }
  if (!isNonEmptyString(step[matchKey])) {
    fail(`[${id}] step ${step.id} ${matchKey} must be a non-empty string`);
  }
  if (!haystack.toLowerCase().includes(step[matchKey].toLowerCase())) {
    fail(
      `[${id}] step ${step.id} ${matchKey} "${step[matchKey]}" not found in ${fieldPrefix}`,
    );
  }
}

function isNonEmptyString(s) {
  return typeof s === "string" && s.trim().length > 0;
}

function fail(msg) {
  console.error(`levy-authority-chain validation: ${msg}`);
  process.exit(1);
}

function assertObject(value, context) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${context} must be an object`);
  }
}

function assertNoEmDash(str, context) {
  if (typeof str !== "string" || !str.length) return;
  if (EM_DASH.test(str)) {
    const preview = str.length > 120 ? `${str.slice(0, 120)}...` : str;
    fail(
      `${context}: must not contain em dash (U+2014); use comma or period. Found in: ${JSON.stringify(preview)}`,
    );
  }
}

function normalizeLgId(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const digits = t.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length <= 5 ? digits.padStart(5, "0") : digits;
}

/** Align with src/lib/levyEntryMatch.ts normalizeLevyAuthorityLabel. */
function normalizeLabelFrag(raw) {
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sortedLabelKey(frags) {
  if (!Array.isArray(frags)) return "";
  const parts = frags
    .map((f) => normalizeLabelFrag(f))
    .filter((f) => f.length > 0)
    .sort();
  return parts.join("|");
}

/**
 * Parse `export const NAME = [ "term-…", … ] as const` from a TS source file.
 */
function parseTermIdConstArray(filePath, constName) {
  const src = readFileSync(filePath, "utf8");
  const re = new RegExp(
    `${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`,
  );
  const m = src.match(re);
  if (!m) {
    fail(`could not parse ${constName} from ${filePath}`);
  }
  const ids = [];
  for (const hit of m[1].matchAll(/"(term-[^"]+)"/g)) {
    ids.push(hit[1]);
  }
  if (ids.length === 0) {
    fail(`${constName} in ${filePath} had no term ids`);
  }
  return ids;
}

/** Same brief-capable ids as isFlowGlossaryTermId (GlossaryTermPopover). */
function loadFlowGlossaryBriefTermIds() {
  const ids = new Set(EXTRA_FLOW_BRIEF_TERM_IDS);
  for (const id of parseTermIdConstArray(
    join(root, "src/lib/levyModalTermIds.ts"),
    "LEVY_MODAL_TERM_IDS",
  )) {
    ids.add(id);
  }
  for (const id of parseTermIdConstArray(
    join(root, "src/content/termDefinitionBodies.tsx"),
    "PARCEL_GLOSSARY_TERM_IDS",
  )) {
    ids.add(id);
  }
  return ids;
}

const flowBriefTermIds = loadFlowGlossaryBriefTermIds();

const raw = readFileSync(path, "utf8");
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  fail(`invalid JSON: ${e.message}`);
}

if (typeof data.version !== "number") fail("top-level `version` must be a number");
if (!Array.isArray(data.entries)) fail("top-level `entries` must be an array");
if (!Array.isArray(data.allowedInlineTermIds) || data.allowedInlineTermIds.length === 0) {
  fail("top-level `allowedInlineTermIds` must be a non-empty array");
}
const allowedTermIds = new Set();
for (const termId of data.allowedInlineTermIds) {
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

const byEntryId = new Map();
const byLevyCode = new Map();
const bySourceTag = new Map();
const byLgAndLabel = new Map();
const byLabelOnly = new Map();

for (const entry of data.entries) {
  if (!entry || typeof entry !== "object") fail("each entry must be an object");
  const id = entry.id;
  if (!isNonEmptyString(id)) fail("entry missing non-empty `id`");
  if (byEntryId.has(id)) fail(`duplicate entry id: ${id}`);
  byEntryId.set(id, true);

  const match = entry.match;
  if (!match || typeof match !== "object") fail(`[${id}] missing \`match\``);

  const code = isNonEmptyString(match.levyLineCode)
    ? match.levyLineCode.trim().toUpperCase()
    : "";
  const tag = isNonEmptyString(match.sourceTagId) ? match.sourceTagId.trim() : "";
  const lgRaw = isNonEmptyString(match.lgId) ? match.lgId.trim() : "";
  const lgNorm = normalizeLgId(lgRaw);
  const frags = Array.isArray(match.labelContainsAll) ? match.labelContainsAll : [];
  const labelKey = sortedLabelKey(frags);
  const hasFrags = labelKey.length > 0;

  if (!code && !tag && !lgNorm && !hasFrags) {
    fail(`[${id}] match needs levyLineCode, sourceTagId, lgId+labelContainsAll, or labelContainsAll`);
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
      fail(`[${id}] duplicate match.levyLineCode ${code} (also ${byLevyCode.get(code)})`);
    }
    byLevyCode.set(code, id);
  }
  if (tag) {
    if (bySourceTag.has(tag)) {
      fail(`[${id}] duplicate match.sourceTagId ${tag} (also ${bySourceTag.get(tag)})`);
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
      fail(`[${id}] duplicate labelContainsAll-only match (also ${byLabelOnly.get(labelKey)})`);
    }
    byLabelOnly.set(labelKey, id);
  }

  if (!isNonEmptyString(entry.heading)) fail(`[${id}] missing heading`);
  if (!isNonEmptyString(entry.summary)) fail(`[${id}] missing summary`);
  assertNoEmDash(entry.heading, `[${id}].heading`);
  assertNoEmDash(entry.summary, `[${id}].summary`);
  if (entry.summarySource !== undefined) {
    const source = entry.summarySource;
    if (!source || typeof source !== "object") {
      fail(`[${id}] summarySource must be an object`);
    }
    if (!isNonEmptyString(source.text) || !entry.summary.includes(source.text)) {
      fail(`[${id}] summarySource.text must appear verbatim in summary`);
    }
    if (!isNonEmptyString(source.url) || !/^https:\/\//i.test(source.url)) {
      fail(`[${id}] summarySource.url must use https`);
    }
    assertNoEmDash(source.text, `[${id}].summarySource.text`);
  }

  if (!Array.isArray(entry.steps) || entry.steps.length === 0) {
    fail(`[${id}] steps must be a non-empty array`);
  }
  if (!Array.isArray(entry.openGaps)) {
    fail(`[${id}] openGaps must be an array`);
  }

  const stepIds = new Set();
  for (const step of entry.steps) {
    assertObject(step, `[${id}] step`);
    if (!isNonEmptyString(step.id)) fail(`[${id}] step missing id`);
    if (stepIds.has(step.id)) fail(`[${id}] duplicate step id: ${step.id}`);
    stepIds.add(step.id);
    if (!isNonEmptyString(step.title)) fail(`[${id}] step ${step.id} missing title`);
    if (!isNonEmptyString(step.body)) fail(`[${id}] step ${step.id} missing body`);
    assertNoEmDash(step.title, `[${id}].steps.${step.id}.title`);
    assertNoEmDash(step.body, `[${id}].steps.${step.id}.body`);
    assertInlineTerm(step, id, "title", step.title, allowedTermIds);
    assertInlineTerm(step, id, "body", step.body, allowedTermIds);
    if (!Array.isArray(step.facts)) fail(`[${id}] step ${step.id} facts must be an array`);
    const factLabels = new Set();
    for (const fact of step.facts) {
      assertObject(fact, `[${id}] step ${step.id} fact`);
      if (!isNonEmptyString(fact.label)) {
        fail(`[${id}] step ${step.id} fact missing label`);
      }
      const labelKeyFact = fact.label.trim().toLowerCase();
      if (factLabels.has(labelKeyFact)) {
        fail(`[${id}] step ${step.id} duplicate fact label: ${fact.label}`);
      }
      factLabels.add(labelKeyFact);
      if (!isNonEmptyString(fact.value)) {
        fail(`[${id}] step ${step.id} fact "${fact.label}" missing value`);
      }
      assertNoEmDash(fact.label, `[${id}] fact label`);
      assertNoEmDash(fact.value, `[${id}] fact value`);
      if (!Array.isArray(fact.sources) || fact.sources.length === 0) {
        fail(
          `[${id}] step ${step.id} fact "${fact.label}" must have at least one source`,
        );
      }
      for (const src of fact.sources) {
        assertObject(src, `[${id}] step ${step.id} fact "${fact.label}" source`);
        if (!isNonEmptyString(src.text)) {
          fail(`[${id}] source missing text on fact "${fact.label}"`);
        }
        if (!isNonEmptyString(src.url) || !/^https:\/\//i.test(src.url)) {
          fail(
            `[${id}] source url must be https for fact "${fact.label}": ${src.url}`,
          );
        }
        assertNoEmDash(src.text, `[${id}] source text`);
      }
    }
  }

  const gapIds = new Set();
  for (const gap of entry.openGaps) {
    assertObject(gap, `[${id}] openGap`);
    if (!isNonEmptyString(gap.id)) fail(`[${id}] openGap missing id`);
    if (gapIds.has(gap.id)) fail(`[${id}] duplicate openGap id: ${gap.id}`);
    gapIds.add(gap.id);
    if (!isNonEmptyString(gap.body)) fail(`[${id}] openGap ${gap.id} missing body`);
    assertNoEmDash(gap.body, `[${id}].openGaps.${gap.id}`);
  }
}

console.log(
  `levy-authority-chain validation: ok (${data.entries.length} entr${data.entries.length === 1 ? "y" : "ies"})`,
);
