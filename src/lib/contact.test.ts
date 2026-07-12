// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  CONTACT_EMAIL,
  buildMissingParcelDataMailtoHref,
} from "@/lib/contact";

describe("buildMissingParcelDataMailtoHref", () => {
  it("includes field label, PIN, and AIN in a mailto to the site contact", () => {
    const href = buildMissingParcelDataMailtoHref({
      fieldLabel: "Neighborhood",
      pin: "032490811",
      ain: "2077-34-2-09-011",
    });
    expect(href.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(true);
    const query = href.slice(`mailto:${CONTACT_EMAIL}?`.length);
    const params = new URLSearchParams(query);
    expect(params.get("subject")).toBe("Missing parcel data: Neighborhood");
    const body = params.get("body") ?? "";
    expect(body).toContain("Field: Neighborhood");
    expect(body).toContain("PIN: 032490811");
    expect(body).toContain("AIN: 2077-34-2-09-011");
    expect(body).toContain('No data found');
  });

  it("sanitizes newlines in the field label and falls back when ids are blank", () => {
    const href = buildMissingParcelDataMailtoHref({
      fieldLabel: "Fireplaces\nCc: attacker@example.com",
      pin: "   ",
      ain: null,
    });
    const query = href.slice(`mailto:${CONTACT_EMAIL}?`.length);
    const params = new URLSearchParams(query);
    expect(params.get("subject")).toBe(
      "Missing parcel data: Fireplaces Cc: attacker@example.com",
    );
    const body = params.get("body") ?? "";
    expect(body).not.toMatch(/\nCc:/);
    expect(body).toContain("PIN: (not available)");
    expect(body).toContain("AIN: (not available)");
  });
});
