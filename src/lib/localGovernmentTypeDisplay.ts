// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Resident-facing label from DOLA "Local Government Type" strings (LG export)
 * or levy-explainer `origin.level`. Prefer short singular forms where DOLA uses
 * plural category names.
 *
 * Never surface a bare "State" type: Colorado does not levy a state property
 * tax; mills are levied and collected locally (county / municipal / district).
 *
 * DOLA sometimes stores a singleton entity title as the Local Government Type
 * (the mill's name). Rewrite those to a kind.
 */
export function normalizeLocalGovernmentTypeKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ");
}

/** Unique DOLA type strings that are entity titles, mapped to a kind. */
const UNIQUE_TITLE_TYPE_TO_KIND: Record<string, string> = {
  "cherry creek basin water quality authority": "Water quality authority",
  "regional transportation district": "Regional transportation district",
  "urban drainage and flood control district": "Urban drainage district",
};

export function formatLocalGovernmentTypeForDisplay(
  raw: string | null | undefined,
): string | null {
  let t = (raw ?? "").trim();
  if (!t) return null;
  // Explainer / DOLA may say "State" for a state-framed program; the mill is
  // still a local levy on the county bill. Rewrite so we never imply Colorado
  // has a state property tax.
  if (/^state$/i.test(t)) return "Local levy (state program)";
  if (/^counties$/i.test(t)) return "County";
  const uniqueKind = UNIQUE_TITLE_TYPE_TO_KIND[normalizeLocalGovernmentTypeKey(t)];
  if (uniqueKind) return uniqueKind;
  t = t.replace(/\s+Metropolitan\s+Districts$/i, " metropolitan district");
  t = t.replace(/\s+School\s+Districts$/i, " school district");
  t = t.replace(/\s+Districts$/i, " district");
  t = t.replace(/\s+Schools$/i, " school");
  t = t.replace(/\s+Counties$/i, " county");
  t = t.trim();
  if (!t) return null;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Government type for a mill row. Curated explainer `origin.level` wins when
 * present (the directory type can be a parent LG, e.g. county for a local levy).
 * Otherwise use the directory Local Government Type, rewritten to a kind.
 */
export function resolveLevyGovernmentTypeLabel(input: {
  directoryLocalGovernmentType?: string | null;
  explainerLevel?: string | null;
}): string | null {
  const fromExplainer = formatLocalGovernmentTypeForDisplay(input.explainerLevel);
  if (fromExplainer) return fromExplainer;
  return formatLocalGovernmentTypeForDisplay(input.directoryLocalGovernmentType);
}
