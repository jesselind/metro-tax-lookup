"use client";

// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ReactNode } from "react";
import {
  LEVY_CHANGED_BADGE_ON_LIGHT_CLASS,
  LevyChangedBadge,
} from "@/components/LevyChangedBadge";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import {
  VALUATION_HISTORY_ACTUAL_CHANGED_HIGHER_SR,
  VALUATION_HISTORY_ACTUAL_CHANGED_LOWER_SR,
  VALUATION_HISTORY_CHANGED_HIGHER_SR,
  VALUATION_HISTORY_CHANGED_LOWER_SR,
  VALUATION_HISTORY_OPEN_ARIA_ACTUAL,
  VALUATION_HISTORY_OPEN_ARIA_ASSESSED,
} from "@/content/valuationHistoryCopy";
import type { ParcelGlossaryTermId } from "@/content/termDefinitionBodies";
import {
  PARCEL_SUMMARY_TILE_BODY_CLASS,
  PARCEL_SUMMARY_TILE_LABEL_CLASS,
  PARCEL_SUMMARY_TILE_VALUE_CLASS,
  PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER,
} from "@/lib/toolFlowStyles";
import { formatUsdWhole } from "@/lib/formatUsd";
import type { ValuationValueKind } from "@/lib/valuationHistoryYoY";

export type ValuationValueSummaryTileProps = {
  valueKind: ValuationValueKind;
  termId: ParcelGlossaryTermId;
  textTrigger: string;
  textTriggerId: string;
  value: number;
  /** Signed dollar delta; null hides the Changed badge. */
  valueDelta: number | null;
  hasHistory: boolean;
  onOpen: () => void;
  tileId?: string;
  children?: ReactNode;
};

const OPEN_BTN_CLASS =
  "absolute inset-0 z-0 cursor-pointer rounded-[inherit] border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/35 focus-visible:ring-offset-2";

function openAriaLabel(
  valueKind: ValuationValueKind,
  formattedValue: string,
  valueDelta: number | null,
): string {
  const base =
    valueKind === "assessed"
      ? VALUATION_HISTORY_OPEN_ARIA_ASSESSED
      : VALUATION_HISTORY_OPEN_ARIA_ACTUAL;
  const parts = [`${base} ${formattedValue}.`];
  if (valueDelta != null && valueDelta > 0) {
    parts.push(
      valueKind === "assessed"
        ? VALUATION_HISTORY_CHANGED_HIGHER_SR
        : VALUATION_HISTORY_ACTUAL_CHANGED_HIGHER_SR,
    );
  } else if (valueDelta != null && valueDelta < 0) {
    parts.push(
      valueKind === "assessed"
        ? VALUATION_HISTORY_CHANGED_LOWER_SR
        : VALUATION_HISTORY_ACTUAL_CHANGED_LOWER_SR,
    );
  }
  return parts.join(" ");
}

export function ValuationValueSummaryTile({
  valueKind,
  termId,
  textTrigger,
  textTriggerId,
  value,
  valueDelta,
  hasHistory,
  onOpen,
  tileId,
  children,
}: ValuationValueSummaryTileProps) {
  const formattedValue = formatUsdWhole(value);
  const interactive = hasHistory;

  return (
    <div
      className={`${PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER}${
        interactive
          ? " relative transition-colors hover:border-slate-400 hover:bg-slate-50"
          : ""
      }`}
      id={tileId}
    >
      {interactive ? (
        <button
          type="button"
          className={OPEN_BTN_CLASS}
          aria-label={openAriaLabel(valueKind, formattedValue, valueDelta)}
          onClick={onOpen}
        />
      ) : null}
      <div
        className={`${PARCEL_SUMMARY_TILE_BODY_CLASS}${
          interactive ? " pointer-events-none relative z-[1]" : ""
        }`}
      >
        <div
          className={`${PARCEL_SUMMARY_TILE_LABEL_CLASS}${
            interactive ? " pointer-events-auto" : ""
          }`}
        >
          <ParcelGlossaryPopoverTrigger
            termId={termId}
            textTrigger={textTrigger}
            textTriggerId={textTriggerId}
          />
        </div>
        <p className={PARCEL_SUMMARY_TILE_VALUE_CLASS}>{formattedValue}</p>
        {valueDelta != null ? (
          <span aria-hidden>
            <LevyChangedBadge
              millsDelta={valueDelta}
              className={LEVY_CHANGED_BADGE_ON_LIGHT_CLASS}
            />
          </span>
        ) : null}
        {children != null ? (
          <span className={interactive ? "pointer-events-auto" : undefined}>
            {children}
          </span>
        ) : null}
      </div>
    </div>
  );
}
