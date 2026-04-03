"use client";

import { ExampleModeCallout } from "@/components/ExampleModeCallout";
import type { ArapahoeDolaMatch, ArapahoeLevyStacksFile } from "@/lib/arapahoeParcelLevyData";
import type {
  SpecialDistrictMatch,
  SpecialDistrictRecord,
} from "@/lib/specialDistrictMatch";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";

type Props = {
  authorityLabel: string;
  millsLabel: string;
  pctLabel: string;
  /** Null while JSON is still fetching from `/public/data/`. */
  match: SpecialDistrictMatch | null;
  /** Offline LGIS / Tax Entity match from Mart_TA_TAG + DOLA export (build script). */
  dolaMatch: ArapahoeDolaMatch | null | undefined;
  directoryLoading: boolean;
  directoryError: string | null;
  snapshot: { bundledAsOf: string; source: string } | null;
  /** From arapahoe-levy-stacks-by-tag-id.json when a parcel stack was loaded. */
  arapahoeSnapshot?: ArapahoeLevyStacksFile["snapshot"] | null;
  useSampleData: boolean;
  onClose: () => void;
};

function formatMailingLines(r: SpecialDistrictRecord): string[] {
  const lines: string[] = [];
  if (r.mailAddress) lines.push(r.mailAddress);
  if (r.altAddress && r.altAddress !== "NA") lines.push(r.altAddress);
  const cityParts = [r.mailCity, r.mailState, r.mailZip].filter(Boolean);
  if (cityParts.length) lines.push(cityParts.join(", "));
  return lines;
}

export function LevyLineDistrictDetailDialog({
  authorityLabel,
  millsLabel,
  pctLabel,
  match,
  dolaMatch,
  directoryLoading,
  directoryError,
  snapshot,
  arapahoeSnapshot = null,
  useSampleData,
  onClose,
}: Props) {
  const districtWebsiteHref = safeHttpOrHttpsUrl(
    match && match.kind !== "none" ? match.record.websiteUrl : null,
  );
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="levy-line-detail-heading"
        className="relative z-10 max-h-[min(90vh,40rem)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-5"
      >
        <h3
          id="levy-line-detail-heading"
          className="pr-2 text-base font-semibold leading-snug text-slate-900 sm:text-lg"
        >
          {authorityLabel}
        </h3>
        <p className="mt-1 font-mono text-sm tabular-nums text-slate-600">
          {millsLabel} mills · {pctLabel}% of your stack
        </p>

        {useSampleData && (
          <ExampleModeCallout variant="compact" as="p" className="mt-3">
            Example stack: lines are illustrative; matches still use the same
            district directory.
          </ExampleModeCallout>
        )}

        <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-800 sm:text-base">
          {dolaMatch && dolaMatch.uraHint && (
            <p className="rounded-lg border border-violet-200 bg-violet-50/90 px-3 py-2 text-slate-800">
              <strong className="font-semibold text-violet-950">Urban renewal / TIF</strong>
              {" "}
              — this charge may be tied to urban renewal or similar programs. The
              state&apos;s public district list may not show a standard ID for it.
              Use the mill rate from your county levy page or tax bill.
            </p>
          )}
          {dolaMatch && dolaMatch.method === "skipped" && (
            <p className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-slate-700">
              {dolaMatch.skipReason === "assessor_fee" ? (
                <>
                  <strong className="font-semibold text-slate-900">County assessor fee</strong>
                  {" "}
                  — this is a fee line, not a separate taxing district in the
                  state&apos;s district database. Enter the amount from your county{" "}
                  <strong>Tax District Levies</strong> page or your tax notice.
                </>
              ) : (
                <>This line was not matched to the state district list.</>
              )}
            </p>
          )}
          {dolaMatch &&
            dolaMatch.method !== "none" &&
            dolaMatch.method !== "skipped" &&
            (dolaMatch.taxEntityId || dolaMatch.matchedLegalName) && (
              <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/60 p-3 sm:p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-900/85">
                  Colorado property tax record
                </p>
                {dolaMatch.matchedLegalName && (
                  <p className="mt-1 font-semibold text-emerald-950">
                    {dolaMatch.matchedLegalName}
                  </p>
                )}
                {dolaMatch.taxEntityId && (
                  <p className="mt-2 font-mono text-sm text-slate-800">
                    Tax entity ID {dolaMatch.taxEntityId}
                  </p>
                )}
                {dolaMatch.lgId && (
                  <p className="mt-1 font-mono text-sm text-slate-700">
                    LG ID {dolaMatch.lgId}
                  </p>
                )}
                {dolaMatch.confidence === "high" && (
                  <p className="mt-2 text-xs text-slate-600">
                    We matched this county line to a name in Colorado&apos;s published
                    property tax entity list.
                  </p>
                )}
                {dolaMatch.confidence === "medium" && (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50/90 px-2 py-1.5 text-xs text-amber-950">
                    <strong className="font-semibold">Close name match</strong>
                    {" — "}
                    compare the name above to your tax bill before using these IDs for
                    research. If it looks off, trust your bill.
                  </p>
                )}
                {dolaMatch.confidence === "low" &&
                  dolaMatch.method !== "override" && (
                    <p className="mt-2 text-xs text-slate-600">
                      This was a weaker automatic match; treat the IDs as uncertain
                      until you confirm against your bill.
                    </p>
                  )}
                {typeof dolaMatch.mills === "number" && (
                  <p className="mt-2 rounded-lg border border-sky-200/90 bg-sky-50/80 px-2 py-2 text-sm text-slate-800">
                    <strong className="font-semibold text-sky-950">Certified levy (mills)</strong>
                    {" "}
                    <span className="font-mono tabular-nums">
                      {formatCountyLevyMillsDisplay(dolaMatch.mills)}
                    </span>
                    {dolaMatch.millsReason === "county_levy_table_override" ? (
                      <span className="mt-1 block text-xs text-slate-600">
                        Matched to Arapahoe County&apos;s online levy table for this line so
                        totals agree with{" "}
                        <strong className="font-semibold text-slate-800">Levy.aspx</strong>.
                        {typeof dolaMatch.dolaMills === "number" ? (
                          <>
                            {" "}
                            The state export listed{" "}
                            <span className="font-mono tabular-nums">
                              {formatCountyLevyMillsDisplay(dolaMatch.dolaMills)}
                            </span>{" "}
                            mills for this entity; we use the county figure here.
                          </>
                        ) : null}
                      </span>
                    ) : arapahoeSnapshot?.dolaLevyColumn ? (
                      <span className="mt-1 block text-xs text-slate-600">
                        From the state&apos;s published totals
                        {arapahoeSnapshot.dolaLevyColumn.includes("2025")
                          ? " (2025 tax year)."
                          : "."}
                      </span>
                    ) : (
                      <span className="mt-1 block text-xs text-slate-600">
                        From the state&apos;s published property tax export.
                      </span>
                    )}
                  </p>
                )}
                {dolaMatch.millsReason === "bond_purpose_mismatch" && (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50/90 px-2 py-2 text-xs text-amber-950">
                    <strong className="font-semibold">Mill rate not filled in for you</strong>
                    {" "}
                    — the county label here did not line up cleanly with how the state
                    splits operating vs bond debt on this district. Enter the mills from
                    your county levy page or tax notice so we do not guess wrong.
                  </p>
                )}
              </div>
            )}
          {dolaMatch && dolaMatch.method === "none" && !dolaMatch.uraHint && (
            <p className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-slate-700">
              <strong className="font-semibold text-slate-900">No state list match</strong>
              {" "}
              — we could not reliably link this county line to one row in
              Colorado&apos;s public tax district list. That is common for unusual
              abbreviations, metro or water districts, or newer labels. Your mill
              amounts should still agree with your county levy page or tax bill; only
              the extra state reference is missing here.
              {dolaMatch.score != null && dolaMatch.score > 0 ? (
                <>
                  {" "}
                  (The closest name we tried was still uncertain.)
                </>
              ) : null}
            </p>
          )}

          {directoryError && (
            <p className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-red-900">
              {directoryError}
            </p>
          )}
          {directoryLoading && (
            <p className="text-slate-600">Loading Colorado district directory…</p>
          )}
          {!directoryLoading && !directoryError && match && match.kind === "none" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4">
              <p className="font-medium text-slate-900">No directory match</p>
              <p className="mt-2 text-slate-700">
                This bundled data covers many{" "}
                <strong>Colorado local districts</strong> (metropolitan, fire,
                water and sanitation, park and recreation, and similar entities)
                from state GIS and DOLA tabular exports. Counties, school
                districts, and cities usually will not appear here even though
                they are on your tax bill.
              </p>
              <p className="mt-2 text-slate-700">
                If the name on your bill is abbreviated, try spelling it out the
                way the county shows it, or include the district&apos;s LG ID if
                you see a short numeric code in levy documents.
              </p>
            </div>
          )}

          {!directoryLoading && !directoryError && match && match.kind !== "none" && (
            <>
              {match.confidence === "medium" && (
                <p className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-amber-950">
                  <strong className="font-semibold">Possible match</strong>
                  {" — "}
                  compare the official name below to your tax bill before using
                  contact info or the website.
                </p>
              )}
              <div className="rounded-xl border border-indigo-200/90 bg-indigo-50/50 p-3 sm:p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-indigo-900/80">
                  Colorado district record
                </p>
                <p className="mt-1 font-semibold text-indigo-950">
                  {match.record.name}
                </p>
                {match.record.abbrevName &&
                  normalizeLabel(match.record.abbrevName) !==
                    normalizeLabel(match.record.name) && (
                    <p className="mt-1 text-sm text-slate-700">
                      Also known as: {match.record.abbrevName}
                    </p>
                  )}
                <p className="mt-2 font-mono text-sm text-slate-700">
                  LG ID {match.record.lgId}
                </p>
                {districtWebsiteHref && (
                  <p className="mt-3">
                    <a
                      href={districtWebsiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={COUNTY_EXTERNAL_LINK_CLASS}
                    >
                      District website
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <span className="mt-1 block text-xs text-slate-600">
                      Many districts post board meetings, contacts, budgets, and
                      election information here (varies by district).
                    </span>
                  </p>
                )}
                {formatMailingLines(match.record).length > 0 && (
                  <div className="mt-3 border-t border-indigo-200/60 pt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                      Mailing address (registry)
                    </p>
                    <address className="mt-1 not-italic text-slate-800">
                      {formatMailingLines(match.record).map((line, i) => (
                        <span key={`${i}-${line.slice(0, 24)}`} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </div>
                )}
              </div>
              {snapshot && (
                <p className="text-xs text-slate-600">
                  Data snapshot {snapshot.bundledAsOf}. {snapshot.source}
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-5">
          <button
            type="button"
            className={`${btnOutlineSecondaryMd} w-full justify-center py-3`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
