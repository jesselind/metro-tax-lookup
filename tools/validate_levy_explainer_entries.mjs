#!/usr/bin/env node
/**
 * Validates public/data/levy-explainer-entries.json: shape, match rules, and duplicate keys
 * that would make lookup order ambiguous. No dependencies (Node 18+).
 *
 * Usage: node tools/validate_levy_explainer_entries.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const path = join(root, "public/data/levy-explainer-entries.json");

function normalizeLgIdForExplainer(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const digits = t.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length <= 5 ? digits.padStart(5, "0") : digits;
}

function sortedLabelKey(frags) {
  if (!Array.isArray(frags)) return "";
  const parts = frags
    .map((f) => String(f).toLowerCase().trim())
    .filter((f) => f.length > 0)
    .sort();
  return parts.join("|");
}

function isNonEmptyString(s) {
  return typeof s === "string" && s.trim().length > 0;
}

function fail(msg) {
  console.error(`levy-explainer validation: ${msg}`);
  process.exit(1);
}

const raw = readFileSync(path, "utf8");
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  fail(`invalid JSON: ${e.message}`);
}

if (typeof data.version !== "number") fail("top-level `version` must be a number");
if (!Array.isArray(data.entries)) fail("top-level `entries` must be an array");

const byLevyCode = new Map();
const bySourceTag = new Map();
const byLgAndLabel = new Map();
const byLabelOnly = new Map();

for (const entry of data.entries) {
  if (!entry || typeof entry !== "object") fail("each entry must be an object");
  const id = entry.id;
  if (!isNonEmptyString(id)) fail("entry missing non-empty `id`");

  const match = entry.match;
  if (!match || typeof match !== "object") fail(`[${id}] missing \`match\``);

  const code = isNonEmptyString(match.levyLineCode)
    ? match.levyLineCode.trim().toUpperCase()
    : "";
  const tag = isNonEmptyString(match.sourceTagId) ? match.sourceTagId.trim() : "";
  const lgRaw = isNonEmptyString(match.lgId) ? match.lgId.trim() : "";
  const lgNorm = normalizeLgIdForExplainer(lgRaw);
  const frags = Array.isArray(match.labelContainsAll) ? match.labelContainsAll : [];
  const labelKey = sortedLabelKey(frags);

  const hasFrags = labelKey.length > 0;

  if (lgRaw && !code) {
    if (!hasFrags) {
      fail(
        `[${id}] match has \`lgId\` but no \`levyLineCode\`: add \`labelContainsAll\` (required for LG ID path)`,
      );
    }
  }
  if (lgRaw && !lgNorm) {
    fail(`[${id}] match.lgId has no digits`);
  }

  const canMatchSomething =
    Boolean(code) ||
    Boolean(tag) ||
    (Boolean(lgNorm) && hasFrags && !code) ||
    hasFrags;

  if (!canMatchSomething) {
    fail(
      `[${id}] match must include at least one of: levyLineCode, sourceTagId, (lgId + labelContainsAll), labelContainsAll`,
    );
  }

  const origin = entry.origin;
  if (!origin || typeof origin !== "object") fail(`[${id}] missing \`origin\``);
  if (!isNonEmptyString(origin.heading)) fail(`[${id}] origin.heading required`);
  if (!isNonEmptyString(origin.level)) fail(`[${id}] origin.level required`);

  const wi = entry.whatIsIt;
  if (!wi || typeof wi !== "object") fail(`[${id}] missing \`whatIsIt\``);
  if (!Array.isArray(wi.paragraphs) || wi.paragraphs.length === 0) {
    fail(`[${id}] whatIsIt.paragraphs must be a non-empty array`);
  }
  for (const p of wi.paragraphs) {
    if (!isNonEmptyString(p)) fail(`[${id}] whatIsIt.paragraphs must be non-empty strings`);
  }

  if (!Array.isArray(entry.citationBlocks)) {
    fail(`[${id}] citationBlocks must be an array`);
  }
  for (let i = 0; i < entry.citationBlocks.length; i++) {
    const block = entry.citationBlocks[i];
    if (!block || typeof block !== "object") fail(`[${id}] citationBlocks[${i}] invalid`);
    if (!isNonEmptyString(block.label)) fail(`[${id}] citationBlocks[${i}].label required`);
    if (!Array.isArray(block.links)) fail(`[${id}] citationBlocks[${i}].links must be an array`);
    for (let j = 0; j < block.links.length; j++) {
      const link = block.links[j];
      if (!link || typeof link !== "object") fail(`[${id}] link invalid`);
      if (!isNonEmptyString(link.text)) fail(`[${id}] link text required`);
      if (!isNonEmptyString(link.url)) fail(`[${id}] link url required`);
      const u = link.url.trim();
      if (!u.startsWith("https://") && !u.startsWith("http://")) {
        fail(`[${id}] link url must start with http:// or https://`);
      }
    }
  }

  if (code) {
    const prev = byLevyCode.get(code);
    if (prev) fail(`duplicate levyLineCode "${code}": [${prev}] and [${id}]`);
    byLevyCode.set(code, id);
  }

  if (tag) {
    const prev = bySourceTag.get(tag);
    if (prev) fail(`duplicate sourceTagId "${tag}": [${prev}] and [${id}]`);
    bySourceTag.set(tag, id);
  }

  if (lgNorm && !code) {
    const k = `${lgNorm}::${labelKey}`;
    const prev = byLgAndLabel.get(k);
    if (prev) fail(`duplicate LG ID + label match "${k}": [${prev}] and [${id}]`);
    byLgAndLabel.set(k, id);
  }

  if (!code && !tag && !lgRaw && hasFrags) {
    const prev = byLabelOnly.get(labelKey);
    if (prev) fail(`duplicate label-only match "${labelKey}": [${prev}] and [${id}]`);
    byLabelOnly.set(labelKey, id);
  }
}

console.log(`OK: ${data.entries.length} levy explainer entr${data.entries.length === 1 ? "y" : "ies"} (${path})`);
