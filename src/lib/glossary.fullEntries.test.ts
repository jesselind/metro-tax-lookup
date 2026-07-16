// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GLOSSARY_FULL_ENTRY_TERM_IDS,
  hasGlossaryFullEntry,
} from "./glossary";

describe("GLOSSARY_FULL_ENTRY_TERM_IDS", () => {
  it("matches term aside ids in termDefinitions.tsx", () => {
    const path = join(process.cwd(), "src/content/termDefinitions.tsx");
    const src = readFileSync(path, "utf8");
    const asideIds = new Set(
      [...src.matchAll(/\bid="(term-[^"]+)"/g)].map((m) => m[1]),
    );
    const entryIds = new Set(GLOSSARY_FULL_ENTRY_TERM_IDS);

    expect([...asideIds].sort()).toEqual([...entryIds].sort());
  });

  it("resolves mills/levy aliases to the mill-levy entry", () => {
    expect(hasGlossaryFullEntry("term-mills")).toBe(true);
    expect(hasGlossaryFullEntry("term-levy")).toBe(true);
    expect(hasGlossaryFullEntry("term-parcel-architectural-style")).toBe(false);
  });
});
