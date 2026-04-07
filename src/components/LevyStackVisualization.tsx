"use client";

import {
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SpecialDistrictDirectoryFile } from "@/lib/specialDistrictMatch";
import { btnOutlinePrimaryMd, btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { LevyLineDistrictDetailDialog } from "@/components/LevyLineDistrictDetailDialog";
import { ModalPortal } from "@/components/ModalPortal";
import { ToolOutlinedToggleButton } from "@/components/ToolOutlinedToggleButton";
import {
  DASHBOARD_TILE_RADIUS_CLASS,
  INPUT_CLASS,
  LEVY_STACK_TILE_GRID_CLASS,
  TERM_LINK_CLASS,
  TOOL_DISCLOSURE_ROW_ALIGN_CLASS,
} from "@/lib/toolFlowStyles";
import {
  ARAPAHOE_COUNTY_GEOID,
  matchSpecialDistrict,
  mergeDistrictDirectoryLayers,
} from "@/lib/specialDistrictMatch";
import { formatTaxAreaShortDescrDisplay } from "@/lib/arapahoeParcelLevyData";
import { formatCountyLevyMillsDisplay as formatMills } from "@/lib/formatCountyLevyMills";
import { safeArapahoeLevyAspxUrl } from "@/lib/safeExternalHref";
import {
  applyParcelTemplateMills,
  displayAuthorityForLevyLine,
  newLevyLineId,
  type CommittedLevyLine,
  parseMills,
} from "@/lib/committedLevyLine";

const INPUT_FULL = `${INPUT_CLASS} w-full min-w-0 max-w-none`;

const ADD_TILE_GHOST_CLASS =
  `relative flex min-h-[152px] min-w-0 flex-col justify-center gap-2 ${DASHBOARD_TILE_RADIUS_CLASS} border-2 border-dashed border-slate-300 bg-slate-50/90 p-4 text-center shadow-sm transition-colors hover:border-indigo-400/80 hover:bg-indigo-50/40 sm:min-h-[168px] sm:p-5`;
const ADD_TILE_FORM_CLASS =
  `relative flex min-h-[152px] min-w-0 flex-col gap-3 ${DASHBOARD_TILE_RADIUS_CLASS} border-2 border-indigo-400 bg-white p-3 shadow-lg ring-2 ring-indigo-300/80 sm:min-h-[168px] sm:p-4`;

function levyTileClass(index: number, isEditing: boolean): string {
  const base =
    `relative flex min-h-0 h-full flex-col gap-2 overflow-hidden ${DASHBOARD_TILE_RADIUS_CLASS} border border-white/20 shadow-md sm:gap-3`;
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
  "absolute right-2 top-2 z-20 flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-bl-lg rounded-tr-xl bg-transparent text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60";

const LEVY_TILE_PCT_CLASS =
  "pointer-events-none shrink-0 m-0 text-right font-bold tabular-nums leading-none text-white [letter-spacing:-0.025rem] [text-shadow:0_1px_3px_rgba(0,0,0,0.3)] [font-size:calc(1.25rem+var(--pct-scale)*1.5rem)] sm:[font-size:calc(1.5rem+var(--pct-scale)*1.25rem)]";

const TILE_DESC_MILLS_CLASS = "text-base sm:text-lg";

function formatPct(p: number): string {
  if (!Number.isFinite(p)) return "0.0";
  if (p >= 10) return p.toFixed(1);
  if (p >= 1) return p.toFixed(1);
  return p.toFixed(2);
}

function pctScaleForRank(tileIndex: number, tileCount: number): number {
  if (tileCount <= 1) return 1;
  return 1 - tileIndex / (tileCount - 1);
}

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

export type LevyStackVisualizationProps = {
  lines: CommittedLevyLine[];
  setLines: React.Dispatch<React.SetStateAction<CommittedLevyLine[]>>;
  loadedParcelMeta: {
    pin: string;
    tagShortDescr: string;
    levyAspxUrl: string;
  } | null;
  awaitingTemplateMills: boolean;
  setAwaitingTemplateMills: (v: boolean) => void;
  templateMillDrafts: Record<string, string>;
  setTemplateMillDrafts: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  templateMillsError: string | null;
  setTemplateMillsError: (e: string | null) => void;
  onClearLoadedStack: () => void;
  allowLineEdit: boolean;
  /**
   * When true, levy line detail and term links scroll to `/#term-*` on the home page
   * (Definitions on `/` after a successful PIN load); otherwise `/sources#term-*`.
   */
  termDefinitionsOnHomePage?: boolean;
};

export function LevyStackVisualization({
  lines,
  setLines,
  loadedParcelMeta,
  awaitingTemplateMills,
  setAwaitingTemplateMills,
  templateMillDrafts,
  setTemplateMillDrafts,
  templateMillsError,
  setTemplateMillsError,
  onClearLoadedStack,
  allowLineEdit,
  termDefinitionsOnHomePage = false,
}: LevyStackVisualizationProps) {
  const templateErrorId = useId();
  const [showLevyDetails, setShowLevyDetails] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ authority: "", levy: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [tileActionsId, setTileActionsId] = useState<string | null>(null);
  const [detailLineId, setDetailLineId] = useState<string | null>(null);
  const [addTileOpen, setAddTileOpen] = useState(false);
  const [addDraft, setAddDraft] = useState({ authority: "", levy: "" });
  const [addError, setAddError] = useState<string | null>(null);
  const specialDistrictFetchStartedRef = useRef(false);
  const [specialDistrictFile, setSpecialDistrictFile] =
    useState<SpecialDistrictDirectoryFile | null>(null);
  const [specialDistrictLoading, setSpecialDistrictLoading] = useState(false);
  const [specialDistrictError, setSpecialDistrictError] = useState<
    string | null
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
        authority: displayAuthorityForLevyLine(l.authority),
        mills: l.mills,
      })),
    [lines],
  );

  const showResults = lines.length > 0 && sumMills > 0;
  /** Grid + totals: show when not filling template mills and either there are lines or user may add lines. */
  const showLevyGrid =
    !awaitingTemplateMills && (lines.length > 0 || allowLineEdit);

  const millsTermHref = termDefinitionsOnHomePage ? "#term-mills" : "/sources#term-mills";
  const levyTermHref = termDefinitionsOnHomePage ? "#term-levy" : "/sources#term-levy";
  const pinTermHref = termDefinitionsOnHomePage ? "#term-pin" : "/sources#term-pin";

  function goToTermFromTileMenu(id: "term-mills" | "term-levy") {
    setTileActionsId(null);
    window.setTimeout(() => {
      if (termDefinitionsOnHomePage) {
        window.history.replaceState(null, "", `/#${id}`);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.assign(`/sources#${id}`);
      }
    }, 0);
  }

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
    if (lineItems.length === 0) return [];
    if (sumMills <= 0) {
      return lineItems
        .map((item) => ({
          ...item,
          pct: lineItems.length === 1 ? 100 : 0,
        }))
        .sort((a, b) => b.mills - a.mills || a.authority.localeCompare(b.authority));
    }
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
    if (!line) return null;
    const pct =
      sumMills > 0
        ? (line.mills / sumMills) * 100
        : lines.length === 1
          ? 100
          : 0;
    const match =
      specialDistrictFile != null
        ? matchSpecialDistrict(line.authority, specialDistrictFile.districts, {
            countyGeoid: ARAPAHOE_COUNTY_GEOID,
            preferredLgId: line.dolaMatch?.lgId ?? null,
          })
        : null;
    return {
      line,
      authority: displayAuthorityForLevyLine(line.authority),
      pct,
      match,
      dolaMatch: line.dolaMatch ?? null,
    };
  }, [detailLineId, lines, sumMills, specialDistrictFile]);

  const modalOpen = tileActionsId != null || detailLineId != null;

  useEffect(() => {
    if (!modalOpen && !addTileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setTileActionsId(null);
      setDetailLineId(null);
      setAddTileOpen(false);
      setAddDraft({ authority: "", levy: "" });
      setAddError(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, addTileOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
    setTileActionsId((cur) => (cur === id ? null : cur));
    setDetailLineId((cur) => (cur === id ? null : cur));
    if (editingId === id) {
      setEditingId(null);
      setEditError(null);
    }
  }

  function cancelAddTile() {
    setAddTileOpen(false);
    setAddDraft({ authority: "", levy: "" });
    setAddError(null);
  }

  function commitAddLine() {
    setAddError(null);
    const m = parseMills(addDraft.levy);
    if (m === null) {
      setAddError("Enter a valid levy in mills (0 or greater).");
      return;
    }
    const trimmed = addDraft.authority.trim();
    if (!trimmed) {
      setAddError("Enter a taxing authority name.");
      return;
    }
    const newLine: CommittedLevyLine = {
      id: newLevyLineId(),
      authority: trimmed,
      mills: m,
    };
    setLines((prev) => [...prev, newLine]);
    cancelAddTile();
  }

  function beginEdit(line: CommittedLevyLine) {
    setTileActionsId(null);
    setDetailLineId(null);
    cancelAddTile();
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
    setEditingId(null);
    setEditError(null);
  }

  function applyTemplateMills() {
    setTemplateMillsError(null);
    const result = applyParcelTemplateMills(lines, templateMillDrafts);
    if (!result.ok) {
      setTemplateMillsError(result.error);
      return;
    }
    setLines(result.lines);
    setAwaitingTemplateMills(false);
    setTemplateMillDrafts({});
  }

  return (
    <div className="space-y-5">
      {showLevyGrid && (
        <div className="space-y-3 sm:space-y-4">
            <div className={LEVY_STACK_TILE_GRID_CLASS}>
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
                            disabled={!allowLineEdit}
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
                          className={`absolute inset-0 z-0 cursor-pointer ${DASHBOARD_TILE_RADIUS_CLASS} focus:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
                          aria-label={`View district details for ${item.authority}, ${formatMills(item.mills)} mills`}
                          onClick={() => {
                            setTileActionsId(null);
                            cancelAddTile();
                            setDetailLineId(item.id);
                          }}
                        />
                        {allowLineEdit ? (
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
                        ) : null}
                        <div className="pointer-events-none relative z-[1] flex h-full min-h-0 flex-1 flex-col">
                          <div
                            className={
                              allowLineEdit
                                ? "grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-y-2 sm:gap-y-3"
                                : "grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-y-2 sm:gap-y-3 pt-0"
                            }
                          >
                            <div className="min-h-0 w-full min-w-0 self-start">
                              <p
                                className={`w-full min-w-0 font-semibold leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] ${TILE_DESC_MILLS_CLASS} line-clamp-6${allowLineEdit ? " pr-11" : ""}`}
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
                                } as CSSProperties
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
              {allowLineEdit ? (
                addTileOpen ? (
                  <div className={ADD_TILE_FORM_CLASS}>
                    <p className="text-xs font-medium text-slate-700 sm:text-sm">
                      Add one line from your county{" "}
                      <strong className="font-semibold text-slate-900">
                        Tax District Levies
                      </strong>{" "}
                      screen (or your tax notice).
                    </p>
                    <form
                      className="flex min-h-0 flex-1 flex-col gap-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        commitAddLine();
                      }}
                    >
                      <div className="min-h-0 flex-1 space-y-3">
                        <div>
                          <label
                            htmlFor="levy-add-authority"
                            className="mb-1 block text-xs font-medium text-slate-800"
                          >
                            Taxing authority
                          </label>
                          <input
                            id="levy-add-authority"
                            type="text"
                            autoComplete="off"
                            className={INPUT_FULL}
                            placeholder="e.g. Littleton School Dist # 6"
                            value={addDraft.authority}
                            onChange={(e) =>
                              setAddDraft((d) => ({
                                ...d,
                                authority: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="levy-add-mills"
                            className="mb-1 block text-xs font-medium text-slate-800"
                          >
                            Levy (mills)
                          </label>
                          <input
                            id="levy-add-mills"
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            className={INPUT_FULL}
                            placeholder="00.000"
                            value={addDraft.levy}
                            onChange={(e) =>
                              setAddDraft((d) => ({
                                ...d,
                                levy: e.target.value,
                              }))
                            }
                            aria-invalid={addError != null}
                          />
                          {addError && (
                            <p className="mt-1 text-xs text-red-700" role="alert">
                              {addError}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2">
                        <button
                          type="submit"
                          className={`${btnOutlinePrimaryMd} flex-1 px-3 py-2 text-sm sm:flex-none`}
                        >
                          Add to stack
                        </button>
                        <button
                          type="button"
                          className={`${btnOutlineSecondaryMd} flex-1 px-3 py-2 text-sm sm:flex-none`}
                          onClick={cancelAddTile}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={ADD_TILE_GHOST_CLASS}
                    aria-label="Add a levy line from your county levy table"
                    onClick={() => {
                      setAddError(null);
                      setAddTileOpen(true);
                    }}
                  >
                    <span
                      className="text-2xl font-light leading-none text-indigo-600"
                      aria-hidden
                    >
                      +
                    </span>
                    <span className="text-sm font-semibold text-slate-800 sm:text-base">
                      Add tile
                    </span>
                    <span className="text-xs leading-snug text-slate-600 sm:text-sm">
                      Copy a row from Tax District Levies
                    </span>
                  </button>
                )
              ) : null}
            </div>

            <p className="text-sm text-slate-600">
              Tap a tile to see its share of your total mills and extra details
              when we can match it to public district records.
              {allowLineEdit ? (
                <>
                  {" "}
                  Use <strong className="font-semibold text-slate-800">Add tile</strong>{" "}
                  to add another row from your county{" "}
                  <strong className="font-semibold text-slate-800">
                    Tax District Levies
                  </strong>{" "}
                  list.
                </>
              ) : null}
            </p>

            <div
              role="region"
              aria-label="Total mill levy for your stack"
              className={`flex min-h-[96px] w-full flex-col justify-center gap-2 ${DASHBOARD_TILE_RADIUS_CLASS} border-2 border-amber-400/85 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 px-3 py-4 text-white ring-1 ring-white/15 sm:min-h-[88px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5`}
            >
              <span className="text-3xl font-bold tracking-tight text-amber-100 sm:text-4xl">
                Total
              </span>
              <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-xl font-semibold tabular-nums text-white sm:text-2xl">
                  {formatMills(sumMills)} mills
                </span>
                <span className="text-xl font-semibold tabular-nums text-amber-200 sm:text-2xl">
                  {sumMills > 0 ? "100.0%" : lines.length > 0 ? "—" : "100.0%"}
                </span>
              </span>
            </div>

          {tilesSorted.length > 0 ? (
          <div className={TOOL_DISCLOSURE_ROW_ALIGN_CLASS}>
            <ToolOutlinedToggleButton
              aria-expanded={showLevyDetails}
              onClick={() => setShowLevyDetails((v) => !v)}
            >
              {showLevyDetails
                ? "Hide table"
                : "See data in table form"}
            </ToolOutlinedToggleButton>
          </div>
          ) : null}

          {showLevyDetails && tilesSorted.length > 0 ? (
            <div className="border-t border-slate-200">
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
                        {sumMills > 0 ? "100.0%" : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {loadedParcelMeta && lines.length > 0 ? (
        <p className="rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2.5 text-xs leading-snug text-slate-600 shadow-sm sm:px-4 sm:text-sm">
          <span className="sr-only">Parcel match. </span>
          Matched{" "}
          <a
            id="pin-term-first"
            href={pinTermHref}
            className={TERM_LINK_CLASS}
          >
            PIN
          </a>{" "}
          <span className="font-mono font-semibold tabular-nums text-slate-800">
            {loadedParcelMeta.pin}
          </span>
          {" · "}
          Taxing authority{" "}
          <span className="font-medium text-slate-700">
            {formatTaxAreaShortDescrDisplay(loadedParcelMeta.tagShortDescr)}
          </span>
          {" · "}
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
      ) : null}

      {awaitingTemplateMills && lines.length > 0 && (
        <div className="rounded-lg border-2 border-indigo-300/80 bg-indigo-50/50 p-3 sm:p-4">
          <p className="text-sm font-semibold text-indigo-950 sm:text-base">
            Enter{" "}
            <a
              href={millsTermHref}
              className="underline decoration-indigo-400/70 underline-offset-2 hover:text-indigo-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              mills
            </a>{" "}
            for each line
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Each row is one{" "}
            <a
              href={levyTermHref}
              className="font-medium text-indigo-950 underline decoration-indigo-400/70 underline-offset-2 hover:text-indigo-900"
            >
              levy
            </a>
            {" "}
            (one district line on your bill).
          </p>
          {loadedParcelMeta && (
            <div className="mt-1 space-y-2 text-sm leading-relaxed text-slate-700">
              <p>
                <a href={pinTermHref} className={TERM_LINK_CLASS}>
                  PIN
                </a>{" "}
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {loadedParcelMeta.pin}
                </span>
                {" · "}
                Taxing authority{" "}
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
                  <span>{displayAuthorityForLevyLine(l.authority)}</span>
                  {l.levyLineCode === "ASSRFEES" && (
                    <span className="ml-1.5 text-xs font-normal text-slate-500">
                      (assessor fee, not a district)
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-2 sm:w-40">
                  <label className="sr-only" htmlFor={`tmills-${l.id}`}>
                    Mills for {displayAuthorityForLevyLine(l.authority)}
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
              id={templateErrorId}
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
                templateMillsError ? templateErrorId : undefined
              }
            >
              Apply mills &amp; update breakdown
            </button>
            <button
              type="button"
              className={`${btnOutlineSecondaryMd} w-full justify-center py-3 sm:flex-1`}
              onClick={onClearLoadedStack}
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
          termDefinitionsOnHomePage={termDefinitionsOnHomePage}
          onClose={() => setDetailLineId(null)}
        />
      )}

      {allowLineEdit && tileActionsId && actionLine && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex min-h-[100dvh] w-full items-end justify-center sm:items-center sm:p-4">
            <button
              type="button"
              className="absolute inset-0 min-h-[100dvh] bg-black/45"
              aria-label="Close menu"
              onClick={() => setTileActionsId(null)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="tile-actions-heading"
              className="relative z-10 w-full max-w-lg rounded-t-xl border border-slate-200 bg-white p-4 shadow-2xl sm:rounded-xl"
            >
            <h3
              id="tile-actions-heading"
              className="pr-2 text-base font-semibold leading-snug text-slate-900"
            >
              {displayAuthorityForLevyLine(actionLine.authority)}
            </h3>
            <div className="mt-1 space-y-1.5">
              <p className="font-mono text-sm tabular-nums text-slate-600">
                <span>{formatMills(actionLine.mills)}</span>{" "}
                <button
                  type="button"
                  className={`${TERM_LINK_CLASS} cursor-pointer border-0 bg-transparent p-0 font-sans text-sm`}
                  onClick={() => goToTermFromTileMenu("term-mills")}
                >
                  mills
                </button>
              </p>
              <p className="text-sm text-slate-600">
                One{" "}
                <button
                  type="button"
                  className={`${TERM_LINK_CLASS} cursor-pointer border-0 bg-transparent p-0 text-sm`}
                  onClick={() => goToTermFromTileMenu("term-levy")}
                >
                  levy
                </button>
                {" "}
                line among several on your parcel.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className={`${btnOutlinePrimaryMd} w-full justify-center py-3 disabled:pointer-events-none disabled:opacity-50`}
                disabled={!allowLineEdit}
                onClick={() => beginEdit(actionLine)}
              >
                Edit line
              </button>
              <button
                type="button"
                className="w-full rounded-md border border-red-300 bg-white py-3 text-base font-medium text-red-900 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400/40 disabled:pointer-events-none disabled:opacity-50"
                disabled={!allowLineEdit}
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
        </ModalPortal>
      )}

    </div>
  );
}
