// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Single import site for curated AUTH + parcel tax-area PDF page lookups.
 * Regenerate via tools/extract_authority_mills_by_tax_year.py.
 */
import authorityRateTablePages from "../../public/data/arapahoe-authority-rate-table-pages.json";

export default authorityRateTablePages;
