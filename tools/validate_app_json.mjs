#!/usr/bin/env node
/**
 * Build-time check that required app JSON files exist and have the root keys
 * the UI loaders require. Row-shape tests live in Vitest (invented ids).
 *
 * Usage: node tools/validate_app_json.mjs
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const REQUIRED = {
  levyStacks: "public/data/arapahoe-levy-stacks-by-tag-id.json",
  accountMap: "public/data/arapahoe-pin-to-tag.json",
};

const OPTIONAL = {
  situs: "public/data/arapahoe-situs-to-pins.json",
  metro2026: "public/data/metro-levies-2026.json",
  metro2025: "public/data/metro-levies-2025.json",
};

function fail(msg) {
  console.error(`app JSON validation: ${msg}`);
  process.exit(1);
}

function readJson(relPath) {
  const path = join(root, relPath);
  if (!existsSync(path)) fail(`missing required file ${relPath}`);
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`${relPath}: invalid JSON (${e.message})`);
  }
  return data;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

const levyStacks = readJson(REQUIRED.levyStacks);
if (!isPlainObject(levyStacks)) fail(`${REQUIRED.levyStacks}: root must be an object`);
if (!isPlainObject(levyStacks.snapshot)) {
  fail(`${REQUIRED.levyStacks}: missing snapshot object`);
}
if (!isNonEmptyString(levyStacks.snapshot.bundledAsOf)) {
  fail(`${REQUIRED.levyStacks}: snapshot.bundledAsOf required`);
}
if (!isPlainObject(levyStacks.stacksByTagId)) {
  fail(`${REQUIRED.levyStacks}: missing stacksByTagId`);
}

const accountMap = readJson(REQUIRED.accountMap);
if (!isPlainObject(accountMap)) fail(`${REQUIRED.accountMap}: root must be an object`);
if (!isPlainObject(accountMap.snapshot)) {
  fail(`${REQUIRED.accountMap}: missing snapshot object`);
}
if (!isNonEmptyString(accountMap.snapshot.bundledAsOf)) {
  fail(`${REQUIRED.accountMap}: snapshot.bundledAsOf required`);
}
if (typeof accountMap.pinDigits !== "number" || !Number.isFinite(accountMap.pinDigits)) {
  fail(`${REQUIRED.accountMap}: pinDigits must be a finite number`);
}
if (!isPlainObject(accountMap.byPin)) {
  fail(`${REQUIRED.accountMap}: missing byPin`);
}

for (const relPath of Object.values(OPTIONAL)) {
  const path = join(root, relPath);
  if (!existsSync(path)) continue;
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`${relPath}: invalid JSON (${e.message})`);
  }
  if (!isPlainObject(data)) fail(`${relPath}: root must be an object`);
  if (relPath.includes("situs-to-pins")) {
    if (!isPlainObject(data.snapshot) || !isNonEmptyString(data.snapshot.bundledAsOf)) {
      fail(`${relPath}: snapshot.bundledAsOf required`);
    }
    if (!isPlainObject(data.byKey)) fail(`${relPath}: missing byKey`);
  } else if (relPath.includes("metro-levies")) {
    if (!Array.isArray(data.districts)) fail(`${relPath}: missing districts array`);
  }
}

console.log("app JSON validation: ok");
