// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { KNOWN_ISSUE_CALLOUT_TITLE } from "@/content/knownIssueGuidance";

describe("knownIssueGuidance", () => {
  it("keeps the shared KNOWN ISSUE title stable for chrome reuse", () => {
    expect(KNOWN_ISSUE_CALLOUT_TITLE).toBe("KNOWN ISSUE");
  });
});
