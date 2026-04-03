"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import parcelRecordLevyImg from "@/assets/images/parcel-record-levy.png";
import levyStackExampleImg from "@/assets/images/levy-stack-no-highlight.png";
import type { SpecialDistrictDirectoryFile } from "@/lib/specialDistrictMatch";
import { btnOutlinePrimaryMd, btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { ExampleModeCallout } from "@/components/ExampleModeCallout";
import { HelpPillButton } from "@/components/HelpPillButton";
import { LevyLineDistrictDetailDialog } from "@/components/LevyLineDistrictDetailDialog";
import { getLevyBreakdownDemoLines } from "@/lib/levyBreakdownDemoSeed";
import {
  MILLS_DEFINITION_ELEMENT_ID,
  MillsDefinitionInfoDetails,
} from "@/components/propertyTaxInfoDetails";
import { INPUT_CLASS } from "@/lib/toolFlowStyles";
import {
  ARAPAHOE_COUNTY_GEOID,
  matchSpecialDistrict,
  mergeDistrictDirectoryLayers,
} from "@/lib/specialDistrictMatch";
import type {
  ArapahoeDolaMatch,
  ArapahoeLevyStackLine,
  ArapahoeLevyStacksFile,
} from "@/lib/arapahoeParcelLevyData";
import { formatCountyLevyMillsDisplay as formatMills } from "@/lib/formatCountyLevyMills";
import {
  displayMartAuthorityName,
  fetchArapahoeLevyStacksJson,
  fetchArapahoePinToTagJson,
  formatTaxAreaShortDescrDisplay,
  pinLookupCandidates,
} from "@/lib/arapahoeParcelLevyData";
import { safeArapahoeLevyAspxUrl } from "@/lib/safeExternalHref";

const INPUT_FULL =
  `${INPUT_CLASS} w-full min-w-0 max-w-none`;

const LEVY_ENTRY_SEGMENT_BASE =
  "flex min-w-0 flex-1 items-center justify-center rounded-lg px-2 py-2.5 text-center text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:px-3 sm:py-3";
const LEVY_ENTRY_SEGMENT_ACTIVE = `${LEVY_ENTRY_SEGMENT_BASE} bg-white font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200/90`;
const LEVY_ENTRY_SEGMENT_IDLE = `${LEVY_ENTRY_SEGMENT_BASE} font-medium text-slate-600 hover:text-slate-900`;

type CommittedLine = {
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

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseMills(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number.parseFloat(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1000) / 1000;
}

/** Mills from DOLA when present on the build; otherwise 0 until the user enters them. */
function initialMillsFromStackLine(ln: ArapahoeLevyStackLine): number {
  const m = ln.dolaMatch?.mills;
  if (typeof m === "number" && Number.isFinite(m) && m >= 0) {
    return Math.round(m * 1000) / 1000;
  }
  return 0;
}

/** Mart levy line code (e.g. ASSRFEES, 0601) for comparisons. */
function normalizeLevyLineCode(code: string | undefined): string {
  return (code ?? "").trim().toUpperCase();
}

function formatPct(p: number): string {
  if (!Number.isFinite(p)) return "0.0";
  if (p >= 10) return p.toFixed(1);
  if (p >= 1) return p.toFixed(1);
  return p.toFixed(2);
}

function displayAuthority(authority: string): string {
  return authority.trim() || "Line (add a name)";
}

/** Same size on every tile for readability. */
const TILE_DESC_MILLS_CLASS =
  "text-base sm:text-lg";

/**
 * 0 = smallest share (floor), 1 = largest share (ceiling). Linear scale so each
 * rank step changes size visibly (not only at coarse Tailwind breakpoints).
 */
function pctScaleForRank(tileIndex: number, tileCount: number): number {
  if (tileCount <= 1) return 1;
  return 1 - tileIndex / (tileCount - 1);
}

/** Heroicons outline: ellipsis-vertical (MIT). */
function EllipsisVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
      />
    </svg>
  );
}

/**
 * Wide screens: as many columns as fit (typically 3-4+); narrow: one column.
 * `min(100%, …)` keeps a single column on small viewports.
 */
const LEVY_TILES_GRID_CLASS =
  "grid gap-2 sm:gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,14rem),1fr))]";

function levyTileClass(index: number, isEditing: boolean): string {
  const base =
    "relative flex min-h-0 h-full flex-col gap-2 overflow-hidden rounded-2xl border border-white/20 shadow-md sm:gap-3";
  if (isEditing) {
    return `${base} !border-indigo-400 !bg-white p-3 text-slate-900 shadow-lg ring-2 ring-indigo-300/80 sm:p-4`;
  }
  if (index === 0) {
    return `${base} min-h-[152px] p-5 sm:min-h-[168px] sm:p-6`;
  }
  return `${base} min-h-0 p-4 sm:p-4`;
}

const TILE_GRADIENTS = [
  "bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-900 text-white",
  "bg-gradient-to-br from-teal-600 via-emerald-700 to-slate-900 text-white",
  "bg-gradient-to-br from-amber-600 via-orange-700 to-rose-900 text-white",
  "bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-950 text-white",
  "bg-gradient-to-br from-fuchsia-600 via-purple-700 to-indigo-950 text-white",
  "bg-gradient-to-br from-cyan-600 via-teal-700 to-slate-900 text-white",
] as const;

const TILE_OVERFLOW_BTN_CLASS =
  "absolute right-0 top-0 z-10 flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-bl-lg rounded-tr-2xl bg-transparent text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60";

/** Share %: in-flow bottom row; m-0, leading-none, rem letter-spacing; font-size calc uses rem only. */
const LEVY_TILE_PCT_CLASS =
  "pointer-events-none shrink-0 m-0 text-right font-bold tabular-nums leading-none text-white [letter-spacing:-0.025rem] [text-shadow:0_1px_3px_rgba(0,0,0,0.3)] [font-size:calc(1.25rem+var(--pct-scale)*1.5rem)] sm:[font-size:calc(1.5rem+var(--pct-scale)*1.25rem)]";

export function LevyStackManualEntry() {
  const [useSampleData, setUseSampleData] = useState(false);
  const [lines, setLines] = useState<CommittedLine[]>([]);
  const [draft, setDraft] = useState({ authority: "", levy: "" });
  const [addError, setAddError] = useState<string | null>(null);
  const [showLevyDetails, setShowLevyDetails] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ authority: "", levy: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [tileActionsId, setTileActionsId] = useState<string | null>(null);
  const [detailLineId, setDetailLineId] = useState<string | null>(null);
  /** When turning sample on, stash prior user lines so unchecking sample can restore them. */
  const linesBeforeSampleRef = useRef<CommittedLine[] | null>(null);
  const specialDistrictFetchStartedRef = useRef(false);
  const [specialDistrictFile, setSpecialDistrictFile] =
    useState<SpecialDistrictDirectoryFile | null>(null);
  const [specialDistrictLoading, setSpecialDistrictLoading] = useState(false);
  const [specialDistrictError, setSpecialDistrictError] = useState<
    string | null
  >(null);

  const [pinInput, setPinInput] = useState("");
  /**
   * When true, PIN path (default). When false, rare fallback to type lines from the levy
   * table (unless mid PIN template flow).
   */
  const [usePinEntryPath, setUsePinEntryPath] = useState(true);
  /** Fallback: where Tax District Levies link is on parcel record (screenshot). */
  const [showTaxDistrictLevyLinkHelp, setShowTaxDistrictLevyLinkHelp] =
    useState(false);
  /** Fallback: example levy table screenshot. */
  const [showLevyTableExampleHelp, setShowLevyTableExampleHelp] =
    useState(false);
  const [pinLookupBusy, setPinLookupBusy] = useState(false);
  const [pinLookupError, setPinLookupError] = useState<string | null>(null);
  /** Validation errors from &quot;Apply mills&quot; — shown next to that control, not under PIN. */
  const [templateMillsError, setTemplateMillsError] = useState<string | null>(null);
  const [awaitingTemplateMills, setAwaitingTemplateMills] = useState(false);
  const [templateMillDrafts, setTemplateMillDrafts] = useState<
    Record<string, string>
  >({});
  const [loadedParcelMeta, setLoadedParcelMeta] = useState<{
    pin: string;
    tagShortDescr: string;
    levyAspxUrl: string;
  } | null>(null);
  /** Snapshot from arapahoe-levy-stacks-by-tag-id.json (DOLA levy column label, etc.). */
  const [arapahoeStacksSnapshot, setArapahoeStacksSnapshot] = useState<
    ArapahoeLevyStacksFile["snapshot"] | null
  >(null);

  const safeLevyTableHref = useMemo(
    () =>
      loadedParcelMeta
        ? safeArapahoeLevyAspxUrl(loadedParcelMeta.levyAspxUrl)
        : null,
    [loadedParcelMeta],
  );

  const sumMills = useMemo(() => {
    const s = lines.reduce((acc, l) => acc + l.mills, 0);
    return Math.round(s * 1000) / 1000;
  }, [lines]);

  const lineItems = useMemo(
    () =>
      lines.map((l) => ({
        id: l.id,
        authority: displayAuthority(l.authority),
        mills: l.mills,
      })),
    [lines],
  );

  const showResults = lines.length > 0 && sumMills > 0;
  /** Hide tile chart while the parcel mills editor is open (initial zero-sum or Edit stack). */
  const showTiles = showResults && !awaitingTemplateMills;

  useEffect(() => {
    if (!showResults || specialDistrictFetchStartedRef.current) return;
    specialDistrictFetchStartedRef.current = true;
    queueMicrotask(() => setSpecialDistrictLoading(true));
    Promise.all([
      fetch("/data/colorado-special-district-directory.json").then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<SpecialDistrictDirectoryFile>;
      }),
      fetch("/data/colorado-all-special-districts.json")
        .then((r) =>
          r.ok ? (r.json() as Promise<SpecialDistrictDirectoryFile>) : null,
        )
        .catch(() => null),
    ])
      .then(([special, layer]) => {
        setSpecialDistrictFile(mergeDistrictDirectoryLayers(special, [layer]));
        setSpecialDistrictError(null);
      })
      .catch(() => {
        setSpecialDistrictError(
          "Could not load the district directory. Check your connection and try again.",
        );
      })
      .finally(() => setSpecialDistrictLoading(false));
  }, [showResults]);

  const tilesSorted = useMemo(() => {
    return lineItems
      .map((item) => ({
        ...item,
        pct: (item.mills / sumMills) * 100,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [lineItems, sumMills]);

  const actionLine = useMemo(
    () => (tileActionsId ? lines.find((l) => l.id === tileActionsId) : undefined),
    [lines, tileActionsId],
  );

  const detailContext = useMemo(() => {
    if (!detailLineId) return null;
    const line = lines.find((l) => l.id === detailLineId);
    if (!line || sumMills <= 0) return null;
    const pct = (line.mills / sumMills) * 100;
    const match =
      specialDistrictFile != null
        ? matchSpecialDistrict(line.authority, specialDistrictFile.districts, {
            countyGeoid: ARAPAHOE_COUNTY_GEOID,
          })
        : null;
    return {
      line,
      authority: displayAuthority(line.authority),
      pct,
      match,
      dolaMatch: line.dolaMatch ?? null,
    };
  }, [detailLineId, lines, sumMills, specialDistrictFile]);

  const modalOpen = tileActionsId != null || detailLineId != null;

  useEffect(() => {
    if (!modalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setTileActionsId(null);
        setDetailLineId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  function setSampleEnabled(next: boolean) {
    setAddError(null);
    setEditingId(null);
    setEditError(null);
    setTileActionsId(null);
    setDetailLineId(null);
    setShowLevyDetails(false);
    setPinLookupError(null);
    setTemplateMillsError(null);
    setAwaitingTemplateMills(false);
    setTemplateMillDrafts({});
    setLoadedParcelMeta(null);
    setArapahoeStacksSnapshot(null);
    setDraft({ authority: "", levy: "" });
    setEditDraft({ authority: "", levy: "" });
    if (next) {
      if (!useSampleData && lines.length > 0) {
        linesBeforeSampleRef.current = lines.map((l) => ({ ...l }));
      } else if (!useSampleData) {
        linesBeforeSampleRef.current = null;
      }
      setUseSampleData(true);
      setLines(getLevyBreakdownDemoLines());
    } else {
      setUseSampleData(false);
      const saved = linesBeforeSampleRef.current;
      linesBeforeSampleRef.current = null;
      setLines(saved ?? []);
    }
  }

  function commitDraft() {
    setAddError(null);
    const m = parseMills(draft.levy);
    if (m === null) {
      setAddError("Enter a valid levy in mills (0 or greater).");
      return;
    }
    const newLine: CommittedLine = {
      id: newId(),
      authority: draft.authority.trim(),
      mills: m,
    };
    if (useSampleData) {
      setUseSampleData(false);
      setLines([newLine]);
    } else {
      setLines((prev) => [...prev, newLine]);
    }
    setDraft({ authority: "", levy: "" });
    setEditingId(null);
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
    setTileActionsId((cur) => (cur === id ? null : cur));
    setDetailLineId((cur) => (cur === id ? null : cur));
    if (editingId === id) {
      setEditingId(null);
      setEditError(null);
    }
  }

  function beginEdit(line: CommittedLine) {
    setTileActionsId(null);
    setDetailLineId(null);
    setEditingId(line.id);
    setEditDraft({
      authority: line.authority,
      levy: formatMills(line.mills),
    });
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  function saveEdit() {
    if (!editingId) return;
    const m = parseMills(editDraft.levy);
    if (m === null) {
      setEditError("Enter a valid levy in mills (0 or greater).");
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l.id === editingId
          ? { ...l, authority: editDraft.authority.trim(), mills: m }
          : l,
      ),
    );
    setUseSampleData(false);
    setEditingId(null);
    setEditError(null);
  }

  async function loadStackFromParcelPin() {
    setPinLookupError(null);
    setTemplateMillsError(null);
    setPinLookupBusy(true);
    try {
      const [pins, stacks] = await Promise.all([
        fetchArapahoePinToTagJson(),
        fetchArapahoeLevyStacksJson(),
      ]);
      if (!pins?.byPin) {
        setPinLookupError(
          "PIN lookup data is not available in this deployment. A developer must run python3 tools/build_arapahoe_parcel_levy_index.py and add public/data/arapahoe-pin-to-tag.json (see README).",
        );
        return;
      }
      if (!stacks?.stacksByTagId) {
        setPinLookupError("Levy stack data failed to load. Try again later.");
        return;
      }
      const candidates = pinLookupCandidates(pinInput);
      if (candidates.length === 0) {
        setPinLookupError("Enter your parcel PIN (digits from the county record).");
        return;
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
        setPinLookupError(
          `No parcel found for PIN ${candidates.join(" / ")}. Copy the 9-digit PIN from your Arapahoe property record (dashes and spaces are OK).`,
        );
        return;
      }
      const stack = stacks.stacksByTagId[row.tagId];
      if (!stack) {
        setPinLookupError(
          `TAGId ${row.tagId} is missing from the bundled stacks file. Re-run the index script so it matches the mart export.`,
        );
        return;
      }
      // Levy.aspx does not list the ASSRFEES row; omit it so the stack matches the
      // county online table and users are not asked for a value they cannot copy.
      const stackLines = stack.lines.filter(
        (ln) => normalizeLevyLineCode(ln.code) !== "ASSRFEES",
      );
      if (stackLines.length === 0) {
        setPinLookupError(
          "This parcel has no levy lines to load after filtering. Try again or contact support.",
        );
        return;
      }
      const nextLines: CommittedLine[] = stackLines.map((ln) => ({
        id: newId(),
        authority: displayMartAuthorityName(ln.authorityName),
        mills: initialMillsFromStackLine(ln),
        levyLineCode: ln.code,
        dolaMatch: ln.dolaMatch,
        sourceTagId: stack.tagId,
      }));
      const stackSum = nextLines.reduce((a, l) => a + l.mills, 0);
      setUseSampleData(false);
      linesBeforeSampleRef.current = null;
      setUsePinEntryPath(true);
      setLines(nextLines);
      setAwaitingTemplateMills(stackSum <= 0);
      setArapahoeStacksSnapshot(stacks.snapshot);
      setTemplateMillDrafts(
        Object.fromEntries(
          nextLines.map((l) => [l.id, formatMills(l.mills)] as const),
        ),
      );
      setLoadedParcelMeta({
        pin: matchedPinKey,
        tagShortDescr: row.tagShortDescr,
        levyAspxUrl: stack.levyAspxUrl,
      });
      setEditingId(null);
      setTileActionsId(null);
      setDetailLineId(null);
      setDraft({ authority: "", levy: "" });
    } finally {
      setPinLookupBusy(false);
    }
  }

  function clearParcelTemplate() {
    setLines([]);
    setAwaitingTemplateMills(false);
    setTemplateMillDrafts({});
    setLoadedParcelMeta(null);
    setArapahoeStacksSnapshot(null);
    setPinLookupError(null);
    setTemplateMillsError(null);
    setShowTaxDistrictLevyLinkHelp(false);
    setShowLevyTableExampleHelp(false);
  }

  function applyTemplateMills() {
    setTemplateMillsError(null);
    const errs: string[] = [];
    const next = lines.map((l) => {
      const raw = templateMillDrafts[l.id] ?? "";
      const m = parseMills(raw);
      if (m === null) {
        errs.push(displayAuthority(l.authority));
        return l;
      }
      return { ...l, mills: m };
    });
    if (errs.length > 0) {
      setTemplateMillsError(
        `Enter a valid levy in mills for: ${errs.slice(0, 4).join(", ")}${errs.length > 4 ? ", …" : ""}.`,
      );
      return;
    }
    const total = next.reduce((a, l) => a + l.mills, 0);
    if (total <= 0) {
      setTemplateMillsError(
        "Enter at least one non-zero mill levy so the stack total is greater than zero.",
      );
      return;
    }
    setLines(next);
    setAwaitingTemplateMills(false);
    setTemplateMillDrafts({});
  }

  function beginEditStackMills() {
    if (!loadedParcelMeta || lines.length === 0) return;
    setTemplateMillsError(null);
    setDetailLineId(null);
    setTileActionsId(null);
    setTemplateMillDrafts(
      Object.fromEntries(
        lines.map((l) => [l.id, formatMills(l.mills)] as const),
      ),
    );
    setAwaitingTemplateMills(true);
  }

  return (
    <div className="space-y-5">
      <p className="text-base leading-relaxed text-slate-800 sm:text-lg">
        Use your parcel PIN from Step 1 and click <strong>Load stack</strong> to
        load your tax info. Your split appears as tiles right away when we have
        mill rates from the bundled data; use <strong>Edit stack</strong> to
        adjust numbers.
      </p>

      {useSampleData && (
        <ExampleModeCallout variant="banner">
          <strong className="font-semibold text-amber-950">Example only</strong>
          {" "}
          (not your property). Turn off the sample switch below to use your own lines.
        </ExampleModeCallout>
      )}

      {!useSampleData && (
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
            <div
              role="group"
              aria-label="Load tax info from your parcel PIN, or use the fallback if you cannot find your PIN"
              className="flex w-full gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-inset ring-slate-200/80"
            >
              <button
                type="button"
                aria-pressed={usePinEntryPath}
                className={
                  usePinEntryPath
                    ? LEVY_ENTRY_SEGMENT_ACTIVE
                    : LEVY_ENTRY_SEGMENT_IDLE
                }
                onClick={() => setUsePinEntryPath(true)}
              >
                Load from my PIN
              </button>
              <button
                type="button"
                aria-pressed={!usePinEntryPath}
                className={
                  !usePinEntryPath
                    ? LEVY_ENTRY_SEGMENT_ACTIVE
                    : LEVY_ENTRY_SEGMENT_IDLE
                }
                onClick={() => setUsePinEntryPath(false)}
              >
                Can&apos;t find my PIN
              </button>
            </div>
          </div>

          {(usePinEntryPath || awaitingTemplateMills) && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <p className="mb-3 text-sm text-slate-600 sm:text-base">
                Paste your PIN, then <strong>Load stack</strong> to see your split
                as tiles. Use <strong>Edit stack</strong> to change mills.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                <div className="min-w-0 w-full sm:flex-1">
                  <label
                    htmlFor="levy-parcel-pin"
                    className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm"
                  >
                    Parcel PIN
                  </label>
                  <input
                    id="levy-parcel-pin"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className={INPUT_FULL}
                    placeholder="e.g. 032490811 or 03-249-08-11"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    disabled={pinLookupBusy}
                  />
                </div>
                <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:gap-2">
                  <button
                    type="button"
                    className={`${btnOutlinePrimaryMd} w-full justify-center py-3 sm:w-auto sm:whitespace-nowrap`}
                    disabled={pinLookupBusy}
                    onClick={() => void loadStackFromParcelPin()}
                  >
                    {pinLookupBusy ? "Loading…" : "Load stack"}
                  </button>
                  {showTiles && loadedParcelMeta ? (
                    <button
                      type="button"
                      className={`${btnOutlineSecondaryMd} w-full justify-center py-3 sm:w-auto sm:whitespace-nowrap`}
                      onClick={beginEditStackMills}
                    >
                      Edit stack
                    </button>
                  ) : null}
                </div>
              </div>
              {pinLookupError && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {pinLookupError}
                </p>
              )}
              {loadedParcelMeta && (
                <p className="mt-2 text-xs text-slate-600">
                  Matched PIN {loadedParcelMeta.pin} · taxing authority{" "}
                  {formatTaxAreaShortDescrDisplay(loadedParcelMeta.tagShortDescr)} ·{" "}
                  {safeLevyTableHref ? (
                    <a
                      href={safeLevyTableHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-700 underline decoration-indigo-400/70 underline-offset-2 hover:text-indigo-900"
                    >
                      Open county levy table
                    </a>
                  ) : (
                    <span className="text-slate-600">Open county levy table</span>
                  )}
                </p>
              )}
            </div>
          )}

          {!usePinEntryPath && !awaitingTemplateMills && (
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
                <p className="text-base text-slate-800 sm:text-lg">
                  On your property page, click the link that says{" "}
                  <strong>Tax District Levies</strong>.
                </p>
                <div className="mt-3 space-y-3">
                  <HelpPillButton
                    onClick={() =>
                      setShowTaxDistrictLevyLinkHelp((prev) => !prev)
                    }
                    aria-expanded={showTaxDistrictLevyLinkHelp}
                  >
                    {showTaxDistrictLevyLinkHelp ? "Hide" : "Show"} where to find
                    it
                  </HelpPillButton>
                  {showTaxDistrictLevyLinkHelp && (
                    <div className="rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
                      <figure>
                        <a
                          href={parcelRecordLevyImg.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Image
                            src={parcelRecordLevyImg}
                            alt="County property page with the Tax District Levies link marked."
                            className="w-full rounded border border-slate-400"
                            width={800}
                            height={500}
                          />
                        </a>
                        <figcaption className="mt-1 text-sm text-slate-500 sm:text-base">
                          Tap image to open full size.
                        </figcaption>
                      </figure>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-base text-slate-800 sm:text-lg">
                  That screen lists each taxing district and its levy, with a total
                  at the bottom—what you can copy into the form below.
                </p>
                <div className="mt-3 space-y-3">
                  <HelpPillButton
                    onClick={() =>
                      setShowLevyTableExampleHelp((prev) => !prev)
                    }
                    aria-expanded={showLevyTableExampleHelp}
                  >
                    {showLevyTableExampleHelp ? "Hide" : "Show"} example
                  </HelpPillButton>
                  {showLevyTableExampleHelp && (
                    <div className="rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
                      <figure>
                        <a
                          href={levyStackExampleImg.src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Image
                            src={levyStackExampleImg}
                            alt="Example county tax levies list: districts and rates with a total at the bottom."
                            className="w-full rounded border border-slate-400"
                            width={800}
                            height={500}
                          />
                        </a>
                        <figcaption className="mt-1 text-sm text-slate-500 sm:text-base">
                          Tap image to open full size.
                        </figcaption>
                      </figure>
                    </div>
                  )}
                </div>
              </div>
              <form
                className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  commitDraft();
                }}
              >
                <p className="mb-3 text-sm text-slate-600">
                  Last resort: type each line from that{" "}
                  <strong>Tax District Levies</strong> screen.
                </p>
                <fieldset className="min-w-0 space-y-3">
                  <legend className="sr-only">Add one levy line</legend>
                  <div>
                  <label
                    htmlFor="levy-draft-authority"
                    className="mb-1 block text-sm font-medium text-slate-800"
                  >
                    Taxing authority
                  </label>
                  <input
                    id="levy-draft-authority"
                    type="text"
                    autoComplete="off"
                    className={INPUT_FULL}
                    placeholder="e.g. Littleton School Dist # 6"
                    value={draft.authority}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, authority: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="levy-draft-mills"
                    className="mb-1 block text-sm font-medium text-slate-800"
                  >
                    Levy (mills)
                  </label>
                  <input
                    id="levy-draft-mills"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    className={INPUT_FULL}
                    placeholder="00.000"
                    value={draft.levy}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, levy: e.target.value }))
                    }
                    aria-invalid={addError != null}
                  />
                  {addError && (
                    <p className="mt-1 text-sm text-red-700" role="alert">
                      {addError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className={`${btnOutlinePrimaryMd} w-full justify-center py-3 text-base`}
                >
                  Add to stack
                </button>
                {lines.length > 0 && (
                  <p className="text-center text-sm text-slate-600">
                    {lines.length} line{lines.length === 1 ? "" : "s"} in your stack
                  </p>
                )}
              </fieldset>
              </form>
            </div>
          )}
        </div>
      )}

      {showTiles && (
        <div className="overflow-hidden rounded-2xl border border-indigo-200/90 bg-gradient-to-b from-indigo-50/90 to-slate-100/80 shadow-sm">
          <div className="border-b border-indigo-200/80 px-3 py-3 sm:px-5 sm:py-4">
            <p className="text-base font-semibold text-indigo-950 sm:text-lg">
              How your tax is split
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Tap a tile for share and, when we can match a row in the bundled
              Colorado district data (state GIS plus metro, fire, and water /
              sanitation exports), official website and mailing address when
              available.
            </p>
          </div>

          <div className="p-2 sm:p-3">
            <div className={LEVY_TILES_GRID_CLASS}>
              {tilesSorted.map((item, index) => {
                const grad = TILE_GRADIENTS[index % TILE_GRADIENTS.length];
                const pctLabel = formatPct(item.pct);
                const pctScale = pctScaleForRank(index, tilesSorted.length);
                const isEditing = editingId === item.id;
                const sourceLine = lines.find((l) => l.id === item.id);

                return (
                  <div
                    key={item.id}
                    className={`min-w-0 ${levyTileClass(index, isEditing)} ${
                      !isEditing ? grad : ""
                    }`}
                  >
                    {isEditing && sourceLine ? (
                      <div className="flex min-h-0 flex-1 flex-col gap-3">
                        <div>
                          <label
                            htmlFor={`edit-auth-${item.id}`}
                            className="mb-1 block text-xs font-medium text-slate-800"
                          >
                            Taxing authority
                          </label>
                          <input
                            id={`edit-auth-${item.id}`}
                            type="text"
                            autoComplete="off"
                            className={INPUT_FULL}
                            value={editDraft.authority}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                authority: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`edit-levy-${item.id}`}
                            className="mb-1 block text-xs font-medium text-slate-800"
                          >
                            Levy (mills)
                          </label>
                          <input
                            id={`edit-levy-${item.id}`}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            className={INPUT_FULL}
                            value={editDraft.levy}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                levy: e.target.value,
                              }))
                            }
                            aria-invalid={editError != null}
                          />
                          {editError && (
                            <p className="mt-1 text-xs text-red-700" role="alert">
                              {editError}
                            </p>
                          )}
                        </div>
                        <div className="mt-auto flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={`${btnOutlinePrimaryMd} flex-1 px-3 py-2 text-sm sm:flex-none`}
                            onClick={saveEdit}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className={`${btnOutlineSecondaryMd} flex-1 px-3 py-2 text-sm sm:flex-none`}
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={`${btnOutlineSecondaryMd} w-full border-red-300 text-red-900 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50 sm:w-auto`}
                            disabled={useSampleData}
                            onClick={() => removeLine(item.id)}
                          >
                            Delete line
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="absolute inset-0 z-0 cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                          aria-label={`View district details for ${item.authority}, ${formatMills(item.mills)} mills`}
                          onClick={() => {
                            setTileActionsId(null);
                            setDetailLineId(item.id);
                          }}
                        />
                        <div className="pointer-events-none relative z-[1] flex h-full min-h-0 flex-1 flex-col">
                          <div className="pointer-events-auto relative z-20 shrink-0 self-end">
                            <button
                              type="button"
                              className={TILE_OVERFLOW_BTN_CLASS}
                              aria-label={`More options for ${item.authority}`}
                              aria-haspopup="dialog"
                              aria-expanded={tileActionsId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailLineId(null);
                                setTileActionsId((cur) =>
                                  cur === item.id ? null : item.id,
                                );
                              }}
                            >
                              <EllipsisVerticalIcon className="h-7 w-7" />
                            </button>
                          </div>
                          <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto]">
                            <div className="min-h-0 self-start pr-11">
                              <p
                                className={`w-full min-w-0 font-semibold leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] ${TILE_DESC_MILLS_CLASS} line-clamp-6`}
                              >
                                {item.authority}
                              </p>
                              <p
                                className={`mt-2 font-mono font-semibold tabular-nums text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)] ${TILE_DESC_MILLS_CLASS}`}
                              >
                                {formatMills(item.mills)} mills
                              </p>
                            </div>
                            <p
                              className={LEVY_TILE_PCT_CLASS}
                              style={
                                {
                                  "--pct-scale": pctScale,
                                } as React.CSSProperties
                              }
                            >
                              {pctLabel}%
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              role="region"
              aria-label="Total mill levy for your stack"
              className="mt-2 flex min-h-[96px] w-full flex-col justify-center gap-2 rounded-2xl border-2 border-amber-400/85 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 px-3 py-4 text-white ring-1 ring-white/15 sm:mt-3 sm:min-h-[88px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
            >
              <span className="text-3xl font-bold tracking-tight text-amber-100 sm:text-4xl">
                Total
              </span>
              <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-xl font-semibold tabular-nums text-white sm:text-2xl">
                  {formatMills(sumMills)} mills
                </span>
                <span className="text-xl font-semibold tabular-nums text-amber-200 sm:text-2xl">
                  100.0%
                </span>
              </span>
            </div>
            </div>

          <div className="border-t border-indigo-200/70 bg-white/60 px-3 py-3 sm:px-5">
            <HelpPillButton
              onClick={() => setShowLevyDetails((v) => !v)}
              aria-expanded={showLevyDetails}
            >
              {showLevyDetails ? "Hide table" : "Show table"}
            </HelpPillButton>
          </div>

          {showLevyDetails && (
            <div className="border-t border-slate-300 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[20rem] border-collapse text-left text-sm text-slate-900">
                  <thead>
                    <tr className="border-b border-slate-400 bg-slate-100">
                      <th
                        scope="col"
                        className="px-3 py-2.5 font-semibold sm:px-4"
                      >
                        Taxing authority
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-right font-semibold sm:px-4"
                      >
                        Mills
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2.5 text-right font-semibold sm:px-4"
                      >
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tilesSorted.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-200 odd:bg-white even:bg-slate-50/80"
                      >
                        <td className="max-w-[min(100%,28rem)] px-3 py-2 align-top sm:px-4">
                          {item.authority}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums text-slate-800 sm:px-4">
                          {formatMills(item.mills)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-800 sm:px-4">
                          {formatPct(item.pct)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-500 bg-slate-100 font-semibold">
                      <td className="px-3 py-2.5 sm:px-4">Total</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums sm:px-4">
                        {formatMills(sumMills)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums sm:px-4">
                        100.0%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!useSampleData && awaitingTemplateMills && lines.length > 0 && (
        <div className="rounded-lg border-2 border-indigo-300/80 bg-indigo-50/50 p-3 sm:p-4">
          <p className="text-sm font-semibold text-indigo-950 sm:text-base">
            Enter{" "}
            <a
              href={`#${MILLS_DEFINITION_ELEMENT_ID}`}
              className="underline decoration-indigo-400/70 underline-offset-2 hover:text-indigo-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              title="What are mills? (below in this step)"
            >
              mills
            </a>{" "}
            for each line
          </p>
          {loadedParcelMeta && (
            <div className="mt-1 space-y-2 text-sm leading-relaxed text-slate-700">
              <p>
                PIN {loadedParcelMeta.pin} · taxing authority{" "}
                {formatTaxAreaShortDescrDisplay(loadedParcelMeta.tagShortDescr)}.
              </p>
              <p>
                Where we could match a line, we filled in mills from state data.
                Change any number that looks wrong. If a row is still empty, copy
                mills from the county{" "}
                {safeLevyTableHref ? (
                  <a
                    href={safeLevyTableHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-800 underline decoration-indigo-400/70 underline-offset-2"
                  >
                    levy table
                  </a>
                ) : (
                  <span className="font-medium text-slate-800">levy table</span>
                )}{" "}
                or from your tax notice.
              </p>
            </div>
          )}
          <ul className="mt-3 space-y-2">
            {lines.map((l) => (
              <li
                key={l.id}
                className="flex flex-col gap-1 rounded-md border border-slate-200 bg-white p-2 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="min-w-0 flex-1 text-sm text-slate-900">
                  {l.levyLineCode && (
                    <span className="mr-2 font-mono text-xs text-slate-500">
                      {l.levyLineCode}
                    </span>
                  )}
                  <span>{displayAuthority(l.authority)}</span>
                  {l.levyLineCode === "ASSRFEES" && (
                    <span className="ml-1.5 text-xs font-normal text-slate-500">
                      (assessor fee, not a district)
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-2 sm:w-40">
                  <label className="sr-only" htmlFor={`tmills-${l.id}`}>
                    Mills for {displayAuthority(l.authority)}
                  </label>
                  <input
                    id={`tmills-${l.id}`}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    className={`${INPUT_CLASS} w-full min-w-0 font-mono tabular-nums`}
                    placeholder="00.000"
                    value={templateMillDrafts[l.id] ?? ""}
                    onChange={(e) => {
                      setTemplateMillsError(null);
                      setTemplateMillDrafts((d) => ({
                        ...d,
                        [l.id]: e.target.value,
                      }));
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {templateMillsError && (
            <p
              className="mt-3 text-sm text-red-700"
              role="alert"
              id="levy-template-mills-error"
            >
              {templateMillsError}
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={`${btnOutlinePrimaryMd} w-full justify-center py-3 sm:flex-1`}
              onClick={applyTemplateMills}
              aria-describedby={
                templateMillsError ? "levy-template-mills-error" : undefined
              }
            >
              Apply mills &amp; update breakdown
            </button>
            <button
              type="button"
              className={`${btnOutlineSecondaryMd} w-full justify-center py-3 sm:flex-1`}
              onClick={clearParcelTemplate}
            >
              Clear loaded stack
            </button>
          </div>
        </div>
      )}

      {detailContext && (
        <LevyLineDistrictDetailDialog
          authorityLabel={detailContext.authority}
          millsLabel={formatMills(detailContext.line.mills)}
          pctLabel={formatPct(detailContext.pct)}
          match={detailContext.match}
          dolaMatch={detailContext.dolaMatch}
          directoryLoading={specialDistrictLoading && !specialDistrictFile}
          directoryError={specialDistrictError}
          snapshot={specialDistrictFile?.snapshot ?? null}
          arapahoeSnapshot={arapahoeStacksSnapshot}
          useSampleData={useSampleData}
          onClose={() => setDetailLineId(null)}
        />
      )}

      {tileActionsId && actionLine && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close menu"
            onClick={() => setTileActionsId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tile-actions-heading"
            className="relative z-10 w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:rounded-2xl"
          >
            <h3
              id="tile-actions-heading"
              className="pr-2 text-base font-semibold leading-snug text-slate-900"
            >
              {displayAuthority(actionLine.authority)}
            </h3>
            <p className="mt-1 font-mono text-sm tabular-nums text-slate-600">
              {formatMills(actionLine.mills)} mills
            </p>
            {useSampleData && (
              <ExampleModeCallout variant="compact" as="p" className="mt-3">
                Example data: turn off the sample switch below to edit or remove
                lines.
              </ExampleModeCallout>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className={`${btnOutlinePrimaryMd} w-full justify-center py-3 disabled:pointer-events-none disabled:opacity-50`}
                disabled={useSampleData}
                onClick={() => beginEdit(actionLine)}
              >
                Edit line
              </button>
              <button
                type="button"
                className="w-full rounded-md border border-red-300 bg-white py-3 text-base font-medium text-red-900 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/40 disabled:pointer-events-none disabled:opacity-50"
                disabled={useSampleData}
                onClick={() => removeLine(actionLine.id)}
              >
                Remove line
              </button>
              <button
                type="button"
                className={`${btnOutlineSecondaryMd} w-full justify-center py-3`}
                onClick={() => setTileActionsId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2.5">
          <input
            id="levy-sample-toggle"
            type="checkbox"
            className="h-5 w-5 shrink-0 rounded border-slate-400 text-indigo-950 focus:ring-2 focus:ring-indigo-700 focus:ring-offset-1"
            checked={useSampleData}
            onChange={(e) => setSampleEnabled(e.target.checked)}
          />
          <label
            htmlFor="levy-sample-toggle"
            className="cursor-pointer text-sm font-medium leading-none text-slate-900 sm:whitespace-nowrap sm:text-base"
          >
            Show me how this works with sample data
          </label>
        </div>
        <p className="text-xs leading-snug text-slate-600 sm:ml-7 sm:text-sm">
          Uncheck to go back to your numbers.
        </p>
      </div>

      <div className="mt-6">
        <MillsDefinitionInfoDetails />
      </div>
    </div>
  );
}
