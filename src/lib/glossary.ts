// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** In-app glossary route (full definitions). Prefer popovers for brief help in flows. */
export const GLOSSARY_PATH = "/glossary";

/**
 * Term ids that have a full aside on `/glossary` (`AllTermDefinitionAsides`).
 * Popover-only briefs (e.g. architectural style) must not offer "More in Glossary".
 * Keep in sync when adding or removing glossary asides.
 */
export const GLOSSARY_FULL_ENTRY_TERM_IDS = [
  "term-json",
  "term-data-mart",
  "term-tiger",
  "term-actual-value",
  "term-ain",
  "term-assessed-value",
  "term-assessment-year",
  "term-comps",
  "term-nov-comps-improvement-style",
  "term-nov-comps-improvement-type",
  "term-nov-comps-luc",
  "term-nov-comps-valuation-grade",
  "term-legal-description",
  "term-lg-id",
  "term-mill-levy",
  "term-owner-list",
  "term-parcel",
  "term-parcel-record",
  "term-photo-sketch",
  "term-pin",
  "term-property-classification",
  "term-situs-address",
  "term-special-districts",
  "term-state-use",
  "term-tag",
  "term-tax-entity",
] as const;

export type GlossaryFullEntryTermId = (typeof GLOSSARY_FULL_ENTRY_TERM_IDS)[number];

const GLOSSARY_FULL_ENTRY_SET = new Set<string>(GLOSSARY_FULL_ENTRY_TERM_IDS);

/** Modal / explainer ids that share a full glossary aside under another id. */
const GLOSSARY_TERM_ALIASES: Record<string, string> = {
  "term-mills": "term-mill-levy",
  "term-levy": "term-mill-levy",
};

/** Canonical `term-*` id for a glossary aside. */
export function canonicalGlossaryTermId(termId: string): string {
  const id = termId.startsWith("term-") ? termId : `term-${termId}`;
  return GLOSSARY_TERM_ALIASES[id] ?? id;
}

/** True when `/glossary` has a full entry for this term (after alias resolution). */
export function hasGlossaryFullEntry(termId: string): boolean {
  return GLOSSARY_FULL_ENTRY_SET.has(canonicalGlossaryTermId(termId));
}

/** Hash URL for a glossary term aside (`term-*` ids). */
export function glossaryTermHref(termId: string): string {
  return `${GLOSSARY_PATH}#${canonicalGlossaryTermId(termId)}`;
}
