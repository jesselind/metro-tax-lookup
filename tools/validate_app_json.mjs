#!/usr/bin/env node
/**
 * Build-time check that required app JSON files exist and have the root keys
 * the UI loaders require. Row-shape tests live in Vitest (invented ids).
 *
 * Default: validate committed shipping JSON under public/data/ for Arapahoe.
 * All wired counties (prebuild): pass --all-wired (reads tools/wired-counties.json).
 * Prove-out: pass --data-dir and --county to validate engine v2 candidate output
 * without touching public/data/. See docs/county-ingest.md.
 *
 * Usage:
 *   node tools/validate_app_json.mjs
 *   node tools/validate_app_json.mjs --all-wired
 *   node tools/validate_app_json.mjs --data-dir supporting-data/_ingest-out/douglas --county douglas
 */

import { existsSync, readFileSync, realpathSync } from "node:fs";
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
    county: {
      type: "string",
      default: "arapahoe",
    },
    "all-wired": {
      type: "boolean",
      default: false,
    },
  },
});

const dataDir = values["data-dir"].replace(/\/+$/, "") || "public/data";
const allWired = values["all-wired"] === true;
// parseArgs accepts --county <id> and --county=<id>; argv only has bare "--county" for the spaced form.
const countyExplicit = process.argv.some(
  (arg) => arg === "--county" || arg.startsWith("--county="),
);

function displayPath(absPath) {
  return relative(root, absPath) || absPath;
}

function fail(msg) {
  console.error(`app JSON validation: ${msg}`);
  process.exit(1);
}

if (allWired && countyExplicit) {
  fail("use either --all-wired or --county, not both");
}

function canonicalPath(absPath, label) {
  try {
    return realpathSync(absPath);
  } catch (e) {
    fail(`${label}: cannot resolve ${displayPath(absPath)} (${e.message})`);
  }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function normalizeCountyId(raw, label) {
  const countyId = String(raw || "").trim().toLowerCase();
  if (!/^[a-z][a-z0-9-]*$/.test(countyId)) {
    fail(`${label} must be a lowercase id (got ${JSON.stringify(raw)})`);
  }
  return countyId;
}

/**
 * County ids from tools/wired-counties.json (order preserved; duplicates rejected).
 * @returns {string[]}
 */
function loadWiredCountyIds() {
  const manifestPath = join(repoRoot, "tools/wired-counties.json");
  if (!existsSync(manifestPath)) {
    fail(`missing ${displayPath(manifestPath)}`);
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (e) {
    fail(`${displayPath(manifestPath)}: invalid JSON (${e.message})`);
  }
  if (!Array.isArray(manifest?.counties) || manifest.counties.length === 0) {
    fail(`${displayPath(manifestPath)}: counties must be a non-empty array`);
  }
  const ids = [];
  const seen = new Set();
  for (const row of manifest.counties) {
    const id = normalizeCountyId(row?.id, `${displayPath(manifestPath)} county id`);
    if (seen.has(id)) {
      fail(`${displayPath(manifestPath)}: duplicate county id ${id}`);
    }
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

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

/**
 * Optional metro purpose-row filenames for a county (present files are shape-checked).
 * Arapahoe keeps the historical unprefixed names; other counties use
 * `{countyId}-metro-levies-YYYY.json` (see metroPurposesBundle.ts).
 *
 * @param {string} countyId
 * @returns {string[]}
 */
function metroPurposesOptionalFilenames(countyId) {
  if (countyId === "arapahoe") {
    return ["metro-levies-2026.json", "metro-levies-2025.json"];
  }
  return [
    `${countyId}-metro-levies-2026.json`,
    `${countyId}-metro-levies-2025.json`,
  ];
}

/**
 * Validate required (and present optional) app JSON for one county under dataRoot.
 * Fail-fast via process.exit(1); does not return a result object.
 *
 * @param {string} countyId lowercase wired county id (e.g. arapahoe, douglas)
 * @param {string} dataRootCanonical realpath of --data-dir inside the repo
 * @returns {void}
 */
function validateCounty(countyId, dataRootCanonical) {
  const countyDataBasename = (leaf) => `${countyId}-${leaf}`;

  const REQUIRED_FILES = {
    levyStacks: countyDataBasename("levy-stacks-by-tag-id.json"),
    accountMap: countyDataBasename("pin-to-tag.json"),
  };

  const optionalFilenames = [
    countyDataBasename("situs-to-pins.json"),
    ...metroPurposesOptionalFilenames(countyId),
  ];

  const levyStacksPath = join(dataRootCanonical, REQUIRED_FILES.levyStacks);
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

  const accountMapPath = join(dataRootCanonical, REQUIRED_FILES.accountMap);
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

  for (const filename of optionalFilenames) {
    const absPath = join(dataRootCanonical, filename);
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
}

const repoRootCanonical = canonicalPath(repoRoot, "repository root");
const dataRoot = canonicalPath(resolve(repoRoot, dataDir), "--data-dir");

if (
  dataRoot !== repoRootCanonical &&
  !dataRoot.startsWith(`${repoRootCanonical}${sep}`)
) {
  fail(`--data-dir must resolve inside the repository: ${dataDir}`);
}

const countyIds = allWired
  ? loadWiredCountyIds()
  : [normalizeCountyId(values.county, "--county")];

for (const countyId of countyIds) {
  validateCounty(countyId, dataRoot);
  console.log(
    `app JSON validation: ok (${displayPath(dataRoot)}, county=${countyId})`,
  );
}

if (allWired) {
  console.log(
    `app JSON validation: ok all wired (${displayPath(dataRoot)}, counties=${countyIds.join(",")})`,
  );
}
