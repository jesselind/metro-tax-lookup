import { DEBT_PANEL_CLASS } from "@/lib/debtUiClasses";
import type { LevyLineFromJson } from "@/lib/levyTypes";

type LevyLinesCardProps = {
  title: string;
  description: string;
  levies: LevyLineFromJson[];
  rateToMills: number;
  /** Default 3. Ignored when showAllLines is true. */
  maxLines?: number;
  /** If true, list every levy line (for audit / detail views). */
  showAllLines?: boolean;
  /** Debt-themed surface; use slate-600+ for small text (AA on light wash). */
  tone?: "neutral" | "debt";
};

export function LevyLinesCard({
  title,
  description,
  levies,
  rateToMills,
  maxLines = 3,
  showAllLines = false,
  tone = "neutral",
}: LevyLinesCardProps) {
  if (levies.length === 0) return null;

  const cap = showAllLines ? levies.length : maxLines;
  const shown = levies.slice(0, cap);
  const shellClass =
    tone === "debt"
      ? DEBT_PANEL_CLASS
      : "overflow-hidden border border-slate-200 bg-slate-50";
  const titleClass =
    tone === "debt" ? "font-medium text-slate-900" : "font-medium text-indigo-950";
  const descClass =
    tone === "debt"
      ? "mt-0.5 text-[0.7rem] text-slate-600 sm:text-xs"
      : "mt-0.5 text-[0.7rem] text-slate-500 sm:text-xs";
  const divideClass =
    tone === "debt" ? "divide-red-400/50" : "divide-slate-200";
  const listClass =
    tone === "debt" ? `divide-y ${divideClass} bg-debt-wash` : `divide-y ${divideClass}`;

  return (
    <div className={shellClass}>
      <div
        className={
          tone === "debt"
            ? "border-b border-red-400/40 bg-debt-wash px-3 py-2.5 sm:px-4"
            : "px-3 py-2.5 sm:px-4"
        }
      >
        <div className="flex items-center justify-between">
          <p className={titleClass}>{title}</p>
        </div>
        <p className={descClass}>{description}</p>
      </div>
      <ul className={listClass}>
        {shown.map((levy) => (
          <li
            key={levy.rawRowIndex}
            className="flex items-baseline justify-between gap-3 px-3 py-2 sm:px-4"
          >
            <span
              className={
                tone === "debt"
                  ? "text-xs text-slate-800 sm:text-sm"
                  : "text-xs sm:text-sm"
              }
            >
              {levy.purposeRaw}
            </span>
            <span className="flex flex-col items-end text-right">
              <span className="text-xs font-mono text-slate-700 sm:text-sm">
                {(levy.rateMillsCurrent * rateToMills).toFixed(3)} mills
              </span>
              {levy.taborExempt && (
                <span className="mt-1 inline-flex items-center justify-center rounded-full border border-amber-900 bg-amber-50 px-1.5 pb-0.5 pt-1 text-[0.55rem] font-semibold uppercase leading-none tracking-wide text-amber-900">
                  TABOR-exempt
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
