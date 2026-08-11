// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import { SitusEnvelopeAddress } from "@/components/SitusEnvelopeAddress";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
import type { SitusEnvelopeDisplayRow } from "@/lib/addressLabelDifference";
import { formatUsdWhole } from "@/lib/formatUsd";
import {
  situsAccountKindGlossaryTermId,
  type EnrichedSitusPinHit,
} from "@/lib/situsMultiPinChooser";

export type SitusMultiAccountChooserItem = {
  pin: string;
  label: string;
  enriched: EnrichedSitusPinHit | null;
  envelope: SitusEnvelopeDisplayRow | null;
};

export type SitusMultiAccountChooserListProps = {
  items: SitusMultiAccountChooserItem[];
  onSelectPin: (pin: string) => void;
  selectDisabled?: boolean;
  /** When set, that row is marked as the account already on the dashboard. */
  currentPin?: string | null;
  /**
   * Dashboard switcher modal: whole row is the hit target (no "Use this property"
   * button). Post-search chooser keeps the explicit button.
   */
  rowHitTarget?: boolean;
  /** Prefix for glossary text-trigger ids (must be unique per mount surface). */
  glossaryIdPrefix: string;
};

/**
 * Accessible name for a full-row switcher control (dashboard modal `rowHitTarget`).
 */
function accountRowSelectLabel(
  pin: string,
  enriched: EnrichedSitusPinHit | null,
): string {
  const kind = enriched?.accountKindLabel?.trim() || null;
  const owner = enriched?.ownerList?.trim() || null;
  if (owner && kind) return `Switch to ${kind}, ${owner}. PIN ${pin}.`;
  if (kind) return `Switch to ${kind}. PIN ${pin}.`;
  if (owner) return `Switch to ${owner}. PIN ${pin}.`;
  return `Switch to PIN ${pin}.`;
}

type RowBodyProps = {
  pin: string;
  label: string;
  enriched: EnrichedSitusPinHit | null;
  envelope: SitusEnvelopeDisplayRow | null;
  isCurrent: boolean;
  glossaryIdPrefix: string;
  allowGlossary: boolean;
  showViewingChip: boolean;
  /**
   * When the row uses an invisible full-row button, glossary triggers need
   * `pointer-events-auto` above that overlay (same idea as summary tiles).
   */
  glossaryAboveRowHitTarget?: boolean;
};

function AccountRowBody({
  pin,
  label,
  enriched,
  envelope,
  isCurrent,
  glossaryIdPrefix,
  allowGlossary,
  showViewingChip,
  glossaryAboveRowHitTarget = false,
}: RowBodyProps) {
  const accountKindTermId =
    enriched != null
      ? situsAccountKindGlossaryTermId(enriched.accountKind)
      : null;

  const kindLabel = enriched?.accountKindLabel ?? null;
  const kindPopover =
    allowGlossary && kindLabel != null && accountKindTermId != null ? (
      <ParcelGlossaryPopoverTrigger
        termId={accountKindTermId}
        textTrigger={kindLabel}
        textTriggerId={`${glossaryIdPrefix}-account-kind-${pin}`}
        variant="section-title"
      />
    ) : kindLabel != null ? (
      <span className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
        {kindLabel}
      </span>
    ) : null;

  return (
    <div className="min-w-0">
      {kindPopover != null ? (
        <p className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
          {glossaryAboveRowHitTarget ? (
            <span
              className="relative z-[2] inline-block pointer-events-auto"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
            >
              {kindPopover}
            </span>
          ) : (
            kindPopover
          )}
          {showViewingChip && isCurrent ? (
            <span className="ml-2 align-middle text-xs font-semibold uppercase tracking-wide text-indigo-800">
              Viewing
            </span>
          ) : null}
        </p>
      ) : showViewingChip && isCurrent ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
          Viewing
        </p>
      ) : null}
      {enriched?.ownerList ? (
        <p
          className={`text-sm font-medium leading-snug text-slate-700 sm:text-base ${
            kindPopover != null || (showViewingChip && isCurrent) ? "mt-1" : ""
          }`}
        >
          {enriched.ownerList}
        </p>
      ) : null}
      <p
        className={`text-sm text-slate-600 ${
          kindPopover != null ||
          enriched?.ownerList ||
          (showViewingChip && isCurrent)
            ? "mt-1"
            : ""
        }`}
      >
        PIN <span className="font-mono text-slate-700">{pin}</span>
      </p>
      {envelope != null ? (
        <SitusEnvelopeAddress row={envelope} className="mt-1" />
      ) : (
        <span className="mt-1 block text-slate-700">{label}</span>
      )}
      {enriched != null && enriched.totalActual != null ? (
        <p className="mt-1 text-sm text-slate-600">
          Actual value: {formatUsdWhole(enriched.totalActual)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Shared multi-PIN account rows for the post-search chooser and the dashboard
 * account-switcher modal. Parent owns heading / help copy.
 */
export function SitusMultiAccountChooserList({
  items,
  onSelectPin,
  selectDisabled = false,
  currentPin = null,
  rowHitTarget = false,
  glossaryIdPrefix,
}: SitusMultiAccountChooserListProps) {
  return (
    <ul className="space-y-2 text-sm text-slate-800 sm:text-base">
      {items.map((item) => {
        const { pin, label, enriched, envelope } = item;
        const isCurrent = currentPin != null && currentPin === pin;

        if (rowHitTarget) {
          if (isCurrent) {
            return (
              <li key={pin}>
                <div
                  className="rounded-md border border-indigo-300 bg-indigo-50/50 px-3 py-3"
                  aria-current="true"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <AccountRowBody
                      pin={pin}
                      label={label}
                      enriched={enriched}
                      envelope={envelope}
                      isCurrent
                      glossaryIdPrefix={glossaryIdPrefix}
                      allowGlossary
                      showViewingChip={false}
                    />
                    <p className="shrink-0 text-base font-semibold text-indigo-900 sm:text-right">
                      Currently viewing
                    </p>
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li
              key={pin}
              className="group relative rounded-md border border-slate-200 bg-white shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <button
                type="button"
                className="absolute inset-0 z-0 cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={selectDisabled}
                aria-label={accountRowSelectLabel(pin, enriched)}
                onClick={() => onSelectPin(pin)}
              />
              <div className="pointer-events-none relative z-[1] px-3 py-3">
                <AccountRowBody
                  pin={pin}
                  label={label}
                  enriched={enriched}
                  envelope={envelope}
                  isCurrent={false}
                  glossaryIdPrefix={glossaryIdPrefix}
                  allowGlossary
                  showViewingChip={false}
                  glossaryAboveRowHitTarget
                />
              </div>
            </li>
          );
        }

        return (
          <li
            key={pin}
            className={`rounded-md border px-3 py-3 ${
              isCurrent
                ? "border-indigo-300 bg-indigo-50/50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <AccountRowBody
                pin={pin}
                label={label}
                enriched={enriched}
                envelope={envelope}
                isCurrent={isCurrent}
                glossaryIdPrefix={glossaryIdPrefix}
                allowGlossary
                showViewingChip={isCurrent}
              />
              {isCurrent ? (
                <p className="shrink-0 text-base font-semibold text-indigo-900 sm:text-right">
                  Currently viewing
                </p>
              ) : (
                <button
                  type="button"
                  className={`${btnOutlinePrimaryMd} w-full shrink-0 cursor-pointer justify-center py-2.5 disabled:cursor-not-allowed sm:w-auto sm:px-4`}
                  disabled={selectDisabled}
                  onClick={() => onSelectPin(pin)}
                >
                  Use this property
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
