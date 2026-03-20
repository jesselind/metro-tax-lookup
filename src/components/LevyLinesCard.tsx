import type { LevyLineFromJson } from "@/lib/levyTypes";

type LevyLinesCardProps = {
  title: string;
  description: string;
  levies: LevyLineFromJson[];
  rateToMills: number;
  maxLines?: number;
};

export function LevyLinesCard({
  title,
  description,
  levies,
  rateToMills,
  maxLines = 3,
}: LevyLinesCardProps) {
  if (levies.length === 0) return null;

  const shown = levies.slice(0, maxLines);

  return (
    <div className="border border-slate-200 bg-slate-50">
      <div className="px-3 py-2.5 sm:px-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-indigo-950">{title}</p>
        </div>
        <p className="mt-0.5 text-[0.7rem] text-slate-500 sm:text-xs">
          {description}
        </p>
      </div>
      <ul className="divide-y divide-slate-200">
        {shown.map((levy) => (
          <li
            key={levy.rawRowIndex}
            className="flex items-baseline justify-between gap-3 px-3 py-2 sm:px-4"
          >
            <span className="text-xs sm:text-sm">{levy.purposeRaw}</span>
            <span className="flex flex-col items-end text-right">
              <span className="text-xs font-mono text-slate-700 sm:text-sm">
                {(levy.rateMillsCurrent * rateToMills).toFixed(3)} mills
              </span>
              {levy.taborExempt && (
                <span className="mt-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-amber-900">
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
