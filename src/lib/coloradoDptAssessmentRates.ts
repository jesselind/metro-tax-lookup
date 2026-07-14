// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Residential DPT assessment rate *display* labels for UI copy (2026).
 * Keep in sync with `COLORADO_LOCAL_ASSESSED_RATE` / `COLORADO_SCHOOL_ASSESSED_RATE`
 * in `tools/build_arapahoe_parcel_levy_index.py` (those numerics are fixed for all
 * AssessmentYear >= 2025 until a year→rate map is added). Update both when DPT
 * publishes a new assessment-year rate pair.
 */
export const COLORADO_DPT_2026_RESIDENTIAL_LOCAL_RATE_LABEL = "6.8%";
export const COLORADO_DPT_2026_RESIDENTIAL_SCHOOL_RATE_LABEL = "7.05%";
