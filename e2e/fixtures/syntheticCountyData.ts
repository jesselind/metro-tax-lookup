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
