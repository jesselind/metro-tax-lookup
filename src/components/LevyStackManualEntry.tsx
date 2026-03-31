"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { btnOutlinePrimaryMd, btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { ExampleModeCallout } from "@/components/ExampleModeCallout";
import { HelpPillButton } from "@/components/HelpPillButton";
import { getLevyBreakdownDemoLines } from "@/lib/levyBreakdownDemoSeed";
import { INPUT_CLASS } from "@/lib/toolFlowStyles";

const INPUT_FULL =
  `${INPUT_CLASS} w-full min-w-0 max-w-none`;

type CommittedLine = {
  id: string;
  /** Trimmed; may be empty (shown as placeholder label in UI). */
  authority: string;
  mills: number;
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

function formatMills(n: number): string {
  return n.toFixed(3);
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

/** At md+ only: two columns so tile heights differ (masonry-like). Mobile uses a single column. */
const MASONRY_COLUMNS_WIDE = 2;
const MASONRY_MEDIA = "(min-width: 768px)";

function levyTileClass(index: number, isEditing: boolean): string {
  const base =
    "relative flex min-h-0 flex-col gap-2 overflow-hidden rounded-2xl border border-white/20 shadow-md sm:gap-3";
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
  const [wideMasonryLayout, setWideMasonryLayout] = useState(false);
  /** When turning sample on, stash prior user lines so unchecking sample can restore them. */
  const linesBeforeSampleRef = useRef<CommittedLine[] | null>(null);

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

  const tilesSorted = useMemo(() => {
    return lineItems
      .map((item) => ({
        ...item,
        pct: (item.mills / sumMills) * 100,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [lineItems, sumMills]);

  const masonryColumns = useMemo(() => {
    const cols = wideMasonryLayout ? MASONRY_COLUMNS_WIDE : 1;
    return Array.from({ length: cols }, (_, col) =>
      tilesSorted
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => index % cols === col),
    );
  }, [tilesSorted, wideMasonryLayout]);

  useEffect(() => {
    const mq = window.matchMedia(MASONRY_MEDIA);
    const update = () => setWideMasonryLayout(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const actionLine = useMemo(
    () => (tileActionsId ? lines.find((l) => l.id === tileActionsId) : undefined),
    [lines, tileActionsId],
  );

  useEffect(() => {
    if (!tileActionsId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTileActionsId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tileActionsId]);

  useEffect(() => {
    if (!tileActionsId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [tileActionsId]);

  function setSampleEnabled(next: boolean) {
    setAddError(null);
    setEditingId(null);
    setEditError(null);
    setTileActionsId(null);
    setShowLevyDetails(false);
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
    if (editingId === id) {
      setEditingId(null);
      setEditError(null);
    }
  }

  function beginEdit(line: CommittedLine) {
    setTileActionsId(null);
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

  return (
    <div className="space-y-5">
      <p className="text-base leading-relaxed text-slate-800 sm:text-lg">
        From your county <strong>Tax District Levies</strong> page, enter each line:
        district, mills, then <strong>Add to stack</strong>. Optional: use sample data
        below to try the tool first.
      </p>

      <div className="flex flex-col gap-1 border-b border-slate-200 pb-3">
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
          Uncheck to return to your own lines when you had entered any.
        </p>
      </div>

      {useSampleData && (
        <ExampleModeCallout variant="banner">
          <strong className="font-semibold text-amber-950">Example only</strong>
          {" "}
          (not your property). Turn off the switch above to use your own lines.
        </ExampleModeCallout>
      )}

      {!useSampleData && (
        <form
          className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            commitDraft();
          }}
        >
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
                placeholder="0.000"
                value={draft.levy}
                onChange={(e) => setDraft((d) => ({ ...d, levy: e.target.value }))}
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
      )}

      {showResults && (
        <div className="overflow-hidden rounded-2xl border border-indigo-200/90 bg-gradient-to-b from-indigo-50/90 to-slate-100/80 shadow-sm">
          <div className="border-b border-indigo-200/80 px-3 py-3 sm:px-5 sm:py-4">
            <p className="text-base font-semibold text-indigo-950 sm:text-lg">
              How your tax is split
            </p>
          </div>

          <div className="p-2 sm:p-3">
            <div className="flex flex-row items-start gap-2 sm:gap-3">
              {masonryColumns.map((entries, colIdx) => (
                <div
                  key={colIdx}
                  className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3"
                >
                  {entries.map(({ item, index }) => {
                    const grad = TILE_GRADIENTS[index % TILE_GRADIENTS.length];
                    const pctLabel = formatPct(item.pct);
                    const pctScale = pctScaleForRank(index, tilesSorted.length);
                    const isEditing = editingId === item.id;
                    const sourceLine = lines.find((l) => l.id === item.id);

                    return (
                      <div
                        key={item.id}
                        className={`${levyTileClass(index, isEditing)} ${
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
                          className={TILE_OVERFLOW_BTN_CLASS}
                          aria-label={`More options for ${item.authority}`}
                          aria-haspopup="dialog"
                          aria-expanded={tileActionsId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTileActionsId((cur) =>
                              cur === item.id ? null : item.id,
                            );
                          }}
                        >
                          <EllipsisVerticalIcon className="h-7 w-7" />
                        </button>
                        <p
                          className={`w-full min-w-0 pr-11 font-semibold leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] ${TILE_DESC_MILLS_CLASS} line-clamp-6`}
                        >
                          {item.authority}
                        </p>
                        <p
                          className={`font-mono font-semibold tabular-nums text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)] ${TILE_DESC_MILLS_CLASS}`}
                        >
                          {formatMills(item.mills)} mills
                        </p>
                        <p
                          className="mt-1 self-end font-bold tabular-nums tracking-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.3)] [font-size:calc(1.25rem+var(--pct-scale)*1.5rem)] sm:[font-size:calc(1.5rem+var(--pct-scale)*1.25rem)]"
                          style={
                            {
                              "--pct-scale": pctScale,
                            } as React.CSSProperties
                          }
                        >
                          {pctLabel}%
                        </p>
                      </>
                    )}
                  </div>
                    );
                  })}
                </div>
              ))}
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
                    {lineItems.map((item) => {
                      const pct = (item.mills / sumMills) * 100;
                      return (
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
                            {formatPct(pct)}%
                          </td>
                        </tr>
                      );
                    })}
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
                Example data: turn off the sample switch above to edit or remove
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
    </div>
  );
}
