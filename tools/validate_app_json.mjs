#!/usr/bin/env node
/**
 * Build-time check that required app JSON files exist and have the root keys
 * the UI loaders require. Row-shape tests live in Vitest (invented ids).
 *
 * Default: validate committed shipping JSON under public/data/.
 * Prove-out: pass --data-dir supporting-data/_ingest-out to validate engine v2
 * candidate output without touching public/data/.
 *
 * Usage:
 *   node tools/validate_app_json.mjs
 *   node tools/validate_app_json.mjs --data-dir supporting-data/_ingest-out
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const repoRoot = resolve(root);

const { values } = parseArgs({
  options: {
    "data-dir": {
      type: "string",
      default: "public/data",
    },
  },
});

const dataDir = values["data-dir"].replace(/\/+$/, "") || "public/data";
const dataRoot = resolve(repoRoot, dataDir);

function displayPath(absPath) {
  return relative(root, absPath) || absPath;
}

function fail(msg) {
  console.error(`app JSON validation: ${msg}`);
  process.exit(1);
}

if (dataRoot !== repoRoot && !dataRoot.startsWith(`${repoRoot}${sep}`)) {
  fail(`--data-dir must resolve inside the repository: ${dataDir}`);
}

const REQUIRED_FILES = {
  levyStacks: "arapahoe-levy-stacks-by-tag-id.json",
  accountMap: "arapahoe-pin-to-tag.json",
};

const OPTIONAL_FILES = {
  situs: "arapahoe-situs-to-pins.json",
  metro2026: "metro-levies-2026.json",
  metro2025: "metro-levies-2025.json",
};

function readJson(absPath) {
  if (!existsSync(absPath)) {
    fail(`missing required file ${displayPath(absPath)}`);
  }
  let data;
  try {
    data = JSON.parse(readFileSync(absPath, "utf8"));
  } catch (e) {
    fail(`${displayPath(absPath)}: invalid JSON (${e.message})`);
  }
  return data;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

const levyStacksPath = join(dataRoot, REQUIRED_FILES.levyStacks);
const levyStacks = readJson(levyStacksPath);
if (!isPlainObject(levyStacks)) {
  fail(`${displayPath(levyStacksPath)}: root must be an object`);
}
if (!isPlainObject(levyStacks.snapshot)) {
  fail(`${displayPath(levyStacksPath)}: missing snapshot object`);
}
if (!isNonEmptyString(levyStacks.snapshot.bundledAsOf)) {
  fail(`${displayPath(levyStacksPath)}: snapshot.bundledAsOf required`);
}
if (!isPlainObject(levyStacks.stacksByTagId)) {
  fail(`${displayPath(levyStacksPath)}: missing stacksByTagId`);
}

const accountMapPath = join(dataRoot, REQUIRED_FILES.accountMap);
const accountMap = readJson(accountMapPath);
if (!isPlainObject(accountMap)) {
  fail(`${displayPath(accountMapPath)}: root must be an object`);
}
if (!isPlainObject(accountMap.snapshot)) {
  fail(`${displayPath(accountMapPath)}: missing snapshot object`);
}
if (!isNonEmptyString(accountMap.snapshot.bundledAsOf)) {
  fail(`${displayPath(accountMapPath)}: snapshot.bundledAsOf required`);
}
if (
  typeof accountMap.pinDigits !== "number" ||
  !Number.isInteger(accountMap.pinDigits) ||
  accountMap.pinDigits < 1
) {
  fail(`${displayPath(accountMapPath)}: pinDigits must be a positive integer`);
}
if (!isPlainObject(accountMap.byPin)) {
  fail(`${displayPath(accountMapPath)}: missing byPin`);
}
for (const pin of Object.keys(accountMap.byPin)) {
  if (pin.length !== accountMap.pinDigits) {
    fail(
      `${displayPath(accountMapPath)}: byPin[${pin}] length must equal pinDigits (${accountMap.pinDigits})`,
    );
  }
}

for (const filename of Object.values(OPTIONAL_FILES)) {
  const absPath = join(dataRoot, filename);
  if (!existsSync(absPath)) continue;
  let data;
  try {
    data = JSON.parse(readFileSync(absPath, "utf8"));
  } catch (e) {
    fail(`${displayPath(absPath)}: invalid JSON (${e.message})`);
  }
  if (!isPlainObject(data)) fail(`${displayPath(absPath)}: root must be an object`);
  if (filename.includes("situs-to-pins")) {
    if (!isPlainObject(data.snapshot) || !isNonEmptyString(data.snapshot.bundledAsOf)) {
      fail(`${displayPath(absPath)}: snapshot.bundledAsOf required`);
    }
    if (!isPlainObject(data.byKey)) fail(`${displayPath(absPath)}: missing byKey`);
  } else if (filename.includes("metro-levies")) {
    if (!Array.isArray(data.districts)) {
      fail(`${displayPath(absPath)}: missing districts array`);
    }
  }
}

console.log(`app JSON validation: ok (${displayPath(dataRoot)})`);
