// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Self-declared audience lens on the home lookup (not inferred from the parcel).
 * Default is `"own"`; Start over resets to Own. Tenure is not assessment class.
 */
export type AudienceMode = "own" | "rent";

/** Default home audience mode (majority users are owners). */
export const DEFAULT_AUDIENCE_MODE: AudienceMode = "own";
