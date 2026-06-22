// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  safeArapahoeCompsGridPdfUrl,
  safeArapahoeLevyAspxUrl,
  safeArapahoeParcelRecordUrl,
  safeHttpOrHttpsUrl,
} from "./safeExternalHref";

describe("safeHttpOrHttpsUrl", () => {
  it("accepts https URLs", () => {
    expect(safeHttpOrHttpsUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
  });

  it("accepts http URLs", () => {
    expect(safeHttpOrHttpsUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects javascript: URLs", () => {
    expect(safeHttpOrHttpsUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty and null", () => {
    expect(safeHttpOrHttpsUrl("")).toBeNull();
    expect(safeHttpOrHttpsUrl(null)).toBeNull();
    expect(safeHttpOrHttpsUrl(undefined)).toBeNull();
  });
});

describe("safeArapahoeLevyAspxUrl", () => {
  it("accepts county Levy.aspx URLs", () => {
    expect(
      safeArapahoeLevyAspxUrl(
        "https://parcelsearch.arapahoegov.com/Levy.aspx?id=1251492",
      ),
    ).toBe("https://parcelsearch.arapahoegov.com/Levy.aspx?id=1251492");
  });

  it("rejects wrong host or path", () => {
    expect(
      safeArapahoeLevyAspxUrl("https://evil.example/Levy.aspx?id=1"),
    ).toBeNull();
    expect(
      safeArapahoeLevyAspxUrl(
        "https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=x",
      ),
    ).toBeNull();
  });

  it("rejects http (https only)", () => {
    expect(
      safeArapahoeLevyAspxUrl(
        "http://parcelsearch.arapahoegov.com/Levy.aspx?id=1",
      ),
    ).toBeNull();
  });
});

describe("safeArapahoeParcelRecordUrl", () => {
  it("builds PPINum.aspx URL from AIN", () => {
    expect(safeArapahoeParcelRecordUrl("2077-34-2-09-011")).toBe(
      "https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=2077-34-2-09-011",
    );
  });

  it("trims AIN and URL-encodes when needed", () => {
    expect(safeArapahoeParcelRecordUrl("  2077-34-2-09-011  ")).toBe(
      "https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=2077-34-2-09-011",
    );
  });

  it("returns null for empty AIN", () => {
    expect(safeArapahoeParcelRecordUrl("")).toBeNull();
    expect(safeArapahoeParcelRecordUrl(null)).toBeNull();
  });

  it("URL-encodes special characters in AIN", () => {
    expect(safeArapahoeParcelRecordUrl("a&b=c")).toBe(
      "https://parcelsearch.arapahoegov.com/PPINum.aspx?PPINum=a%26b%3Dc",
    );
  });
});

describe("safeArapahoeCompsGridPdfUrl", () => {
  it("builds FileDownload.ashx URL from AIN", () => {
    expect(safeArapahoeCompsGridPdfUrl("2077-34-2-09-011")).toBe(
      "https://parcelsearch.arapahoegov.com/FileDownload.ashx?AIN=2077-34-2-09-011",
    );
  });

  it("returns null for empty AIN", () => {
    expect(safeArapahoeCompsGridPdfUrl("   ")).toBeNull();
  });

  it("URL-encodes special characters in AIN", () => {
    expect(safeArapahoeCompsGridPdfUrl("a&b=c")).toBe(
      "https://parcelsearch.arapahoegov.com/FileDownload.ashx?AIN=a%26b%3Dc",
    );
  });
});
