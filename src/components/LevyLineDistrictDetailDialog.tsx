"use client";

import type { ArapahoeDolaMatch } from "@/lib/arapahoeParcelLevyData";
import type {
  SpecialDistrictMatch,
  SpecialDistrictRecord,
} from "@/lib/specialDistrictMatch";
import { InfoDetails } from "@/components/InfoDetails";
import { ModalPortal } from "@/components/ModalPortal";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { COUNTY_EXTERNAL_LINK_CLASS, TERM_LINK_CLASS } from "@/lib/toolFlowStyles";
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
  /**
   * When true, term links scroll to `/#term-*` on this page (Definitions shown after PIN load).
   * Otherwise navigate to `/sources#term-*`.
   */
  termDefinitionsOnHomePage?: boolean;
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
  termDefinitionsOnHomePage = false,
  onClose,
}: Props) {
  const districtWebsiteHref = safeHttpOrHttpsUrl(
    match && match.kind !== "none" ? match.record.websiteUrl : null,
  );

  const hasDolaPanel = Boolean(
    dolaMatch &&
      dolaMatch.method !== "none" &&
      dolaMatch.method !== "skipped" &&
      (dolaMatch.taxEntityId || dolaMatch.matchedLegalName),
  );
  const hasDirectoryMatch = Boolean(
    match && match.kind !== "none" && !directoryLoading && !directoryError,
  );

  const dolaLg = normalizeLgIdForCompare(dolaMatch?.lgId);
  const dirLg =
    match && match.kind !== "none"
      ? normalizeLgIdForCompare(match.record.lgId)
      : null;
  const lgIdsAligned = Boolean(dolaLg && dirLg && dolaLg === dirLg);
  const lgIdConflict = Boolean(dolaLg && dirLg && dolaLg !== dirLg);
  /** Matching LG ID from bill-side and directory is the strongest link; name fuzziness is secondary. */
  const lgIdContactTrusted =
    hasDolaPanel && hasDirectoryMatch && lgIdsAligned && !lgIdConflict;

  function navigateToTerm(id: "term-mills" | "term-levy" | "term-lg-id") {
    onClose();
    window.setTimeout(() => {
      if (termDefinitionsOnHomePage) {
        window.history.replaceState(null, "", `/#${id}`);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.assign(`/sources#${id}`);
      }
    }, 0);
  }

  const dolaNameWarningPill =
    !lgIdContactTrusted &&
    dolaMatch &&
    dolaMatch.method !== "none" &&
    dolaMatch.method !== "skipped" &&
    (dolaMatch.taxEntityId || dolaMatch.matchedLegalName) &&
    dolaMatch.confidence === "low" &&
    dolaMatch.method !== "override" ? (
      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-950">
        Verify the district name on your bill.
      </span>
    ) : null;

  const showContactUncertainty =
    hasDirectoryMatch &&
    match &&
    match.kind !== "none" &&
    !lgIdContactTrusted &&
    !lgIdConflict &&
    match.confidence === "medium";

  const primaryDisplayName =
    hasDolaPanel
      ? (dolaMatch!.matchedLegalName?.trim() || authorityLabel)
      : hasDirectoryMatch && match && match.kind !== "none"
        ? match.record.name
        : authorityLabel;

  const directoryNameDiffers =
    hasDolaPanel &&
    hasDirectoryMatch &&
    match &&
    match.kind !== "none" &&
    dolaMatch?.matchedLegalName &&
    normalizeLabel(match.record.name) !==
      normalizeLabel(dolaMatch.matchedLegalName);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex min-h-[100dvh] w-full items-end justify-center sm:items-center sm:p-4">
        <button
          type="button"
          className="absolute inset-0 min-h-[100dvh] bg-black/45"
          aria-label="Close details"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="levy-line-detail-heading"
          className="relative z-10 flex max-h-[min(90dvh,44rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 sm:px-5 sm:pt-5">
            <h3
              id="levy-line-detail-heading"
              className="pr-2 text-base font-semibold leading-snug text-slate-900 sm:text-lg"
            >
              {authorityLabel}
            </h3>
            <p className="mt-1 font-mono text-sm tabular-nums text-slate-600">
              <span>{millsLabel}</span>{" "}
              <button
                type="button"
                className={`${TERM_LINK_CLASS} cursor-pointer border-0 bg-transparent p-0 font-sans text-sm`}
                onClick={() => navigateToTerm("term-mills")}
              >
                mills
              </button>
              {" · "}
              {pctLabel}% of your property tax
            </p>

            <div className="mt-4 space-y-3 pb-1 text-sm leading-relaxed text-slate-800 sm:text-base">
              {dolaMatch && dolaMatch.uraHint && (
                <p className="rounded-lg border border-violet-200 bg-violet-50/90 px-3 py-2 text-slate-800">
                  <strong className="font-semibold text-violet-950">Urban renewal / TIF</strong>
                  {" "}
                  — use mills from your county property tax page or tax bill.
                </p>
              )}
              {dolaMatch && dolaMatch.method === "skipped" && (
                <p className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-slate-700">
                  {dolaMatch.skipReason === "assessor_fee" ? (
                    <>
                      <strong className="font-semibold text-slate-900">County fee</strong>
                      {" "}
                      — not a district in the state directory. Enter the amount from your county{" "}
                      <strong>Tax District Levies</strong>
                      {" "}
                      page or notice.
                    </>
                  ) : (
                    <>
                      We could not match this district to the extra state reference. The mills on
                      your tile still match your bill.
                    </>
                  )}
                </p>
              )}

              {hasDolaPanel && hasDirectoryMatch && lgIdConflict && (
                <p
                  className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-amber-950"
                  role="status"
                >
                  The address and website below may not match this district. Check the name on your
                  bill before you use them.
                  <span className="mt-1 block text-xs text-amber-900/90">
                    LG ID on your bill (
                    <span className="font-mono tabular-nums">{dolaLg}</span>
                    ) does not match the contact listing (
                    <span className="font-mono tabular-nums">{dirLg}</span>
                    ).
                  </span>
                </p>
              )}

              {showContactUncertainty && (
                <p
                  className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-amber-950"
                  role="status"
                >
                  We believe the website and address below belong to this taxing authority, but we
                  cannot fully verify the match from the name alone. Confirm on your bill before you
                  rely on them.
                </p>
              )}

              {dolaMatch && dolaMatch.method === "none" && !dolaMatch.uraHint && (
                <p className="rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 text-slate-700">
                  We could not add the extra state cross-check for this district. The mills on your
                  tile still match your bill.
                </p>
              )}

              {directoryError && (
                <p className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-red-900">
                  {directoryError}
                </p>
              )}
              {directoryLoading && (
                <p className="text-slate-600">Loading address and website…</p>
              )}

              {(hasDolaPanel ||
                (hasDirectoryMatch && match && match.kind !== "none")) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    This taxing authority
                  </p>
                  <p className="mt-2 font-semibold leading-snug text-slate-900 sm:text-lg">
                    {primaryDisplayName}
                  </p>
                  {directoryNameDiffers && match ? (
                    <p className="mt-1 text-sm text-slate-600">
                      District directory lists: {match.record.name}
                      {lgIdContactTrusted
                        ? " (same LG ID as on your bill — listing title may differ)."
                        : ""}
                    </p>
                  ) : null}

                  <dl className="mt-3 space-y-1.5 font-mono text-xs text-slate-800 sm:text-sm">
                    {dolaMatch && dolaMatch.taxEntityId ? (
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <dt className="text-slate-500">Tax entity</dt>
                        <dd>{dolaMatch.taxEntityId}</dd>
                      </div>
                    ) : null}
                    {dolaLg || dirLg ? (
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <dt className="text-slate-500">LG ID</dt>
                        <dd>
                          {lgIdConflict ? (
                            <>
                              <span className="font-mono tabular-nums">{dolaMatch?.lgId ?? "—"}</span>
                              {" "}
                              (from your bill) vs{" "}
                              <span className="font-mono tabular-nums">
                                {match && match.kind !== "none" ? match.record.lgId : "—"}
                              </span>{" "}
                              (contact listing)
                            </>
                          ) : (
                            <span className="font-mono tabular-nums">
                              {dolaMatch?.lgId ?? (match && match.kind !== "none" ? match.record.lgId : "")}
                            </span>
                          )}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {dolaNameWarningPill ? <div className="mt-2">{dolaNameWarningPill}</div> : null}

                  {dolaMatch &&
                    dolaMatch.millsReason === "county_levy_table_override" &&
                    typeof dolaMatch.dolaMills === "number" && (
                      <p className="mt-2 text-xs text-slate-600">
                        Rate note: county table differs from some state figures (other records showed{" "}
                        <span className="font-mono tabular-nums">
                          {formatCountyLevyMillsDisplay(dolaMatch.dolaMills)}
                        </span>
                        ). Use your bill or county property tax page if unsure.
                      </p>
                    )}
                  {dolaMatch?.millsReason === "bond_purpose_mismatch" && (
                    <p className="mt-2 text-sm font-medium text-amber-950">
                      Use the rate from your county property tax page for this district.
                    </p>
                  )}

                  {hasDirectoryMatch && match && match.kind !== "none" ? (
                    <>
                      {districtWebsiteHref ? (
                        <p className="mt-3 border-t border-slate-200/90 pt-3">
                          <a
                            href={districtWebsiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={COUNTY_EXTERNAL_LINK_CLASS}
                          >
                            Website
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        </p>
                      ) : null}
                      {formatMailingLines(match.record).length > 0 ? (
                        <div className="mt-3 border-t border-slate-200/90 pt-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Address
                          </p>
                          <address className="mt-1 not-italic text-sm text-slate-800">
                            {formatMailingLines(match.record).map((line, i) => (
                              <span key={`${i}-${line.slice(0, 24)}`} className="block">
                                {line}
                              </span>
                            ))}
                          </address>
                        </div>
                      ) : null}
                      {snapshot ? (
                        <p className="mt-3 border-t border-slate-200/90 pt-3 text-xs text-slate-500">
                          Contact info as of {snapshot.bundledAsOf}
                        </p>
                      ) : null}
                    </>
                  ) : !directoryLoading && !directoryError && hasDolaPanel ? (
                    <p className="mt-3 border-t border-slate-200/90 pt-3 text-sm text-slate-600">
                      No address or website in our special-district directory for this district
                      (counties, schools, and cities are often not listed there).
                    </p>
                  ) : null}
                </div>
              )}

              {!directoryLoading && !directoryError && match && match.kind === "none" && !hasDolaPanel && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4">
                  <p className="font-medium text-slate-900">No directory match for this line</p>
                  <p className="mt-1 text-sm text-slate-700">
                    This registry covers many special districts (metro, fire, water, etc.), not
                    counties, schools, or cities.
                  </p>
                </div>
              )}

              <InfoDetails title="Where this comes from">
                <p>
                  Names and IDs here come from state tax records; address and website come from
                  Colorado&apos;s special-district directory when we find a listing. Matching{" "}
                  <strong className="font-semibold text-slate-900">LG ID</strong>
                  {" "}
                  in both places is our strongest check. If we only had a close name match, we flag
                  it in the note above. The rate for this row is at the top of this window.
                </p>
              </InfoDetails>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <p className="text-base leading-relaxed text-slate-800 sm:text-lg">
                  <dfn className="font-semibold not-italic text-slate-900">LG ID</dfn>
                  {" "}
                  (local government ID) is Colorado&apos;s numeric identifier for this taxing
                  district in state records.{" "}
                  <button
                    type="button"
                    className={`${TERM_LINK_CLASS} cursor-pointer border-0 bg-transparent p-0 text-base sm:text-lg`}
                    onClick={() => navigateToTerm("term-lg-id")}
                  >
                    Full definition
                  </button>
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
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
    </ModalPortal>
  );
}

function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Compare DOLA lgId with directory lgId (digits only, zero-padded when short). */
function normalizeLgIdForCompare(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const digits = t.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length <= 5 ? digits.padStart(5, "0") : digits;
}
