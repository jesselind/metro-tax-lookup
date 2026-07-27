// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import raw from "../../public/data/levy-explainer-entries.json";
import {
  findFirstMatchingLevyEntry,
  type LevyEntryLookupContext,
  type LevyEntryMatchKeys,
} from "@/lib/levyEntryMatch";

export type LevyExplainerLink = {
  text: string;
  url: string;
};

export type LevyExplainerCitationBlock = {
  label: string;
  afterLinksNote?: string;
  links: LevyExplainerLink[];
};

export type LevyExplainerEntry = {
  id: string;
  match: LevyEntryMatchKeys;
  origin: {
    heading: string;
    /** Primary answer, e.g. State, City, School district (no sentence punctuation needed). */
    level: string;
    /** Statute name, chapter, or short cite; optional second line. */
    detail?: string;
  };
  whatIsIt: {
    paragraphs: string[];
  };
  citationBlocks: LevyExplainerCitationBlock[];
};

type LevyExplainerFile = {
  version: number;
  entries: LevyExplainerEntry[];
};

const file = raw as LevyExplainerFile;

export const LEVY_EXPLAINER_ENTRIES: LevyExplainerEntry[] = file.entries;

export {
  normalizeLevyAuthorityLabel,
  normalizeLgIdForExplainer,
} from "@/lib/levyEntryMatch";

export type LevyExplainerLookupContext = LevyEntryLookupContext;

/**
 * First matching explainer: levy line code, then LG ID + label (JSON without `levyLineCode`),
 * then source TAG id, then `labelContainsAll`. Add rows in `levy-explainer-entries.json`; keep
 * `match` rules disjoint when possible.
 */
export function findLevyExplainerEntry(
  authorityLabel: string,
  options?: LevyExplainerLookupContext,
): LevyExplainerEntry | null {
  return findFirstMatchingLevyEntry(LEVY_EXPLAINER_ENTRIES, authorityLabel, options);
}
