// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  BALLOT_PROPOSAL_NOTICE_EYEBROW_CLASS,
  BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS,
  HOME_BALLOT_PROPOSAL_NOTICE_JUMP_BUTTON_CLASS,
} from "@/lib/toolFlowStyles";

describe("ballot proposal panel chrome (locked)", () => {
  it("keeps the dashed caution border + light red fill recipe", () => {
    expect(BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS).toContain("border-4");
    expect(BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS).toContain("border-dashed");
    expect(BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS).toContain("border-red-600");
    expect(BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS).toContain("bg-red-50");
    expect(BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS).toContain("text-red-950");
    // Reject solid-red filled / brick frames we already tried and discarded.
    expect(BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS).not.toContain("bg-red-800");
    expect(BALLOT_PROPOSAL_NOTICE_PANEL_URGENT_CLASS).not.toContain("border-red-900");
  });

  it("keeps the larger Proposed tax increase eyebrow scale", () => {
    expect(BALLOT_PROPOSAL_NOTICE_EYEBROW_CLASS).toContain("text-lg");
    expect(BALLOT_PROPOSAL_NOTICE_EYEBROW_CLASS).toContain("sm:text-xl");
    expect(BALLOT_PROPOSAL_NOTICE_EYEBROW_CLASS).toContain("uppercase");
  });

  it("keeps a solid red home jump button with equal vertical padding", () => {
    expect(HOME_BALLOT_PROPOSAL_NOTICE_JUMP_BUTTON_CLASS).toContain("bg-red-700");
    expect(HOME_BALLOT_PROPOSAL_NOTICE_JUMP_BUTTON_CLASS).toContain("py-3");
    expect(HOME_BALLOT_PROPOSAL_NOTICE_JUMP_BUTTON_CLASS).not.toContain("h-12");
  });
});
