// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  CONTACT_EMAIL,
  REPORT_PROBLEM_MAILTO_HREF,
  buildDataLoadFailureMailtoHref,
  buildMissingParcelDataMailtoHref,
} from "@/lib/contact";
import { SITE_BRAND_NAME } from "@/content/trademarkNotice";
import { SYNTHETIC_AIN, SYNTHETIC_PIN } from "@/lib/syntheticTestIds";

describe("REPORT_PROBLEM_MAILTO_HREF", () => {
  it("uses Civic Lookup branding in the prefilled feedback email", () => {
    expect(REPORT_PROBLEM_MAILTO_HREF.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(
      true,
    );
    const query = REPORT_PROBLEM_MAILTO_HREF.slice(
      `mailto:${CONTACT_EMAIL}?`.length,
    );
    const params = new URLSearchParams(query);
    expect(params.get("subject")).toBe(`${SITE_BRAND_NAME} feedback`);
    expect(params.get("body")).toContain(
      `Hello, I found an issue with ${SITE_BRAND_NAME}.`,
    );
  });
});

describe("buildMissingParcelDataMailtoHref", () => {
  it("includes field label, PIN, and AIN in a mailto to the site contact", () => {
    const href = buildMissingParcelDataMailtoHref({
      fieldLabel: "Neighborhood",
      pin: SYNTHETIC_PIN,
      ain: SYNTHETIC_AIN,
    });
    expect(href.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(true);
    const query = href.slice(`mailto:${CONTACT_EMAIL}?`.length);
    const params = new URLSearchParams(query);
    expect(params.get("subject")).toBe("Missing parcel data: Neighborhood");
    const body = params.get("body") ?? "";
    expect(body).toContain("Field: Neighborhood");
    expect(body).toContain(`PIN: ${SYNTHETIC_PIN}`);
    expect(body).toContain(`AIN: ${SYNTHETIC_AIN}`);
    expect(body).toContain("No data found");
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

describe("buildDataLoadFailureMailtoHref", () => {
  it("prefills subject and technical detail for the site contact", () => {
    const href = buildDataLoadFailureMailtoHref(
      "/data/arapahoe-situs-to-pins.json: HTTP 503",
    );
    expect(href.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(true);
    const query = href.slice(`mailto:${CONTACT_EMAIL}?`.length);
    const params = new URLSearchParams(query);
    expect(params.get("subject")).toBe(
      `${SITE_BRAND_NAME}: lookup data failed to load`,
    );
    const body = params.get("body") ?? "";
    expect(body).toContain("/data/arapahoe-situs-to-pins.json: HTTP 503");
    expect(body).toContain("Technical detail");
  });

  it("strips control characters from the technical detail", () => {
    const href = buildDataLoadFailureMailtoHref(
      "line1\nCc: attacker@example.com",
    );
    const query = href.slice(`mailto:${CONTACT_EMAIL}?`.length);
    const params = new URLSearchParams(query);
    const body = params.get("body") ?? "";
    expect(body).not.toMatch(/\nCc:/);
    expect(body).toContain("line1 Cc: attacker@example.com");
  });
});
