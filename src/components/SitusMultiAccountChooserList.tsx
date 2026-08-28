// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { CountyScopeTopLine } from "@/components/CountyScopeTopLine";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import { SitusEnvelopeAddress } from "@/components/SitusEnvelopeAddress";
import type { SitusEnvelopeDisplayRow } from "@/lib/addressLabelDifference";
import { formatUsdWhole } from "@/lib/formatUsd";
import type { EnrichedSitusPinHit } from "@/lib/situsMultiPinChooser";
import { TERM_LINK_CLASS } from "@/lib/toolFlowStyles";

export type SitusMultiAccountChooserItem = {
  pin: string;
  label: string;
  enriched: EnrichedSitusPinHit | null;
  envelope: SitusEnvelopeDisplayRow | null;
  /** Resolved county for multi-county address / account lookup rows. */
  countyId?: string | null;
};

export type SitusMultiAccountChooserListProps = {
  items: SitusMultiAccountChooserItem[];
  onSelectPin: (pin: string) => void;
  selectDisabled?: boolean;
  /** When set, that row is marked as the account already on the dashboard. */
  currentPin?: string | null;
  /**
   * Accessible name verb for selectable rows: post-search chooser vs dashboard
   * switcher (`Use this property` vs `Switch to`).
   */
  selectMode?: "choose" | "switch";
};

/**
 * Shared Real vs business personal property glossary control for multi-PIN
 * chooser and dashboard switcher (one popover; not on each account row).
 */
export function SitusRealVsBusinessPersonalHelp({
  idPrefix,
}: {
  idPrefix: string;
}) {
  return (
    <p className="text-sm text-slate-700 sm:text-base">
      <ParcelGlossaryPopoverTrigger
        termId="term-real-vs-business-personal"
        textTrigger="What is real property vs. business personal property?"
        textTriggerId={`${idPrefix}-real-vs-business-personal-help`}
        variant="parcel-record"
        textTriggerClassName={TERM_LINK_CLASS}
      />
    </p>
  );
}

/** Accessible name for a full-row account control. */
function accountRowSelectLabel(
  pin: string,
  enriched: EnrichedSitusPinHit | null,
  selectMode: "choose" | "switch",
): string {
  const kind = enriched?.accountKindLabel?.trim() || null;
  const owner = enriched?.ownerList?.trim() || null;
  const detail =
    owner && kind
      ? `${kind}, ${owner}. PIN ${pin}.`
      : kind
        ? `${kind}. PIN ${pin}.`
        : owner
          ? `${owner}. PIN ${pin}.`
          : `PIN ${pin}.`;
  return selectMode === "switch"
    ? `Switch to ${detail}`
    : `Use this property. ${detail}`;
}

type RowBodyProps = {
  pin: string;
  label: string;
  enriched: EnrichedSitusPinHit | null;
  envelope: SitusEnvelopeDisplayRow | null;
  countyId?: string | null;
  isCurrent: boolean;
  showViewingChip: boolean;
};

function AccountRowBody({
  pin,
  label,
  enriched,
  envelope,
  countyId,
  isCurrent,
  showViewingChip,
}: RowBodyProps) {
  const kindLabel = enriched?.accountKindLabel ?? null;

  return (
    <div className="min-w-0">
      <CountyScopeTopLine countyId={countyId} className="mb-1" />
      {kindLabel != null ? (
        <p className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
          {kindLabel}
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
            kindLabel != null || (showViewingChip && isCurrent) ? "mt-1" : ""
          }`}
        >
          {enriched.ownerList}
        </p>
      ) : null}
      <p
        className={`text-sm text-slate-600 ${
          kindLabel != null ||
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
 * account-switcher modal. Whole row is the hit target. Parent owns heading /
 * help copy ({@link SitusRealVsBusinessPersonalHelp}).
 */
export function SitusMultiAccountChooserList({
  items,
  onSelectPin,
  selectDisabled = false,
  currentPin = null,
  selectMode = "choose",
}: SitusMultiAccountChooserListProps) {
  return (
    <ul className="space-y-2 text-sm text-slate-800 sm:text-base">
      {items.map((item) => {
        const { pin, label, enriched, envelope, countyId } = item;
        const isCurrent = currentPin != null && currentPin === pin;

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
                    countyId={countyId}
                    isCurrent
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
              aria-label={accountRowSelectLabel(pin, enriched, selectMode)}
              onClick={() => onSelectPin(pin)}
            />
            <div className="pointer-events-none relative z-[1] px-3 py-3">
              <AccountRowBody
                pin={pin}
                label={label}
                enriched={enriched}
                envelope={envelope}
                countyId={countyId}
                isCurrent={false}
                showViewingChip={false}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
