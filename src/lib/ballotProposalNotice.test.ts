// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  BALLOT_PROPOSAL_NOTICE_BADGE_LABEL,
  ballotProposalCountyHomeClosedFace,
  ballotProposalNoticeEntriesForCounty,
  ballotProposalNoticeHomeEntriesForCounty,
  findBallotProposalNoticeEntry,
  parcelStackHasBallotProposalNotice,
} from "@/lib/ballotProposalNotice";
import { ARAPAHOE_COUNTY_CONFIG, DOUGLAS_COUNTY_CONFIG } from "@/lib/countyConfig";

describe("ballotProposalNotice", () => {
  it("Arapahoe ships Notice on and Changed badge off for the Nov 2026 period", () => {
    expect(ARAPAHOE_COUNTY_CONFIG.features.ballotProposalNotice).toBe(true);
    expect(ARAPAHOE_COUNTY_CONFIG.features.millRateChangedBadge).toBe(false);
    expect(DOUGLAS_COUNTY_CONFIG.features.ballotProposalNotice).toBe(false);
    expect(DOUGLAS_COUNTY_CONFIG.features.millRateChangedBadge).toBe(true);
  });

  it("matches Littleton AUTH 0601 Ballot Issue 4A with Notice #page=", () => {
    const entry = findBallotProposalNoticeEntry({
      countyId: "arapahoe",
      levyLineCode: "0601",
    });
    expect(entry).not.toBeNull();
    expect(entry!.eyebrow).toBe("Proposed tax increase");
    expect(entry!.heading).toBe(
      "On the November 3, 2026 General Election ballot",
    );
    expect(entry!.summary).toContain("$10,289,724");
    expect(entry!.summary).toContain("Ballot Issue 4A");
    expect(entry!.measures).toHaveLength(1);
    expect(entry!.measures[0]!.ballotIssue).toBe("4A");
    expect(entry!.measures[0]!.titlePlain).toMatch(/voter-approved higher mill rate/i);
    expect(entry!.measures[0]!.summary).toMatch(/main operating budget/i);
    expect(entry!.measures[0]!.fiscalFacts).toEqual([
      {
        label: "Proposed tax increase (first full fiscal year)",
        value: "$10,289,724",
      },
    ]);
    expect(entry!.measures[0]!.noticeSource.url).toContain("#page=4");
    expect(entry!.measures[0]!.noticeSource.url).toContain(
      "TABOR%20Notice%202026.pdf",
    );
    expect(entry!.usesIncreaseTone).toBe(true);
  });

  it("matches City of Aurora AUTH 3001 is out of scope (sales-tax only)", () => {
    expect(
      findBallotProposalNoticeEntry({
        countyId: "arapahoe",
        levyLineCode: "3001",
      }),
    ).toBeNull();
  });

  it("matches Bennett Fire AUTH 4060 revenue-limit waiver 7G only", () => {
    const entry = findBallotProposalNoticeEntry({
      countyId: "arapahoe",
      levyLineCode: "4060",
    });
    expect(entry).not.toBeNull();
    expect(entry!.eyebrow).toBe("Revenue limit waiver");
    expect(entry!.summary).toMatch(/waive the 5\.25% property tax revenue limit/i);
    expect(entry!.measures[0]!.summary).toMatch(
      /even if revenue limits in law would otherwise block that/i,
    );
    expect(entry!.measures.map((m) => m.ballotIssue)).toEqual(["7G"]);
    expect(entry!.measures[0]!.tone).toBe("effective_increase");
    expect(entry!.measures[0]!.kind).toBe("revenue_limit_waiver");
    expect(entry!.measures[0]!.noticeSource.url).toContain("#page=9");
  });

  it("matches Hills at Cherry Creek AUTH 4365 Notice mills in closed summary", () => {
    const entry = findBallotProposalNoticeEntry({
      countyId: "arapahoe",
      levyLineCode: "4365",
    });
    expect(entry).not.toBeNull();
    expect(entry!.eyebrow).toBe("Proposed tax increase");
    expect(entry!.summary).toContain("3.688");
    expect(entry!.measures[0]!.summary).toMatch(
      /even if TABOR and the 5\.5% property tax revenue limit would otherwise block that/i,
    );
    expect(entry!.measures[0]!.fiscalFacts.some((f) => /3\.688/.test(f.value))).toBe(
      true,
    );
    expect(entry!.measures[0]!.noticeSource.url).toContain("#page=23");
  });

  it("home list keeps property-tax measures and revenue-limit waivers only", () => {
    const home = ballotProposalNoticeHomeEntriesForCounty("arapahoe");
    const closedFace = ballotProposalCountyHomeClosedFace(home);
    expect(closedFace?.eyebrow).toBe(
      "Proposed tax increases and revenue limit waiver",
    );
    expect(closedFace?.heading).toBe(
      "On the November 3, 2026 General Election ballot",
    );
    expect(home.map((e) => e.match.levyLineCode)).toEqual([
      "0601",
      "4060",
      "0901",
      "4365",
    ]);
    const bennettFire = home.find((e) => e.match.levyLineCode === "4060");
    expect(bennettFire!.measures.map((m) => m.ballotIssue)).toEqual(["7G"]);
    expect(bennettFire!.eyebrow).toBe("Revenue limit waiver");
    expect(
      home.every((e) =>
        e.measures.every(
          (m) =>
            m.kind === "property_tax_increase" ||
            m.kind === "debt_and_property_tax" ||
            m.kind === "revenue_limit_waiver",
        ),
      ),
    ).toBe(true);
    expect(ballotProposalNoticeHomeEntriesForCounty("douglas")).toEqual([]);
  });

  it("shipped Notice JSON is property-tax-related only (no sales-tax entries)", () => {
    const full = ballotProposalNoticeEntriesForCounty("arapahoe");
    expect(full).toHaveLength(4);
    expect(full.map((e) => e.match.levyLineCode)).toEqual([
      "0601",
      "4060",
      "0901",
      "4365",
    ]);
    expect(full).toEqual(ballotProposalNoticeHomeEntriesForCounty("arapahoe"));
  });

  it("returns null when ballotProposalNotice is off (Douglas)", () => {
    expect(
      findBallotProposalNoticeEntry({
        countyId: "douglas",
        levyLineCode: "0601",
      }),
    ).toBeNull();
  });

  it("returns null for unknown AUTH", () => {
    expect(
      findBallotProposalNoticeEntry({
        countyId: "arapahoe",
        levyLineCode: "9999",
      }),
    ).toBeNull();
  });

  it("resolves Notice JSON when countyId casing differs from the file map key", () => {
    const entry = findBallotProposalNoticeEntry({
      countyId: " Arapahoe ",
      levyLineCode: "0601",
    });
    expect(entry).not.toBeNull();
    expect(entry!.measures[0]!.ballotIssue).toBe("4A");
    expect(ballotProposalNoticeHomeEntriesForCounty("Arapahoe")).toHaveLength(4);
  });

  it("parcelStackHasBallotProposalNotice is true when a Notice AUTH is on the stack", () => {
    expect(
      parcelStackHasBallotProposalNotice(
        [
          { authority: "Other", levyLineCode: "9999" },
          { authority: "Littleton Public Schools", levyLineCode: "0601" },
        ],
        "arapahoe",
      ),
    ).toBe(true);
    expect(
      parcelStackHasBallotProposalNotice(
        [{ authority: "Other", levyLineCode: "9999" }],
        "arapahoe",
      ),
    ).toBe(false);
    expect(
      parcelStackHasBallotProposalNotice(
        [{ authority: "Littleton Public Schools", levyLineCode: "0601" }],
        "douglas",
      ),
    ).toBe(false);
  });

  it("exports the resident badge label", () => {
    expect(BALLOT_PROPOSAL_NOTICE_BADGE_LABEL).toBe("On the ballot");
  });
});
