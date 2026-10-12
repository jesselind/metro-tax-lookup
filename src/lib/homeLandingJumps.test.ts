// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  buildHomeLandingJumps,
  HOME_LANDING_LOOKUP_ID,
  HOME_LATEST_AUTHORITY_CHAINS_SECTION_ID,
  HOME_WHY_TAXES_GO_UP_SECTION_ID,
} from "@/lib/homeLandingJumps";
import { HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID } from "@/lib/ballotProposalNotice";

describe("buildHomeLandingJumps", () => {
  it("always includes lookup and two-numbers", () => {
    const jumps = buildHomeLandingJumps({
      showBallotNotice: false,
      showAuthorityChains: false,
    });
    expect(jumps.map((j) => j.id)).toEqual(["lookup", "why-taxes"]);
    expect(jumps[0]?.focusId).toBe(HOME_LANDING_LOOKUP_ID);
    expect(jumps[1]?.focusId).toBe(HOME_WHY_TAXES_GO_UP_SECTION_ID);
  });

  it("includes ballot and authority chains when flagged", () => {
    const jumps = buildHomeLandingJumps({
      showBallotNotice: true,
      showAuthorityChains: true,
    });
    expect(jumps.map((j) => j.id)).toEqual([
      "lookup",
      "why-taxes",
      "ballot-notice",
      "authority-chains",
    ]);
    expect(jumps[2]?.focusId).toBe(HOME_BALLOT_PROPOSAL_NOTICE_SECTION_ID);
    expect(jumps[3]?.focusId).toBe(HOME_LATEST_AUTHORITY_CHAINS_SECTION_ID);
  });
});
