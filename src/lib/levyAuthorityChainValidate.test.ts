// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateLevyAuthorityChainEntries } from "@/lib/levyAuthorityChainValidate";

describe("levyAuthorityChainValidate", () => {
  it("accepts the shipped levy-authority-chain-entries.json", () => {
    expect(() => validateLevyAuthorityChainEntries()).not.toThrow();
    const path = join(
      process.cwd(),
      "public/data/levy-authority-chain-entries.json",
    );
    const data = JSON.parse(readFileSync(path, "utf8")) as { entries: unknown[] };
    expect(data.entries.length).toBeGreaterThan(0);
  });
});
