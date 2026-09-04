// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  sourcesPageHref,
  wiredCountyIdFromSourcesSearchParam,
} from "@/lib/sourcesPageHref";

describe("sourcesPageHref", () => {
  it("returns plain /sources with no options", () => {
    expect(sourcesPageHref()).toBe("/sources");
  });

  it("adds wired county query", () => {
    expect(sourcesPageHref({ countyId: "douglas" })).toBe(
      "/sources?county=douglas",
    );
    expect(sourcesPageHref({ countyId: "Arapahoe" })).toBe(
      "/sources?county=arapahoe",
    );
  });

  it("omits unknown county ids", () => {
    expect(sourcesPageHref({ countyId: "elpaso" })).toBe("/sources");
    expect(sourcesPageHref({ countyId: "  " })).toBe("/sources");
  });

  it("places hash after query", () => {
    expect(
      sourcesPageHref({
        countyId: "douglas",
        hash: "levy-breakdown-tool",
      }),
    ).toBe("/sources?county=douglas#levy-breakdown-tool");
    expect(sourcesPageHref({ hash: "#county-service-gaps" })).toBe(
      "/sources#county-service-gaps",
    );
  });
});

describe("wiredCountyIdFromSourcesSearchParam", () => {
  it("accepts wired ids and rejects unknown", () => {
    expect(wiredCountyIdFromSourcesSearchParam("douglas")).toBe("douglas");
    expect(wiredCountyIdFromSourcesSearchParam("Arapahoe")).toBe("arapahoe");
    expect(wiredCountyIdFromSourcesSearchParam("elpaso")).toBeNull();
    expect(wiredCountyIdFromSourcesSearchParam(undefined)).toBeNull();
    expect(wiredCountyIdFromSourcesSearchParam(["douglas", "x"])).toBe(
      "douglas",
    );
  });
});
