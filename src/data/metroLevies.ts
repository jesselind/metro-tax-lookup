// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Single import site for the active Arapahoe metro levy JSON year.
 * Flip the file path here when shipping a newer extract.
 * County-keyed lookups: `src/lib/metroPurposesBundle.ts`.
 */
import levyData from "../../public/data/metro-levies-2026.json";

export default levyData;
