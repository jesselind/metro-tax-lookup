// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Invented identifiers for unit tests only.
 *
 * Do not copy real resident PIN, AIN, address, or neighborhood codes into tests,
 * fixtures, or comments. County public data under `public/data/` is separate
 * (product runtime); tests must not spotlight a real person.
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
