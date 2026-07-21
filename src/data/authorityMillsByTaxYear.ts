// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Single import site for AUTH total mills by tax year (Levy % extract).
 * Flip or regenerate via tools/extract_authority_mills_by_tax_year.py.
 */
import authorityMillsByTaxYear from "../../public/data/arapahoe-authority-mills-by-tax-year.json";

export default authorityMillsByTaxYear;
