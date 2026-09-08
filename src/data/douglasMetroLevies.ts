// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Single import site for the active Douglas metro levy JSON year
 * (abstract Tax Rates extract). Flip the file path when shipping a newer year.
 * County-keyed lookups: `src/lib/metroPurposesBundle.ts`.
 */
import levyData from "../../public/data/douglas-metro-levies-2026.json";

export default levyData;
