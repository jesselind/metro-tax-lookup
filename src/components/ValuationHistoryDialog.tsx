// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ModalPortal } from "@/components/ModalPortal";
import { ToolOutlinedToggleButton } from "@/components/ToolOutlinedToggleButton";
import { ValuationHistoryChart } from "@/components/ValuationHistoryChart";
import { ValuationHistoryTable } from "@/components/ValuationHistoryTable";
import {
  VALUATION_HISTORY_MODAL_LEAD,
  VALUATION_HISTORY_MODAL_TITLE_ACTUAL,
  VALUATION_HISTORY_MODAL_TITLE_ASSESSED,
  VALUATION_HISTORY_TABLE_HIDE,
  VALUATION_HISTORY_TABLE_SHOW,
  VALUATION_HISTORY_TAX_IMPACT_LEAD,
  VALUATION_HISTORY_TAX_IMPACT_LESS,
  VALUATION_HISTORY_TAX_IMPACT_MORE,
} from "@/content/valuationHistoryCopy";
import type { CountyValuationHistoryPoint } from "@/lib/countyValuationHistoryData";
import { formatCountyLevyMillsDisplay } from "@/lib/formatCountyLevyMills";
import { formatUsdWhole } from "@/lib/formatUsd";
import { levyYoYSurfaceClasses } from "@/lib/metroLevyYearOverYear";
import { TOOL_DISCLOSURE_ROW_ALIGN_CLASS } from "@/lib/toolFlowStyles";
import { useDialogFocusTrap } from "@/lib/useDialogFocusTrap";
import {
  buildValuationYoYSummary,
  valuationChartSeries,
  valuationYoYPairFromHistory,
  type ValuationValueKind,
} from "@/lib/valuationHistoryYoY";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";

export type ValuationHistoryDialogProps = {
  valueKind: ValuationValueKind;
  series: CountyValuationHistoryPoint[];
  currentValue: number;
  currentTaxYear: number | null;
  totalMills: number | null;
  onClose: () => void;
};

function modalTitle(kind: ValuationValueKind): string {
  return kind === "assessed"
    ? VALUATION_HISTORY_MODAL_TITLE_ASSESSED
    : VALUATION_HISTORY_MODAL_TITLE_ACTUAL;
}

function ValuationYoYYearCompare({
  previousYearLabel,
  currentYearLabel,
  priorValueLabel,
  currentValueLabel,
  differenceLabel,
  diffClassName,
}: {
  previousYearLabel: string;
  currentYearLabel: string;
  priorValueLabel: string;
  currentValueLabel: string;
  differenceLabel: string;
  diffClassName: string;
}) {
  const yearLabelClass =
    "text-sm font-semibold tracking-wide text-slate-600 sm:text-base";
  const valueClass =
    "mt-1 font-mono text-xl font-bold tabular-nums leading-snug text-slate-900 sm:text-2xl";
  const diffClass = `mt-2.5 rounded-md px-2.5 py-2 text-base font-bold tabular-nums leading-snug sm:px-3 sm:py-2.5 sm:text-lg ${diffClassName}`;

  return (
    <>
      <div className="mt-2 grid grid-cols-2 gap-x-3 sm:gap-x-4">
        <div className="min-w-0 border-r border-slate-300/80 pr-3 sm:pr-4">
          <p className={yearLabelClass}>{previousYearLabel}</p>
          <p className={valueClass}>{priorValueLabel}</p>
        </div>
        <div className="min-w-0">
          <p className={yearLabelClass}>{currentYearLabel}</p>
          <p className={valueClass}>{currentValueLabel}</p>
        </div>
      </div>
      <p className={diffClass}>Difference: {differenceLabel}</p>
    </>
  );
}

export function ValuationHistoryDialog({
  valueKind,
  series,
  currentValue,
  currentTaxYear,
  totalMills,
  onClose,
}: ValuationHistoryDialogProps) {
  const [showTable, setShowTable] = useState(false);
  const tableToggleId = useId();
  const tablePanelId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const tablePanelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useDialogFocusTrap(dialogRef);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!showTable) return;
    const el = tablePanelRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 0);
    return () => window.clearTimeout(t);
  }, [showTable]);

  const yoyPair = useMemo(
    () =>
      valuationYoYPairFromHistory(
        series,
        currentValue,
        currentTaxYear,
        valueKind,
      ),
    [series, currentValue, currentTaxYear, valueKind],
  );

  const yoySummary = useMemo(
    () => (yoyPair ? buildValuationYoYSummary(yoyPair, valueKind, totalMills) : null),
    [yoyPair, valueKind, totalMills],
  );

  const chartSeries = useMemo(
    () => valuationChartSeries(series, valueKind),
    [series, valueKind],
  );

  const yoySurface = levyYoYSurfaceClasses(yoySummary?.direction ?? "neutral");

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex min-h-[100dvh] w-full items-end justify-center sm:items-center sm:p-4">
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-0 min-h-[100dvh] bg-black/45"
          aria-label="Close valuation history"
          onClick={onClose}
        />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="valuation-history-dialog-heading"
          className="relative z-10 flex max-h-[min(90dvh,44rem)] w-full max-w-xl flex-col overflow-hidden rounded-t-lg border border-slate-200 bg-white shadow-2xl sm:rounded-lg"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
            <h3
              ref={titleRef}
              id="valuation-history-dialog-heading"
              tabIndex={0}
              className="pr-2 text-base font-semibold leading-snug text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-600/50 focus-visible:ring-offset-2 sm:text-lg"
            >
              {modalTitle(valueKind)}
            </h3>
            <p className="mt-1 text-sm leading-snug text-slate-700">
              {VALUATION_HISTORY_MODAL_LEAD}
            </p>

            {yoySummary ? (
              <div
                className={`mt-4 rounded-lg border-2 px-3 py-3 sm:px-4 sm:py-3.5 ${yoySurface.box}`}
                role="region"
                aria-labelledby="valuation-history-yoy-heading"
              >
                <p
                  id="valuation-history-yoy-heading"
                  className={`text-lg font-bold leading-snug tracking-tight text-balance sm:text-xl ${yoySurface.headline}`}
                >
                  {yoySummary.headline}
                </p>
                <ValuationYoYYearCompare
                  previousYearLabel={yoySummary.previousYearLabel}
                  currentYearLabel={yoySummary.currentYearLabel}
                  priorValueLabel={yoySummary.priorValueLabel}
                  currentValueLabel={yoySummary.currentValueLabel}
                  differenceLabel={yoySummary.differenceLabel}
                  diffClassName={yoySurface.diff}
                />
                {yoySummary.taxImpactDollars != null &&
                totalMills != null &&
                totalMills > 0 ? (
                  <p className="mt-3 text-sm font-medium leading-snug text-slate-800 sm:text-base">
                    {VALUATION_HISTORY_TAX_IMPACT_LEAD}{" "}
                    {formatUsdWhole(Math.abs(yoySummary.taxImpactDollars))}{" "}
                    {yoySummary.taxImpactDollars > 0
                      ? VALUATION_HISTORY_TAX_IMPACT_MORE
                      : VALUATION_HISTORY_TAX_IMPACT_LESS}{" "}
                    ({formatCountyLevyMillsDisplay(totalMills)} mills)
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3">
              <ValuationHistoryChart series={chartSeries} valueKind={valueKind} />
            </div>

            <div className={`mt-3 ${TOOL_DISCLOSURE_ROW_ALIGN_CLASS}`}>
              <ToolOutlinedToggleButton
                id={tableToggleId}
                aria-expanded={showTable}
                aria-controls={tablePanelId}
                onClick={() => setShowTable((open) => !open)}
              >
                {showTable
                  ? VALUATION_HISTORY_TABLE_HIDE
                  : VALUATION_HISTORY_TABLE_SHOW}
              </ToolOutlinedToggleButton>
            </div>
            <div
              id={tablePanelId}
              ref={tablePanelRef}
              hidden={!showTable}
              aria-labelledby={tableToggleId}
              className={showTable ? "mt-3" : undefined}
            >
              {showTable ? (
                <ValuationHistoryTable series={series} embedded />
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 px-4 py-3 sm:px-5">
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
