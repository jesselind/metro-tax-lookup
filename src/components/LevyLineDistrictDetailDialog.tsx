"use client";

/**
 * Levy line detail modal: essentials first (title, mills, explainer if present), then IDs and contact,
 * with longer LG/directory nuance in <details> where needed. Follow docs/levy-explainer-authoring.md;
 * entity-specific explainer JSON is optional.
 */
import { useEffect, useRef } from "react";
import type { ArapahoeDolaMatch } from "@/lib/arapahoeParcelLevyData";
import type {
  SpecialDistrictMatch,
  SpecialDistrictRecord,
} from "@/lib/specialDistrictMatch";
import { ModalPortal } from "@/components/ModalPortal";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { LevyExplainerModalSection } from "@/components/LevyExplainerModalSection";
import { findLevyExplainerEntry } from "@/lib/levyExplainer";
import { levyGovernmentContactKind } from "@/lib/levyGovernmentKind";
import { COUNTY_EXTERNAL_LINK_CLASS, TERM_LINK_CLASS } from "@/lib/toolFlowStyles";
import { safeHttpOrHttpsUrl } from "@/lib/safeExternalHref";
import { formatLocalGovernmentTypeForDisplay } from "@/lib/localGovernmentTypeDisplay";
import { focusTermDefinitionById } from "@/lib/focusTermDefinition";
import { useDialogFocusTrap } from "@/lib/useDialogFocusTrap";

type Props = {
  authorityLabel: string;
  /** Mart levy line code when known (improves explainer matching). */
  levyLineCode?: string;
  /** County TAG / source tag when known. */
  sourceTagId?: string;
  millsLabel: string;
  pctLabel: string;
  /** Null while JSON is still fetching from `/public/data/`. */
  match: SpecialDistrictMatch | null;
  /** Offline LGIS / Tax Entity match from Mart_TA_TAG + DOLA export (build script). */
  dolaMatch: ArapahoeDolaMatch | null | undefined;
  directoryLoading: boolean;
  directoryError: string | null;
  snapshot: { bundledAsOf: string; source: string; sourceCsv?: string } | null;
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
  levyLineCode,
  sourceTagId,
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

  const mailingLinesForRecord =
    match && match.kind !== "none" ? formatMailingLines(match.record) : [];
  const hasDirectoryContactInfo =
    Boolean(districtWebsiteHref) || mailingLinesForRecord.length > 0;

  const dolaGovernmentTypeLabel =
    match && match.kind !== "none"
      ? formatLocalGovernmentTypeForDisplay(match.record.localGovernmentType)
      : null;

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

  function navigateToTerm(
    id:
      | "term-mills"
      | "term-lg-id"
      | "term-tax-entity"
      | "term-special-districts",
  ) {
    onClose();
    window.setTimeout(() => {
      if (termDefinitionsOnHomePage) {
        window.history.replaceState(null, "", `/#${id}`);
        focusTermDefinitionById(id);
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
      <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-800">
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

  const levyExplainerEntry = findLevyExplainerEntry(authorityLabel, {
    levyLineCode,
    sourceTagId,
    lgId: dolaMatch?.lgId ?? undefined,
  });

  const contactGovernmentKind = levyGovernmentContactKind(
    authorityLabel,
    levyExplainerEntry?.origin.level ?? null,
    levyExplainerEntry != null,
  );
  const isSpecialDistrictContactContext =
    contactGovernmentKind === "special_district_context";

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useDialogFocusTrap(dialogRef);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex min-h-[100dvh] w-full items-end justify-center sm:items-center sm:p-4">
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-0 min-h-[100dvh] bg-black/45"
          aria-label="Close details"
          onClick={onClose}
        />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="levy-line-detail-heading"
          className="relative z-10 flex max-h-[min(90dvh,44rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-lg border border-slate-200 bg-white shadow-2xl sm:rounded-lg"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 sm:px-5 sm:pt-5">
            <h3
              ref={titleRef}
              id="levy-line-detail-heading"
              tabIndex={0}
              className="pr-2 text-base font-semibold leading-snug text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-600/50 focus-visible:ring-offset-2 sm:text-lg"
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

            <div className="mt-4 space-y-3 pb-3 text-sm leading-relaxed text-slate-800 sm:text-base">
              {levyExplainerEntry ? (
                <LevyExplainerModalSection
                  entry={levyExplainerEntry}
                  onNavigateToTerm={(termId) => {
                    if (
                      termId === "term-mills" ||
                      termId === "term-lg-id" ||
                      termId === "term-tax-entity" ||
                      termId === "term-special-districts"
                    ) {
                      navigateToTerm(termId);
                    }
                  }}
                />
              ) : !directoryLoading &&
                !directoryError &&
                dolaGovernmentTypeLabel ? (
                <div
                  className="rounded-lg border border-slate-200/95 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm sm:p-5"
                  role="region"
                  aria-labelledby="levy-detail-government-type-label"
                >
                  <p
                    id="levy-detail-government-type-label"
                    className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Government type
                  </p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.65rem] sm:leading-tight">
                    {dolaGovernmentTypeLabel}
                  </p>
                </div>
              ) : null}

              {dolaMatch && dolaMatch.uraHint && (
                <p className="rounded-md border border-violet-200 bg-violet-50/90 px-3 py-2 text-slate-800">
                  <strong className="font-semibold text-violet-950">Urban renewal / TIF</strong>
                  {" "}
                  — use mills from your county property tax page or tax bill.
                </p>
              )}
              {dolaMatch && dolaMatch.method === "skipped" && (
                <p className="rounded-md border border-slate-200 bg-slate-50/90 px-3 py-2 text-slate-700">
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

              {dolaMatch && dolaMatch.method === "none" && !dolaMatch.uraHint && (
                <p className="rounded-md border border-slate-200 bg-slate-50/90 px-3 py-2 text-slate-700">
                  We could not add the extra state cross-check for this district. The mills on your
                  tile still match your bill.
                </p>
              )}

              {directoryError ? (
                <div aria-live="polite" aria-atomic="true">
                  <p className="rounded-md border border-red-200 bg-red-50/90 px-3 py-2 text-red-900">
                    {directoryError}
                  </p>
                </div>
              ) : null}
              {directoryLoading ? (
                <div aria-live="polite" aria-atomic="true">
                  <p className="text-slate-600">Loading address and website…</p>
                </div>
              ) : null}

              {(hasDolaPanel ||
                (hasDirectoryMatch && match && match.kind !== "none")) && (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50/90 p-3 sm:p-4"
                  role="region"
                  aria-labelledby="levy-detail-contact-heading"
                >
                  <p
                    id="levy-detail-contact-heading"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    Contact
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
                        <dt className="text-slate-500">
                          <button
                            type="button"
                            className={`${TERM_LINK_CLASS} cursor-pointer border-0 bg-transparent p-0 text-xs sm:text-sm`}
                            onClick={() => navigateToTerm("term-tax-entity")}
                            aria-label="Tax entity definition"
                          >
                            Tax entity
                          </button>
                        </dt>
                        <dd>{dolaMatch.taxEntityId}</dd>
                      </div>
                    ) : null}
                    {dolaLg || dirLg ? (
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        <dt className="text-slate-500">
                          <button
                            type="button"
                            className={`${TERM_LINK_CLASS} cursor-pointer border-0 bg-transparent p-0 text-xs sm:text-sm`}
                            onClick={() => navigateToTerm("term-lg-id")}
                            aria-label="LG ID definition"
                          >
                            LG ID
                          </button>
                        </dt>
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

                  {hasDolaPanel && hasDirectoryMatch && lgIdConflict && (
                    <div className="mt-3 border-t border-slate-200/90 pt-3" role="status">
                      <div className="rounded-md border border-slate-200/70 bg-white/50 px-3 py-2.5 text-slate-800">
                        <p className="text-sm leading-snug text-slate-800">
                          <span className="font-medium text-slate-900">
                            Contact uses a different public listing ID.
                          </span>{" "}
                          Your bill lists LG ID{" "}
                          <span className="font-mono tabular-nums text-slate-800">{dolaLg}</span>
                          ; the Contact section below comes from directory LG ID{" "}
                          <span className="font-mono tabular-nums text-slate-800">{dirLg}</span>.
                        </p>
                        <details className="group mt-2 border-t border-slate-200/80 pt-2">
                          <summary className="flex cursor-pointer list-none items-center gap-2 rounded text-xs font-medium text-slate-600 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600/40 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                            <svg
                              aria-hidden
                              className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-90"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Why two LG IDs?
                          </summary>
                          <div className="mt-2 space-y-2 pl-6 text-xs leading-relaxed text-slate-600">
                            <p>
                              Your tax record and the state&apos;s district contact list do not
                              always use the same ID for the same row. That is common. It does not
                              mean your bill is wrong about who levies this tax.
                            </p>
                            {isSpecialDistrictContactContext ? (
                              <p>
                                The name and IDs above are who levies this tax. The website and
                                address below come from a different directory row than your bill ID.
                                Special districts often list mailing or administrative addresses that
                                are shared with another district or handled by a third-party
                                administrator. Two listing IDs often differ because tax and contact
                                data are not keyed the same way. The address may not be that
                                district&apos;s main public office.
                              </p>
                            ) : (
                              <p>
                                The name and IDs above are who levies this tax. The website and
                                address below come from a different directory row than your bill ID.
                                That listing may show another government office, a shared public
                                building, or mail for administrative reasons. Two listing IDs often
                                differ because tax and contact data are not keyed the same way. The
                                address may not be that agency&apos;s main public office.
                              </p>
                            )}
                            <p>
                              If you call or write, confirm you are reaching the right office for
                              this levy.
                            </p>
                          </div>
                        </details>
                      </div>
                    </div>
                  )}

                  {showContactUncertainty && (
                    <p
                      className="mt-3 border-t border-slate-200/90 pt-3 text-sm leading-snug text-slate-700"
                      role="status"
                    >
                      We believe the contact block below matches this levy line, but we cannot fully
                      verify it from the name alone. Confirm on your bill before you rely on it.
                    </p>
                  )}

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
                    <div className="mt-3 border-t border-slate-200/90 pt-3">
                      {districtWebsiteHref ? (
                        <p className="mt-2">
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
                      {mailingLinesForRecord.length > 0 ? (
                        <div
                          className={
                            districtWebsiteHref
                              ? "mt-3 border-t border-slate-200/80 pt-3"
                              : "mt-2"
                          }
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Address
                          </p>
                          <address className="mt-1 not-italic text-sm text-slate-800">
                            {mailingLinesForRecord.map((line, i) => (
                              <span key={`${i}-${line.slice(0, 24)}`} className="block">
                                {line}
                              </span>
                            ))}
                          </address>
                        </div>
                      ) : null}
                      {snapshot ? (
                        <p className="mt-3 text-xs text-slate-500">
                          Contact info as of {snapshot.bundledAsOf}
                          {snapshot.sourceCsv ? ` (${snapshot.sourceCsv})` : ""}
                        </p>
                      ) : null}
                      {!lgIdConflict && hasDirectoryContactInfo ? (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          {isSpecialDistrictContactContext ? (
                            <>
                              Public listings for special districts often show mailing or
                              administrative addresses. They may be shared with another district or
                              a management contact. Confirm using the name on your bill.
                            </>
                          ) : (
                            <>
                              Public listings often show mailing or administrative addresses. They
                              may point to another government office, a shared building, or a third
                              party. Confirm using the name on your bill.
                            </>
                          )}
                        </p>
                      ) : null}
                      {!lgIdConflict && !hasDirectoryContactInfo ? (
                        <p className="mt-2 text-xs leading-relaxed text-slate-600" role="status">
                          This listing has no website or mailing address in our current state
                          export. Use the name and IDs above, or your county property tax page, to
                          find the right office.
                        </p>
                      ) : null}
                    </div>
                  ) : !directoryLoading && !directoryError && hasDolaPanel ? (
                    <div className="mt-3 space-y-2 border-t border-slate-200/90 pt-3 text-sm leading-relaxed text-slate-600">
                      <p>
                        No contact row in our state directory export for this LG ID yet. Use the name
                        and IDs above, or your county property tax page, to find the right office.
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">How to inquire:</span> Use the
                        taxing authority name, tax entity, and LG ID on your bill or county property
                        tax page to find the right office or official contacts. See{" "}
                        <a
                          href="/sources#levy-breakdown-tool"
                          className={`${TERM_LINK_CLASS} cursor-pointer`}
                        >
                          Sources
                        </a>{" "}
                        for how we match levy data.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {!directoryLoading && !directoryError && match && match.kind === "none" && !hasDolaPanel && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3 sm:p-4">
                  <p className="font-medium text-slate-900">No directory match for this line</p>
                  <p className="mt-1 text-sm text-slate-700">
                    We could not match this line to a bundled directory row by LG ID or name. Use
                    your bill or county property tax page to confirm who levies this tax.
                  </p>
                </div>
              )}

              <p className="text-sm text-slate-600">
                Want details on data sources and matching?{" "}
                <a
                  href="/sources#levy-breakdown-tool"
                  className={`${TERM_LINK_CLASS} cursor-pointer`}
                >
                  See Sources
                </a>
                .
              </p>
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
