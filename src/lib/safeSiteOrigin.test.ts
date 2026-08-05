// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_ORIGIN, safeSiteOrigin } from "./safeSiteOrigin";

describe("safeSiteOrigin", () => {
  it("returns the default for missing or blank input", () => {
    expect(safeSiteOrigin(undefined)).toBe(DEFAULT_SITE_ORIGIN);
    expect(safeSiteOrigin(null)).toBe(DEFAULT_SITE_ORIGIN);
    expect(safeSiteOrigin("")).toBe(DEFAULT_SITE_ORIGIN);
    expect(safeSiteOrigin("   ")).toBe(DEFAULT_SITE_ORIGIN);
  });

  it("accepts and normalizes a bare HTTPS origin", () => {
    expect(safeSiteOrigin("https://civiclookup.com")).toBe(
      "https://civiclookup.com",
    );
    expect(safeSiteOrigin("https://civiclookup.com/")).toBe(
      "https://civiclookup.com",
    );
    expect(safeSiteOrigin("  https://example.com/  ")).toBe(
      "https://example.com",
    );
  });

  it("rejects non-HTTPS, credentials, path, query, and hash", () => {
    expect(safeSiteOrigin("http://civiclookup.com")).toBe(DEFAULT_SITE_ORIGIN);
    expect(safeSiteOrigin("https://user:pass@civiclookup.com")).toBe(
      DEFAULT_SITE_ORIGIN,
    );
    expect(safeSiteOrigin("https://civiclookup.com/path")).toBe(
      DEFAULT_SITE_ORIGIN,
    );
    expect(safeSiteOrigin("https://civiclookup.com?q=1")).toBe(
      DEFAULT_SITE_ORIGIN,
    );
    expect(safeSiteOrigin("https://civiclookup.com#frag")).toBe(
      DEFAULT_SITE_ORIGIN,
    );
    expect(safeSiteOrigin("not a url")).toBe(DEFAULT_SITE_ORIGIN);
  });
});
