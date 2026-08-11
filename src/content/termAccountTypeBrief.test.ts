// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contract for the Account type parcel brief: multi-account Switch control only.
 * Source check (same style as glossary.fullEntries) so copy cannot drift back to
 * swap-arrow / always-on-tile wording.
 */
describe("TermAccountTypeBriefBody", () => {
  const src = readFileSync(
    join(process.cwd(), "src/content/termDefinitionBodies.tsx"),
    "utf8",
  );

  function briefSource(): string {
    const match = src.match(
      /export function TermAccountTypeBriefBody\(\) \{([\s\S]*?)\n\}/,
    );
    expect(match).not.toBeNull();
    return match![1]!;
  }

  it("describes Switch account type as multi-account only", () => {
    const body = briefSource();
    expect(body).toMatch(/Switch account type/);
    expect(body).toMatch(/identifies the account currently shown on/);
    expect(body).toMatch(/more than one account/);
    expect(body).not.toMatch(/swap arrows/i);
    expect(body).not.toMatch(/appear on this tile/i);
  });
});
