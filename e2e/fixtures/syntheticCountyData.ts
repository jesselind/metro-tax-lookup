// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Tiny synthetic county JSON payloads for browser e2e only.
 *
 * Playwright route-fulfills replace the large committed `public/data/` files so
 * address → PIN → levy → shard can run without spotlighting a real resident.
 * Keep identifiers aligned with `src/lib/syntheticTestIds.ts`.
 *
 * Situs key for {@link SYNTHETIC_E2E_ADDRESS} is computed the same way as
 * `buildSitusLookupKey(9999, "", "Synthetic Test Road", "")` → `9999|SYNTHETIC TEST|`
 * (street type "Road" is dropped by `normalizeStreetNameKey`).
 */

import {
  SYNTHETIC_AIN,
  SYNTHETIC_PIN,
  SYNTHETIC_PIN_SHARD_PREFIX,
} from "../../src/lib/syntheticTestIds";

/** Address typed into the home form for the mocked lookup flow. */
export const SYNTHETIC_E2E_ADDRESS = "9999 Synthetic Test Road";

/** Must match `buildSitusLookupKey` for {@link SYNTHETIC_E2E_ADDRESS}. */
export const SYNTHETIC_E2E_SITUS_KEY = "9999|SYNTHETIC TEST|";

/** Fake TAG id used only inside e2e mocks (not a real county TAG). */
export const SYNTHETIC_E2E_TAG_ID = "9090909";

/** Levy authority name asserted in the stack UI after mocked PIN load. */
export const SYNTHETIC_E2E_AUTHORITY = "SYNTHETIC E2E TEST DISTRICT";

/**
 * Bundled metro-levies LG ID with published YoY purpose changes (Adonea MD No. 2).
 * Used only to exercise metro YoY UI in e2e; levy stack lines stay synthetic.
 */
export const SYNTHETIC_E2E_METRO_LG_ID = "65214";

/** Authority label on the synthetic metro levy line in e2e mocks. */
export const SYNTHETIC_E2E_METRO_AUTHORITY = "E2E SYNTHETIC METRO DISTRICT";

/** Owner listing asserted after parcel-record shard fetch. */
export const SYNTHETIC_E2E_OWNER = "E2E Synthetic Owner";

/** Situs line asserted from the mocked shard (not a real street). */
export const SYNTHETIC_E2E_SITUS_LINE = "9999 SYNTHETIC TEST RD";

export const SYNTHETIC_SITUS_TO_PINS = {
  snapshot: {
    bundledAsOf: "2026-01-01T00:00:00Z",
    source: "e2e synthetic fixture (not county data)",
    taxYear: "2025",
  },
  lookupVersion: 1,
  entryCount: 1,
  byKey: {
    [SYNTHETIC_E2E_SITUS_KEY]: [
      {
        pin: SYNTHETIC_PIN,
        label: `${SYNTHETIC_E2E_ADDRESS} — PIN ${SYNTHETIC_PIN}`,
      },
    ],
  },
};

export const SYNTHETIC_PIN_TO_TAG = {
  snapshot: {
    bundledAsOf: "2026-01-01T00:00:00Z",
    source: "e2e synthetic fixture (not county data)",
    taxYear: "2025",
  },
  pinDigits: 9,
  byPin: {
    [SYNTHETIC_PIN]: {
      tagId: SYNTHETIC_E2E_TAG_ID,
      tagShortDescr: "E2E",
      totalActual: 100000,
      totalAssessed: 6800,
      parcelTaxYear: "2025",
      assessmentYear: "2026",
      propertyClassDescr: "Residential",
      ownerList: SYNTHETIC_E2E_OWNER,
      ain: SYNTHETIC_AIN,
    },
  },
};

export const SYNTHETIC_LEVY_STACKS = {
  snapshot: {
    bundledAsOf: "2026-01-01T00:00:00Z",
    source: "e2e synthetic fixture (not county data)",
    taxYear: "2025",
  },
  stacksByTagId: {
    [SYNTHETIC_E2E_TAG_ID]: {
      tagId: SYNTHETIC_E2E_TAG_ID,
      taxYear: "2025",
      levyAspxUrl: `https://parcelsearch.arapahoegov.com/Levy.aspx?id=${SYNTHETIC_E2E_TAG_ID}`,
      lines: [
        {
          code: "9999",
          authorityName: SYNTHETIC_E2E_AUTHORITY,
          effectiveYear: "2025",
          status: "A",
          dolaMatch: {
            method: "none" as const,
            confidence: "low" as const,
            mills: 10,
          },
        },
      ],
    },
  },
};

/** Same as {@link SYNTHETIC_LEVY_STACKS} but with a metro LG ID that exists in bundled mill JSON. */
export const SYNTHETIC_LEVY_STACKS_WITH_METRO = {
  ...SYNTHETIC_LEVY_STACKS,
  stacksByTagId: {
    [SYNTHETIC_E2E_TAG_ID]: {
      ...SYNTHETIC_LEVY_STACKS.stacksByTagId[SYNTHETIC_E2E_TAG_ID],
      lines: [
        {
          code: "8888",
          authorityName: SYNTHETIC_E2E_METRO_AUTHORITY,
          effectiveYear: "2025",
          status: "A",
          dolaMatch: {
            method: "fuzzy" as const,
            confidence: "high" as const,
            lgId: SYNTHETIC_E2E_METRO_LG_ID,
            mills: 50.804,
          },
        },
        {
          code: "9999",
          authorityName: SYNTHETIC_E2E_AUTHORITY,
          effectiveYear: "2025",
          status: "A",
          dolaMatch: {
            method: "none" as const,
            confidence: "low" as const,
            mills: 10,
          },
        },
      ],
    },
  },
};

/**
 * Non-metro AUTH code present in bundled Levy % history with a Tax Year
 * 2024→2025 mill change (Englewood School Dist #1). Exercises all-tile YoY.
 */
export const SYNTHETIC_E2E_AUTH_YOY_CODE = "0101";

export const SYNTHETIC_LEVY_STACKS_WITH_AUTH_YOY = {
  ...SYNTHETIC_LEVY_STACKS,
  stacksByTagId: {
    [SYNTHETIC_E2E_TAG_ID]: {
      ...SYNTHETIC_LEVY_STACKS.stacksByTagId[SYNTHETIC_E2E_TAG_ID],
      lines: [
        {
          code: SYNTHETIC_E2E_AUTH_YOY_CODE,
          authorityName: SYNTHETIC_E2E_AUTHORITY,
          effectiveYear: "2025",
          status: "A",
          dolaMatch: {
            method: "none" as const,
            confidence: "low" as const,
            mills: 51.071,
          },
        },
      ],
    },
  },
};

/**
 * Levy stack whose AUTH / levy line code matches a curated authority-chain
 * entry. Shared by every "Who authorized this?" e2e case.
 */
export function syntheticLevyStacksForAuthorityChain(
  levyLineCode: string,
): typeof SYNTHETIC_LEVY_STACKS {
  const code = levyLineCode.trim();
  if (!code) {
    throw new Error("syntheticLevyStacksForAuthorityChain: levyLineCode required");
  }
  return {
    ...SYNTHETIC_LEVY_STACKS,
    stacksByTagId: {
      [SYNTHETIC_E2E_TAG_ID]: {
        ...SYNTHETIC_LEVY_STACKS.stacksByTagId[SYNTHETIC_E2E_TAG_ID],
        lines: [
          {
            code,
            authorityName: SYNTHETIC_E2E_AUTHORITY,
            effectiveYear: "2025",
            status: "A",
            dolaMatch: {
              method: "none" as const,
              confidence: "low" as const,
              mills: 54.108,
            },
          },
        ],
      },
    },
  };
}

export const SYNTHETIC_PARCEL_RECORD_SHARD = {
  snapshot: {
    bundledAsOf: "2026-01-01T00:00:00Z",
    source: "e2e synthetic fixture (not county data)",
    taxYear: "2025",
  },
  pinDigits: 9,
  shardPrefix: SYNTHETIC_PIN_SHARD_PREFIX,
  byPin: {
    [SYNTHETIC_PIN]: {
      ain: SYNTHETIC_AIN,
      situsAddress: SYNTHETIC_E2E_SITUS_LINE,
      situsCity: "E2E CITY",
      ownerList: SYNTHETIC_E2E_OWNER,
      ownershipType: "Individual",
      neighborhood: null,
      neighborhoodCode: null,
      totalActual: 100000,
      totalAssessed: 6800,
    },
  },
};

export {
  SYNTHETIC_AIN,
  SYNTHETIC_PIN,
  SYNTHETIC_PIN_SHARD_PREFIX,
};
