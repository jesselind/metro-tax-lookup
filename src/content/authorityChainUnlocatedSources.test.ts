// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  AUTHORITY_CHAIN_UNLOCATED_SOURCES,
  AUTHORITY_CHAIN_UNLOCATED_SOURCES_DISCLOSURE,
  openAuthorityChainUnlocatedSources,
} from "@/content/authorityChainUnlocatedSources";

describe("authorityChainUnlocatedSources", () => {
  it("keeps every nextBest.url on https", () => {
    for (const row of AUTHORITY_CHAIN_UNLOCATED_SOURCES) {
      expect(row.nextBest.url.startsWith("https://")).toBe(true);
    }
  });

  it("keeps Littleton 4C open with a next-best https hub", () => {
    const open = openAuthorityChainUnlocatedSources();
    const littleton4c = open.find(
      (row) => row.id === "littleton-0601-4c-2020-ballot-text",
    );
    expect(littleton4c).toBeDefined();
    expect(littleton4c?.authCode).toBe("0601");
    expect(AUTHORITY_CHAIN_UNLOCATED_SOURCES.length).toBeGreaterThanOrEqual(1);
    expect(AUTHORITY_CHAIN_UNLOCATED_SOURCES_DISCLOSURE.length).toBeGreaterThan(
      0,
    );
  });

  it("does not put authorNote requirements on resident fields", () => {
    for (const row of AUTHORITY_CHAIN_UNLOCATED_SOURCES) {
      expect(row.sought.includes("docs/_working")).toBe(false);
      expect(row.lookedWhere.includes("docs/_working")).toBe(false);
    }
  });
});
