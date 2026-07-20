// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { levyModalTermIdForMetroPurpose } from "@/lib/levyModalTermIds";

describe("levyModalTermIdForMetroPurpose", () => {
  it("maps the common county purpose labels", () => {
    expect(levyModalTermIdForMetroPurpose("General Operating")).toBe(
      "term-general-operating",
    );
    expect(levyModalTermIdForMetroPurpose("Bonds")).toBe("term-bonds");
    expect(levyModalTermIdForMetroPurpose("Contractual Obligation")).toBe(
      "term-contractual-obligation",
    );
  });

  it("ignores unknown or variant labels", () => {
    expect(levyModalTermIdForMetroPurpose("Bonds Debt Service")).toBeNull();
    expect(levyModalTermIdForMetroPurpose("Total")).toBeNull();
  });
});
