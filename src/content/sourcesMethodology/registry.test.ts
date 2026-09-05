// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { wiredCountyConfigs } from "@/lib/countyConfig";
import {
  SOURCES_COUNTY_CONTENT_MODULES,
  buildSourcesAfterGapByCountyId,
  buildSourcesNavByCountyId,
  buildSourcesSectionsByCountyId,
  sourcesCountyContentModuleById,
} from "./registry";

describe("SOURCES_COUNTY_CONTENT_MODULES", () => {
  it("registers a methodology module for every wired county", () => {
    const wiredIds = wiredCountyConfigs().map((c) => c.id);
    const registeredIds = SOURCES_COUNTY_CONTENT_MODULES.map((m) => m.countyId);
    expect(registeredIds.sort()).toEqual([...wiredIds].sort());
  });

  it("gives each module a methodology nav hash and label", () => {
    for (const entry of SOURCES_COUNTY_CONTENT_MODULES) {
      expect(entry.methodologyNav.href).toMatch(/^#/);
      expect(entry.methodologyNav.label.trim().length).toBeGreaterThan(0);
      if (entry.extraNav) {
        expect(entry.extraNav.href).toMatch(/^#/);
        expect(entry.extraNav.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("requires Methodology and an explicit AfterGap (function or null)", () => {
    for (const entry of SOURCES_COUNTY_CONTENT_MODULES) {
      expect(typeof entry.Methodology).toBe("function");
      expect(
        entry.AfterGap === null || typeof entry.AfterGap === "function",
      ).toBe(true);
    }
  });

  it("builds nav, section, and after-gap maps from the same registry", () => {
    const nav = buildSourcesNavByCountyId();
    const sections = buildSourcesSectionsByCountyId();
    const afterGap = buildSourcesAfterGapByCountyId({
      bundledIso: undefined,
      bundledLabel: null,
      unlocatedAuthorityChainSources: [],
    });

    for (const entry of SOURCES_COUNTY_CONTENT_MODULES) {
      expect(nav[entry.countyId]?.methodologyNav.href).toBe(
        entry.methodologyNav.href,
      );
      expect(sections[entry.countyId]).toBeTruthy();
      expect(sourcesCountyContentModuleById(entry.countyId)?.countyId).toBe(
        entry.countyId,
      );
      if (entry.AfterGap === null) {
        expect(afterGap[entry.countyId]).toBeUndefined();
      } else {
        expect(afterGap[entry.countyId]).toBeTruthy();
      }
    }
  });

  it("keeps Arapahoe after-gap and omits Douglas (AfterGap null)", () => {
    const arapahoe = sourcesCountyContentModuleById("arapahoe");
    const douglas = sourcesCountyContentModuleById("douglas");
    expect(arapahoe?.AfterGap).not.toBeNull();
    expect(douglas?.AfterGap).toBeNull();

    const afterGap = buildSourcesAfterGapByCountyId({
      bundledIso: undefined,
      bundledLabel: null,
      unlocatedAuthorityChainSources: [],
    });
    expect(afterGap.arapahoe).toBeTruthy();
    expect(afterGap.douglas).toBeUndefined();
  });
});
