// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { getLocalGovernmentTypeBrief } from "@/content/localGovernmentTypeBrief";

/**
 * Whether the DOLA brief for this label mentions special districts (Glossary has the full article).
 * Used to show "More in Glossary" in the levy modal for special-district government types.
 */
export function governmentTypeBriefMentionsSpecialDistrict(displayLabel: string): boolean {
  return /special districts?/i.test(getLocalGovernmentTypeBrief(displayLabel));
}

/**
 * Plain brief for government type in the levy modal. Do not add same-page hash links here;
 * the panel offers "See full definition here" when the brief mentions special districts
 * (see `governmentTypeBriefMentionsSpecialDistrict`).
 */
export function GovernmentTypeBriefBody({ displayLabel }: { displayLabel: string }) {
  const text = getLocalGovernmentTypeBrief(displayLabel);

  return (
    <p className="text-sm leading-relaxed text-slate-800 sm:text-base">{text}</p>
  );
}
