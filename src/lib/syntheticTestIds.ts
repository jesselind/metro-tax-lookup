// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Invented identifiers for unit tests only.
 *
 * Do not copy real PIN, AIN, situs, owner-of-record, or neighborhood codes into
 * tests, fixtures, or comments (residential or commercial). County public data
 * under `public/data/` is separate (product runtime); tests must not spotlight a
 * real parcel.
 *
 * Convention: PINs under `01…` / `10…` and AINs under `1000-…` so they read as
 * synthetics. Prefer these constants over inventing new ones in each file.
 *
 * See README — "Tests, fixtures, and PII".
 */
export const SYNTHETIC_PIN = "010000001";

/** 6-digit shard prefix for {@link SYNTHETIC_PIN}. */
export const SYNTHETIC_PIN_SHARD_PREFIX = "010000";

/** Same PIN without the leading zero (normalizes back to {@link SYNTHETIC_PIN}). */
export const SYNTHETIC_PIN_NO_LEADING_ZERO = "10000001";

/**
 * Noisy digit string whose first and last nine-digit windows differ, for
 * multi-candidate prefix tests.
 */
export const SYNTHETIC_PIN_NOISY = "123010000001999";

/** County-shaped AIN (####-##-#-##-###); not a real parcel. */
export const SYNTHETIC_AIN = "1000-00-0-00-001";

/**
 * Multi-account synthetic situs (Real + business personal), aligned with e2e
 * `SYNTHETIC_MULTI_*` in `e2e/fixtures/syntheticCountyData.ts`.
 * Street type "Road" drops → key `8888|SYNTHETIC HOSPITAL|`.
 */
export const SYNTHETIC_MULTI_STREET_NUMBER = "8888";
export const SYNTHETIC_MULTI_STREET_NAME = "Synthetic Hospital Road";
export const SYNTHETIC_MULTI_SITUS_KEY = "8888|SYNTHETIC HOSPITAL|";
export const SYNTHETIC_MULTI_REAL_PIN = "010000201";
export const SYNTHETIC_MULTI_PERSONAL_PIN = "010000202";
/** Second personal account at the same situs (e.g. exempt equipment). */
export const SYNTHETIC_MULTI_PERSONAL_PIN_B = "010000203";
export const SYNTHETIC_MULTI_REAL_OWNER = "E2E SYNTHETIC HOSPITAL";
export const SYNTHETIC_MULTI_PERSONAL_OWNER = "E2E SYNTHETIC EQUIPMENT LLC";
export const SYNTHETIC_MULTI_PERSONAL_OWNER_B = "E2E SYNTHETIC CLINIC EXEMPT";
/** Majority ZIP+4 label at the multi situs (typeahead sample). */
export const SYNTHETIC_MULTI_LABEL_MAJORITY =
  "8888 SYNTHETIC HOSPITAL RD, E2E CITY, CO 80000-2222";
/** Minority ZIP+4 label at the same street number. */
export const SYNTHETIC_MULTI_LABEL_MINORITY =
  "8888 SYNTHETIC HOSPITAL RD, E2E CITY, CO 80000-1111";
