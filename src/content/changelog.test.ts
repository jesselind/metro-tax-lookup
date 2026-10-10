// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  CHANGELOG_ENTRIES,
  CHANGELOG_SECTION_ORDER,
  changelogEntryBullets,
} from "@/content/changelog";
import { APP_VERSION } from "@/lib/siteRelease";

describe("CHANGELOG_ENTRIES", () => {
  it("includes the current package version as the newest entry", () => {
    expect(CHANGELOG_ENTRIES.length).toBeGreaterThan(0);
    expect(CHANGELOG_ENTRIES[0]?.version).toBe(APP_VERSION);
  });

  it("keeps versions unique and newest-first", () => {
    const versions = CHANGELOG_ENTRIES.map((e) => e.version);
    expect(new Set(versions).size).toBe(versions.length);
    for (let i = 1; i < versions.length; i++) {
      expect(
        versions[i - 1]!.localeCompare(versions[i]!, undefined, {
          numeric: true,
        }),
      ).toBeGreaterThan(0);
    }
  });

  it("requires calendar-valid date, title, and at least one section bullet per entry", () => {
    for (const entry of CHANGELOG_ENTRIES) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entry.date);
      expect(match).not.toBeNull();
      const y = Number(match![1]);
      const m = Number(match![2]);
      const d = Number(match![3]);
      // Same local-noon construction as changelog page formatChangelogDate;
      // rejects invalid calendar dates such as 2026-02-30.
      const date = new Date(y, m - 1, d, 12, 0, 0);
      expect(date.getFullYear()).toBe(y);
      expect(date.getMonth() + 1).toBe(m);
      expect(date.getDate()).toBe(d);
      expect(entry.title.trim().length).toBeGreaterThan(0);

      const bullets = changelogEntryBullets(entry);
      expect(bullets.length).toBeGreaterThan(0);

      const sectionKeys = Object.keys(entry.sections);
      for (const key of sectionKeys) {
        expect(CHANGELOG_SECTION_ORDER.some((s) => s.kind === key)).toBe(true);
        const items = entry.sections[key as keyof typeof entry.sections];
        expect(items?.length).toBeGreaterThan(0);
      }

      for (const h of bullets) {
        expect(h.trim().length).toBeGreaterThan(0);
        expect(h).not.toMatch(/\u2014/);
      }
    }
  });
});
