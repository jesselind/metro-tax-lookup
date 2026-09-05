// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { AuthorityChainUnlocatedSource } from "@/content/authorityChainUnlocatedSources";

/**
 * Client-safe /sources methodology types (no JSX).
 * Full county registration lives in `registry.tsx`.
 */

/** On this page nav link for a county methodology section. */
export type SourcesOnPageNavLink = {
  href: string;
  label: string;
};

/** Nav fields passed into SourcesCountyGate (server → client). */
export type SourcesCountyNavFields = {
  methodologyNav: SourcesOnPageNavLink;
  /**
   * Optional county-specific On this page link after the gap hub (Arapahoe
   * metro; Douglas mill PDFs).
   */
  extraNav?: SourcesOnPageNavLink;
};

/**
 * Props for optional after-gap sections (Arapahoe metro / Related PDFs today).
 * County modules that set `AfterGap: null` ignore this.
 */
export type SourcesAfterGapContext = {
  bundledIso: string | undefined;
  bundledLabel: string | null;
  unlocatedAuthorityChainSources: readonly AuthorityChainUnlocatedSource[];
};
