// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Resident-facing label from DOLA "Local Government Type" strings (LG export).
 * Prefer short singular forms where DOLA uses plural category names.
 */
export function formatLocalGovernmentTypeForDisplay(
  raw: string | null | undefined,
): string | null {
  let t = (raw ?? "").trim();
  if (!t) return null;
  if (/^counties$/i.test(t)) return "County";
  t = t.replace(/\s+Metropolitan\s+Districts$/i, " metropolitan district");
  t = t.replace(/\s+School\s+Districts$/i, " school district");
  t = t.replace(/\s+Districts$/i, " district");
  t = t.replace(/\s+Schools$/i, " school");
  t = t.replace(/\s+Counties$/i, " county");
  t = t.trim();
  if (!t) return null;
  return t.charAt(0).toUpperCase() + t.slice(1);
}
