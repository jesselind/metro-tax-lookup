// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";

import {
  authorityChainSourceHref,
  isSourcedRecordsUrl,
  sameOriginHrefForSourcedRecordsUrl,
  sourcedRecordsCiteUrl,
  sourcedRecordsPublicRelativePath,
} from "@/lib/sourcedRecords";
import { sourcedRecordsFileExists } from "@/lib/sourcedRecordsFs";

const MINUTES =
  "https://civiclookup.com/sourced-records/town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf";

describe("sourcedRecords", () => {
  it("recognizes production sourced-records cites", () => {
    expect(isSourcedRecordsUrl(MINUTES)).toBe(true);
    expect(isSourcedRecordsUrl(`${MINUTES}#page=2`)).toBe(true);
    expect(
      isSourcedRecordsUrl(
        "https://leg.colorado.gov/sites/default/files/images/olls/crs2024-title-31.pdf",
      ),
    ).toBe(false);
    expect(isSourcedRecordsUrl("/sourced-records/town-of-bennett/x.pdf")).toBe(
      false,
    );
  });

  it("maps cites to public/ paths and verifies Antelope CORA files exist", () => {
    expect(sourcedRecordsPublicRelativePath(MINUTES)).toBe(
      "sourced-records/town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf",
    );
    expect(sourcedRecordsFileExists(MINUTES)).toBe(true);
    expect(
      sourcedRecordsFileExists(
        "https://civiclookup.com/sourced-records/town-of-bennett/antelope-hills-gid/2025-01gid-adopting-2026-budget.pdf",
      ),
    ).toBe(true);
    expect(
      sourcedRecordsFileExists(
        "https://civiclookup.com/sourced-records/town-of-bennett/antelope-hills-gid/missing.pdf",
      ),
    ).toBe(false);
  });

  it("rewrites production cites to same-origin hrefs for local serve", () => {
    expect(sameOriginHrefForSourcedRecordsUrl(MINUTES)).toBe(
      "/sourced-records/town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf",
    );
    expect(sameOriginHrefForSourcedRecordsUrl(`${MINUTES}#page=2`)).toBe(
      "/sourced-records/town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf#page=2",
    );
    expect(
      sameOriginHrefForSourcedRecordsUrl(
        "https://leg.colorado.gov/sites/default/files/images/olls/crs2024-title-31.pdf",
      ),
    ).toBe(
      "https://leg.colorado.gov/sites/default/files/images/olls/crs2024-title-31.pdf",
    );
  });

  it("authorityChainSourceHref serves sourced-records same-origin", () => {
    expect(authorityChainSourceHref(MINUTES)).toBe(
      "/sourced-records/town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf",
    );
    expect(
      authorityChainSourceHref(
        "https://leg.colorado.gov/sites/default/files/images/olls/crs2024-title-31.pdf",
      ),
    ).toBe(
      "https://leg.colorado.gov/sites/default/files/images/olls/crs2024-title-31.pdf",
    );
  });

  it("builds canonical cite URLs", () => {
    expect(
      sourcedRecordsCiteUrl(
        "town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf",
      ),
    ).toBe(MINUTES);
    expect(
      sourcedRecordsCiteUrl(
        "sourced-records/town-of-bennett/antelope-hills-gid/2025-10-14-regular-meeting-minutes.pdf",
        "page=2",
      ),
    ).toBe(`${MINUTES}#page=2`);
  });
});
