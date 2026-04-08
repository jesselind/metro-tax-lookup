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
    /** DOLA / bill LG ID (digits; compared zero-padded to 5). Use with `labelContainsAll` when JSON omits `levyLineCode`. */
    lgId?: string;
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

/** Align with bill/DOLA LG ID strings (digits only; zero-pad short ids to 5 digits). */
export function normalizeLgIdForExplainer(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const digits = t.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length <= 5 ? digits.padStart(5, "0") : digits;
}

/** LG ID path: entry has `lgId` and no `levyLineCode`; requires `labelContainsAll`. */
function entryMatchesLgIdWithLabelGuard(
  entry: LevyExplainerEntry,
  normalizedOptionsLgId: string,
  normalizedLabel: string,
): boolean {
  const lg = entry.match.lgId?.trim();
  if (!lg) return false;
  if (entry.match.levyLineCode?.trim()) return false;
  if (normalizeLgIdForExplainer(lg) !== normalizedOptionsLgId) return false;
  const frags = entry.match.labelContainsAll;
  if (!frags?.length) return false;
  return entryMatchesLabel(entry, normalizedLabel);
}

export type LevyExplainerLookupContext = {
  levyLineCode?: string;
  sourceTagId?: string;
  /** From DOLA match on the levy row when present. */
  lgId?: string;
};

/**
 * First matching explainer: levy line code, then LG ID + label (JSON without `levyLineCode`),
 * then source TAG id, then `labelContainsAll`. Add rows in `levy-explainer-entries.json`; keep
 * `match` rules disjoint when possible.
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
  const optLg = normalizeLgIdForExplainer(options?.lgId);
  if (optLg) {
    const n = normalizeLevyAuthorityLabel(authorityLabel);
    if (n) {
      for (const e of LEVY_EXPLAINER_ENTRIES) {
        if (entryMatchesLgIdWithLabelGuard(e, optLg, n)) return e;
      }
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
