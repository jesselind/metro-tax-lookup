// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "../..");
const scriptPath = join(repoRoot, "tools/validate_app_json.mjs");

const cleanupPaths: string[] = [];

afterEach(() => {
  while (cleanupPaths.length > 0) {
    const path = cleanupPaths.pop();
    if (path) rmSync(path, { recursive: true, force: true });
  }
});

/** Minimal Douglas-shaped app JSON for CLI `--county douglas` (no gitignored dumps). */
function writeDouglasValidateFixture(): string {
  const dir = mkdtempSync(join(repoRoot, "supporting-data", "validate-app-json-douglas-"));
  cleanupPaths.push(dir);
  writeFileSync(
    join(dir, "douglas-levy-stacks-by-tag-id.json"),
    JSON.stringify({
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      stacksByTagId: {
        "0035": {
          tagId: "0035",
          levyAspxUrl: "",
          lines: [
            {
              code: "0001",
              authorityName: "SYNTHETIC COUNTY",
              dolaMatch: { method: "none", confidence: "low" },
            },
          ],
        },
      },
    }),
  );
  writeFileSync(
    join(dir, "douglas-pin-to-tag.json"),
    JSON.stringify({
      snapshot: { bundledAsOf: "2026-01-01", source: "test" },
      pinDigits: 8,
      byPin: {
        R0000001: { tagId: "0035", tagShortDescr: "0035" },
      },
    }),
  );
  return dir;
}

describe("validate_app_json.mjs CLI", () => {
  it(
    "validates committed Arapahoe shipping JSON by default",
    () => {
      const result = spawnSync(process.execPath, [scriptPath], {
        cwd: repoRoot,
        encoding: "utf8",
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/app JSON validation: ok/);
      expect(result.stdout).toMatch(/county=arapahoe/);
    },
    // public/data may also hold untracked Douglas shards; readdir + validate
    // still scopes to Arapahoe files but the tree walk is heavier.
    30_000,
  );

  it("validates Douglas prove-out JSON with --county and --data-dir", () => {
    const dataDir = writeDouglasValidateFixture();
    const dataDirArg = relative(repoRoot, dataDir);
    const result = spawnSync(
      process.execPath,
      [scriptPath, "--data-dir", dataDirArg, "--county", "douglas"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/county=douglas/);
  });

  it(
    "validates every wired county under public/data with --all-wired",
    () => {
      const result = spawnSync(process.execPath, [scriptPath, "--all-wired"], {
        cwd: repoRoot,
        encoding: "utf8",
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/county=arapahoe/);
      expect(result.stdout).toMatch(/county=douglas/);
      expect(result.stdout).toMatch(/ok all wired/);
    },
    60_000,
  );

  it("rejects --all-wired when a wired county's required JSON is missing", () => {
    const dir = mkdtempSync(join(repoRoot, "supporting-data", "validate-app-json-all-wired-"));
    cleanupPaths.push(dir);
    // Arapahoe-shaped only — Douglas required files absent.
    writeFileSync(
      join(dir, "arapahoe-levy-stacks-by-tag-id.json"),
      JSON.stringify({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        stacksByTagId: {},
      }),
    );
    writeFileSync(
      join(dir, "arapahoe-pin-to-tag.json"),
      JSON.stringify({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        pinDigits: 9,
        byPin: { "123456789": { tagId: "0001", tagShortDescr: "0001" } },
      }),
    );

    const dataDirArg = relative(repoRoot, dir);
    const result = spawnSync(
      process.execPath,
      [scriptPath, "--all-wired", "--data-dir", dataDirArg],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/douglas-levy-stacks-by-tag-id\.json|douglas-pin-to-tag\.json/);
  });

  it("rejects --all-wired combined with --county", () => {
    const result = spawnSync(
      process.execPath,
      [scriptPath, "--all-wired", "--county", "douglas"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/either --all-wired or --county/);
  });

  it("rejects --all-wired combined with --county=<id>", () => {
    const result = spawnSync(
      process.execPath,
      [scriptPath, "--all-wired", "--county=douglas"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/either --all-wired or --county/);
  });

  it("rejects --all-wired when Douglas metro purpose JSON has a malformed districts field", () => {
    const dir = mkdtempSync(join(repoRoot, "supporting-data", "validate-app-json-metro-"));
    cleanupPaths.push(dir);

    writeFileSync(
      join(dir, "arapahoe-levy-stacks-by-tag-id.json"),
      JSON.stringify({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        stacksByTagId: {},
      }),
    );
    writeFileSync(
      join(dir, "arapahoe-pin-to-tag.json"),
      JSON.stringify({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        pinDigits: 9,
        byPin: { "123456789": { tagId: "0001", tagShortDescr: "0001" } },
      }),
    );
    writeFileSync(
      join(dir, "douglas-levy-stacks-by-tag-id.json"),
      JSON.stringify({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        stacksByTagId: {},
      }),
    );
    writeFileSync(
      join(dir, "douglas-pin-to-tag.json"),
      JSON.stringify({
        snapshot: { bundledAsOf: "2026-01-01", source: "test" },
        pinDigits: 8,
        byPin: { R0000001: { tagId: "0035", tagShortDescr: "0035" } },
      }),
    );
    writeFileSync(
      join(dir, "douglas-metro-levies-2026.json"),
      JSON.stringify({ year: 2026, districts: "not-an-array" }),
    );

    const dataDirArg = relative(repoRoot, dir);
    const result = spawnSync(
      process.execPath,
      [scriptPath, "--all-wired", "--data-dir", dataDirArg],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/douglas-metro-levies-2026\.json/);
    expect(result.stderr).toMatch(/missing districts array/);
  });

  it("rejects --data-dir when an in-repo symlink resolves outside the repository", () => {
    const outsideDir = mkdtempSync(join(tmpdir(), "validate-app-json-outside-"));
    cleanupPaths.push(outsideDir);

    const linkParent = mkdtempSync(
      join(repoRoot, "supporting-data", "validate-app-json-test-"),
    );
    cleanupPaths.push(linkParent);

    const linkPath = join(linkParent, "outside-link");
    symlinkSync(outsideDir, linkPath);

    const dataDirArg = relative(repoRoot, linkPath);
    const result = spawnSync(process.execPath, [scriptPath, "--data-dir", dataDirArg], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/must resolve inside the repository/);
  });
});
