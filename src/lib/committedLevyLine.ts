/**
 * Levy stack lines committed in the UI (PIN load or manual entry), shared by
 * the levy breakdown tool and the home-page stack preview.
 */

import type {
  ArapahoeDolaMatch,
  ArapahoeLevyStackLine,
  ArapahoeLevyStacksFile,
} from "@/lib/arapahoeParcelLevyData";
import {
  displayMartAuthorityName,
  fetchArapahoeLevyStacksJson,
  fetchArapahoePinToTagJson,
  pinLookupCandidates,
} from "@/lib/arapahoeParcelLevyData";
import { formatCountyLevyMillsDisplay as formatMills } from "@/lib/formatCountyLevyMills";

export type CommittedLevyLine = {
  id: string;
  /** Trimmed; may be empty (shown as placeholder label in UI). */
  authority: string;
  mills: number;
  /** Mart_TA_TAG levy line code when loaded from parcel data. */
  levyLineCode?: string;
  /** Offline DOLA / LGIS match from build script. */
  dolaMatch?: ArapahoeDolaMatch | null;
  sourceTagId?: string;
};

export function newLevyLineId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function parseMills(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number.parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1000) / 1000;
}

export function displayAuthorityForLevyLine(authority: string): string {
  return authority.trim() || "Line (add a name)";
}

/** Mart levy line code (e.g. ASSRFEES, 0601) for comparisons. */
function normalizeLevyLineCode(code: string | undefined): string {
  return (code ?? "").trim().toUpperCase();
}

/** Mills from DOLA when present on the build; otherwise 0 until the user enters them. */
function initialMillsFromStackLine(ln: ArapahoeLevyStackLine): number {
  const m = ln.dolaMatch?.mills;
  if (typeof m === "number" && Number.isFinite(m) && m >= 0) {
    return Math.round(m * 1000) / 1000;
  }
  return 0;
}

export type LoadLevyStackFromPinOk = {
  ok: true;
  lines: CommittedLevyLine[];
  matchedPin: string;
  tagShortDescr: string;
  levyAspxUrl: string;
  arapahoeStacksSnapshot: ArapahoeLevyStacksFile["snapshot"];
  awaitingTemplateMills: boolean;
  templateMillDrafts: Record<string, string>;
};

export type LoadLevyStackFromPinResult =
  | LoadLevyStackFromPinOk
  | { ok: false; error: string };

export async function loadLevyStackFromPin(
  pinInput: string,
): Promise<LoadLevyStackFromPinResult> {
  const [pins, stacks] = await Promise.all([
    fetchArapahoePinToTagJson(),
    fetchArapahoeLevyStacksJson(),
  ]);
  if (!pins?.byPin) {
    return {
      ok: false,
      error:
        "PIN lookup data is not available in this deployment. A developer must run python3 tools/build_arapahoe_parcel_levy_index.py and add public/data/arapahoe-pin-to-tag.json (see README).",
    };
  }
  if (!stacks?.stacksByTagId) {
    return {
      ok: false,
      error: "Levy stack data failed to load. Try again later.",
    };
  }
  const candidates = pinLookupCandidates(pinInput);
  if (candidates.length === 0) {
    return {
      ok: false,
      error: "Enter your parcel PIN (digits from the county record).",
    };
  }
  let row: { tagId: string; tagShortDescr: string } | undefined;
  let matchedPinKey = "";
  for (const k of candidates) {
    const hit = pins.byPin[k];
    if (hit) {
      row = hit;
      matchedPinKey = k;
      break;
    }
  }
  if (!row) {
    return {
      ok: false,
      error: `No parcel found for PIN ${candidates.join(" / ")}. Copy the 9-digit PIN from your Arapahoe property record (dashes and spaces are OK).`,
    };
  }
  const stack = stacks.stacksByTagId[row.tagId];
  if (!stack) {
    return {
      ok: false,
      error: `TAGId ${row.tagId} is missing from the bundled stacks file. Re-run the index script so it matches the mart export.`,
    };
  }
  const stackLines = stack.lines.filter(
    (ln) => normalizeLevyLineCode(ln.code) !== "ASSRFEES",
  );
  if (stackLines.length === 0) {
    return {
      ok: false,
      error:
        "This parcel has no levy lines to load after filtering. Try again or contact support.",
    };
  }
  const nextLines: CommittedLevyLine[] = stackLines.map((ln) => ({
    id: newLevyLineId(),
    authority: displayMartAuthorityName(ln.authorityName),
    mills: initialMillsFromStackLine(ln),
    levyLineCode: ln.code,
    dolaMatch: ln.dolaMatch,
    sourceTagId: stack.tagId,
  }));
  const stackSum = nextLines.reduce((a, l) => a + l.mills, 0);
  return {
    ok: true,
    lines: nextLines,
    matchedPin: matchedPinKey,
    tagShortDescr: row.tagShortDescr,
    levyAspxUrl: stack.levyAspxUrl,
    arapahoeStacksSnapshot: stacks.snapshot,
    awaitingTemplateMills: stackSum <= 0,
    templateMillDrafts: Object.fromEntries(
      nextLines.map((l) => [l.id, formatMills(l.mills)] as const),
    ),
  };
}

export function applyParcelTemplateMills(
  lines: CommittedLevyLine[],
  templateMillDrafts: Record<string, string>,
): { ok: true; lines: CommittedLevyLine[] } | { ok: false; error: string } {
  const errs: string[] = [];
  const next = lines.map((l) => {
    const raw = templateMillDrafts[l.id] ?? "";
    const m = parseMills(raw);
    if (m === null) {
      errs.push(displayAuthorityForLevyLine(l.authority));
      return l;
    }
    return { ...l, mills: m };
  });
  if (errs.length > 0) {
    return {
      ok: false,
      error: `Enter a valid levy in mills for: ${errs.slice(0, 4).join(", ")}${errs.length > 4 ? ", …" : ""}.`,
    };
  }
  const total = next.reduce((a, l) => a + l.mills, 0);
  if (total <= 0) {
    return {
      ok: false,
      error:
        "Enter at least one non-zero mill levy so the stack total is greater than zero.",
    };
  }
  return { ok: true, lines: next };
}
