// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Levy-line explainer terms that have in-modal brief copy (`levyModalTermRegistry` in `termDefinitionBodies.tsx`).
 * Parcel summary tiles use separate ids (`parcelGlossaryTermBriefRegistry`); do not add those to JSON explainers.
 */

export const LEVY_MODAL_TERM_IDS = [
  "term-mills",
  "term-special-districts",
  "term-lg-id",
  "term-tax-entity",
  "term-general-operating",
  "term-bonds",
  "term-contractual-obligation",
] as const;

export type LevyModalTermId = (typeof LEVY_MODAL_TERM_IDS)[number];

export function isLevyModalTermId(id: string): id is LevyModalTermId {
  return (LEVY_MODAL_TERM_IDS as readonly string[]).includes(id);
}

/**
 * Map a county mill-form purpose label to an in-modal brief, when we have one.
 * Exact match after trim (case-insensitive). Variants like "Bonds Debt Service"
 * stay plain text until we author a matching brief.
 */
export function levyModalTermIdForMetroPurpose(
  purposeRaw: string,
): LevyModalTermId | null {
  const key = purposeRaw.trim().toLowerCase();
  switch (key) {
    case "general operating":
      return "term-general-operating";
    case "bonds":
      return "term-bonds";
    case "contractual obligation":
      return "term-contractual-obligation";
    default:
      return null;
  }
}
