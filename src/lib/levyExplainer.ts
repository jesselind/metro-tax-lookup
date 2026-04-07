import raw from "../../public/data/levy-explainer-entries.json";

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
  match: {
    labelContainsAll?: string[];
    levyLineCode?: string;
    sourceTagId?: string;
  };
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

export function normalizeLevyAuthorityLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function entryMatchesLabel(
  entry: LevyExplainerEntry,
  normalizedLabel: string,
): boolean {
  const all = entry.match.labelContainsAll;
  if (!all?.length) return false;
  const frags = all
    .map((frag) => frag.toLowerCase().trim())
    .filter((frag) => frag.length > 0);
  if (!frags.length) return false;
  return frags.every((frag) => normalizedLabel.includes(frag));
}

function entryMatchesLevyLineCode(
  entry: LevyExplainerEntry,
  levyLineCodeUpper: string,
): boolean {
  const m = entry.match.levyLineCode?.trim().toUpperCase();
  return Boolean(m && m === levyLineCodeUpper);
}

function entryMatchesSourceTag(
  entry: LevyExplainerEntry,
  sourceTagId: string,
): boolean {
  const m = entry.match.sourceTagId?.trim();
  return Boolean(m && m === sourceTagId.trim());
}

export type LevyExplainerLookupContext = {
  levyLineCode?: string;
  sourceTagId?: string;
};

/**
 * First matching explainer: levy line code, then source TAG id, then normalized authority label.
 * Add rows to `levy-explainer-entries.json`; keep `match` rules disjoint when possible.
 */
export function findLevyExplainerEntry(
  authorityLabel: string,
  options?: LevyExplainerLookupContext,
): LevyExplainerEntry | null {
  const code = options?.levyLineCode?.trim().toUpperCase() ?? "";
  if (code) {
    for (const e of LEVY_EXPLAINER_ENTRIES) {
      if (entryMatchesLevyLineCode(e, code)) return e;
    }
  }
  const tag = options?.sourceTagId?.trim() ?? "";
  if (tag) {
    for (const e of LEVY_EXPLAINER_ENTRIES) {
      if (entryMatchesSourceTag(e, tag)) return e;
    }
  }
  const n = normalizeLevyAuthorityLabel(authorityLabel);
  if (!n) return null;
  for (const e of LEVY_EXPLAINER_ENTRIES) {
    if (entryMatchesLabel(e, n)) return e;
  }
  return null;
}
