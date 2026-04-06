"use client";

import { Fragment, useMemo, useState } from "react";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import { calculateSharePercentage } from "@/lib/levyCalculator";
import type {
  LevyDataFile,
  LevyDistrictFromJson,
  LevyLineFromJson,
  MetroDistrictOption,
} from "@/lib/levyTypes";
import levyData from "../../public/data/metro-levies-2025.json";
import { HelpPillButton } from "@/components/HelpPillButton";
import { LevyLinesCard } from "@/components/LevyLinesCard";
import {
  ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB as ASSESSOR_MILL_LEVIES_HUB_URL,
  ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF as MILL_LEVY_PUBLIC_INFO_FORM_PDF_URL,
} from "@/lib/arapahoeCountyUrls";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";
import type { MetroFromLevyStack } from "@/lib/metroDistrictFromLevyLines";
import { COLORADO_SPECIAL_DISTRICTS_MAP_URL } from "@/lib/dataSourceUrls";
import {
  buildMetroLevyBarSegments,
  isMetroLevyDebtService,
  metroBarSegmentColorClass,
  metroBarSegmentPurposeSwatchClass,
  metroBarSegmentDisplayLabel,
  metroPurposeCategoryHintForSegment,
  type MetroLevyBarSegment,
} from "@/lib/metroLevyBarSegments";

/** JSON stores mill rate (decimal, e.g. 0.0634); county and inputs use mills (e.g. 63.4). */
const RATE_TO_MILLS = 1000;

/** Ignore float drift when comparing levy line sums to certified totals. */
const MILLS_ROUND_EPS = 0.0005;

function formatMillsDisplay(value: number): string {
  return Math.round(value * 1000) / 1000 === value
    ? String(value)
    : value.toFixed(3);
}

type MetroDistrictBundle = {
  districtId: string;
  name: string;
  totalDistrictMills: number;
  metroBarSegments: MetroLevyBarSegment[];
  sumMetroLineMills: number;
  metroDebtMills: number;
  metroDebtMillsFromAggregates: number;
  fullDistrict: LevyDistrictFromJson | undefined;
  metroDebtLevies: LevyLineFromJson[];
  metroOpsLevies: LevyLineFromJson[];
  metroOtherLevies: LevyLineFromJson[];
  lineSumMatchesCertified: boolean;
  pickerDebtMatchesAggregate: boolean;
};

function allocatedMillsForSegment(
  b: MetroDistrictBundle,
  seg: MetroLevyBarSegment,
): number {
  if (b.sumMetroLineMills <= 0) return 0;
  return b.totalDistrictMills * (seg.mills / b.sumMetroLineMills);
}

function segmentBarWidthPercent(
  totalMills: number,
  b: MetroDistrictBundle,
  seg: MetroLevyBarSegment,
): number {
  if (totalMills <= 0 || b.sumMetroLineMills <= 0) return 0;
  return (
    (b.totalDistrictMills / totalMills) *
    (seg.mills / b.sumMetroLineMills) *
    100
  );
}

function stackWidthOtherPercentForBundle(
  totalMills: number,
  b: MetroDistrictBundle,
): number {
  if (totalMills <= 0) return 0;
  const segmentsTotal = b.metroBarSegments.reduce(
    (s, seg) => s + segmentBarWidthPercent(totalMills, b, seg),
    0,
  );
  return Math.max(0, 100 - segmentsTotal);
}

/** Debt-related mills for a district, scaled from levy lines to certified total. */
function debtMillsAllocatedForBundle(b: MetroDistrictBundle): number {
  if (b.sumMetroLineMills <= 0) return 0;
  const debtLineMillsSum = b.metroBarSegments.reduce(
    (s, seg) => s + (isMetroLevyDebtService(seg) ? seg.mills : 0),
    0,
  );
  return b.totalDistrictMills * (debtLineMillsSum / b.sumMetroLineMills);
}

function formatDistrictNamesList(names: string[]): string {
  if (names.length === 0) return "your metro district";
  if (names.length === 1) return names[0] ?? "";
  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export type MetroTaxShareFlowProps = {
  idPrefix?: string;
  /** Sum of mills from the levy stack (home page); drives all metro share math. */
  prefillTotalMills?: number | null;
  metroFromLevyStack?: MetroFromLevyStack;
};

export function MetroTaxShareFlow({
  idPrefix = "",
  prefillTotalMills = null,
  metroFromLevyStack,
}: MetroTaxShareFlowProps) {
  const p = idPrefix ? `${idPrefix}-` : "";
  const flowHeadingId = `${p}flow-heading`;

  const [showResultDetails, setShowResultDetails] = useState(false);

  const levyJson = levyData as LevyDataFile;
  const bundledAsOfIso = levyJson.snapshot?.bundledAsOf;
  const bundledAsOfLabel = bundledAsOfIso
    ? formatLevyBundledAsOf(bundledAsOfIso)
    : null;

  const metroOptions: MetroDistrictOption[] = useMemo(
    () =>
      levyJson.districts
        .filter((d: LevyDistrictFromJson) => d.type === "metro")
        .map((d: LevyDistrictFromJson) => ({
          id: d.districtId,
          name: d.name,
          debtMills: d.aggregates?.debtMills ?? 0,
          totalMills: d.aggregates?.totalMills ?? 0,
        }))
        .sort((a: MetroDistrictOption, b: MetroDistrictOption) =>
          a.name.localeCompare(b.name),
        ),
    [levyJson.districts],
  );

  const metroDistrictIdSet = useMemo(
    () => new Set(metroOptions.map((m) => m.id)),
    [metroOptions],
  );

  const activeDistrictIds = useMemo(() => {
    if (metroFromLevyStack?.kind === "match") {
      return metroFromLevyStack.districtIds.filter((id) =>
        metroDistrictIdSet.has(id),
      );
    }
    return [];
  }, [metroFromLevyStack, metroDistrictIdSet]);

  const totalMills =
    prefillTotalMills != null && prefillTotalMills > 0 ? prefillTotalMills : 0;

  const perDistrictBundles = useMemo((): MetroDistrictBundle[] => {
    return activeDistrictIds.map((districtId) => {
      const selectedDistrict = metroOptions.find((m) => m.id === districtId);
      const metroDebtMills = selectedDistrict
        ? selectedDistrict.debtMills * RATE_TO_MILLS
        : 0;
      const totalDistrictMills = selectedDistrict
        ? selectedDistrict.totalMills * RATE_TO_MILLS
        : 0;
      const fullDistrict = levyJson.districts.find(
        (d) => d.districtId === districtId,
      );
      const metroLevies = fullDistrict?.levies ?? [];
      const metroDebtLevies = metroLevies.filter(
        (l) => l.purposeCategory === "debt_service",
      );
      const metroOpsLevies = metroLevies
        .filter((l) => l.purposeCategory === "operations")
        .slice()
        .sort((a, b) => (b.rateMillsCurrent ?? 0) - (a.rateMillsCurrent ?? 0));
      const metroOtherLevies = metroLevies
        .filter((l) => l.purposeCategory === "other")
        .slice()
        .sort((a, b) => (b.rateMillsCurrent ?? 0) - (a.rateMillsCurrent ?? 0));
      const metroDebtMillsFromAggregates =
        fullDistrict?.aggregates?.debtMills != null
          ? fullDistrict.aggregates.debtMills * RATE_TO_MILLS
          : 0;

      let metroBarSegments = buildMetroLevyBarSegments(
        metroLevies,
        RATE_TO_MILLS,
      );
      if (metroBarSegments.length === 0) {
        if (totalDistrictMills > 0 && districtId.length > 0) {
          metroBarSegments = [
            {
              key: `certified-fallback-${districtId}`,
              label: "Certified total",
              mills: totalDistrictMills,
              purposeCategory: "other",
              rawRowIndex: -1,
            },
          ];
        }
      }

      const sumMetroLineMills = metroBarSegments.reduce(
        (s, seg) => s + seg.mills,
        0,
      );
      const lineSumMatchesCertified =
        totalDistrictMills <= 0 ||
        Math.abs(sumMetroLineMills - totalDistrictMills) < MILLS_ROUND_EPS;
      const pickerDebtMatchesAggregate =
        Math.abs(metroDebtMills - metroDebtMillsFromAggregates) <
        MILLS_ROUND_EPS;

      return {
        districtId,
        name: selectedDistrict?.name ?? districtId,
        totalDistrictMills,
        metroBarSegments,
        sumMetroLineMills,
        metroDebtMills,
        metroDebtMillsFromAggregates,
        fullDistrict,
        metroDebtLevies,
        metroOpsLevies,
        metroOtherLevies,
        lineSumMatchesCertified,
        pickerDebtMatchesAggregate,
      };
    });
  }, [activeDistrictIds, metroOptions, levyJson.districts]);

  const totalDistrictMillsCombined = useMemo(
    () =>
      perDistrictBundles.reduce((s, b) => s + b.totalDistrictMills, 0),
    [perDistrictBundles],
  );

  const { percentage: totalDistrictShare } = calculateSharePercentage(
    totalMills,
    totalDistrictMillsCombined,
  );

  const showResultCard = totalMills > 0 && activeDistrictIds.length > 0;

  const otherMillsForStack =
    totalMills > 0
      ? Math.max(0, totalMills - totalDistrictMillsCombined)
      : 0;
  const { percentage: shareOtherOfTotal } = calculateSharePercentage(
    totalMills,
    otherMillsForStack,
  );

  const { debtShareOfTotal, showDebtHeadline } = useMemo(() => {
    if (totalMills <= 0) {
      return { debtShareOfTotal: 0, showDebtHeadline: false };
    }
    const combinedDebt = perDistrictBundles.reduce(
      (s, b) => s + debtMillsAllocatedForBundle(b),
      0,
    );
    if (combinedDebt <= MILLS_ROUND_EPS) {
      return { debtShareOfTotal: 0, showDebtHeadline: false };
    }
    const { percentage } = calculateSharePercentage(totalMills, combinedDebt);
    return { debtShareOfTotal: percentage, showDebtHeadline: true };
  }, [perDistrictBundles, totalMills]);

  const taxRateSplitAnnouncement = useMemo(() => {
    if (totalMills <= 0) {
      return `Split of your total property tax rate: ${shareOtherOfTotal.toFixed(1)} percent other local districts and taxes.`;
    }
    const metroParts: string[] = [];
    for (const b of perDistrictBundles) {
      if (b.metroBarSegments.length === 0) continue;
      const prefix =
        perDistrictBundles.length > 1 ? `${b.name}: ` : "";
      for (const seg of b.metroBarSegments) {
        const allocated = allocatedMillsForSegment(b, seg);
        const { percentage } = calculateSharePercentage(totalMills, allocated);
        metroParts.push(
          `${percentage.toFixed(1)}% ${prefix}${metroBarSegmentDisplayLabel(seg)}`,
        );
      }
    }
    if (metroParts.length === 0) {
      return `Split of your total property tax rate: ${shareOtherOfTotal.toFixed(1)} percent other local districts and taxes.`;
    }
    const cap = 8;
    const shown =
      metroParts.length > cap
        ? `${metroParts.slice(0, cap).join(", ")}, and ${metroParts.length - cap} more parts of your metro rates`
        : metroParts.join(", ");
    return `Split of your total property tax rate: ${shown}; ${shareOtherOfTotal.toFixed(1)} percent other local districts and taxes.`;
  }, [totalMills, perDistrictBundles, shareOtherOfTotal]);

  const multiMetroParcel =
    metroFromLevyStack?.kind === "match" && activeDistrictIds.length > 1;

  /** Stack order: each district's bar segments, for one combined bar + legend when multi-metro. */
  const combinedMetroBarRows = useMemo(() => {
    const rows: {
      b: MetroDistrictBundle;
      seg: MetroLevyBarSegment;
      flatIndex: number;
    }[] = [];
    let flatIndex = 0;
    for (const b of perDistrictBundles) {
      for (const seg of b.metroBarSegments) {
        rows.push({ b, seg, flatIndex: flatIndex++ });
      }
    }
    return rows;
  }, [perDistrictBundles]);

  const combinedBarOtherPercent =
    totalMills > 0
      ? Math.max(0, (otherMillsForStack / totalMills) * 100)
      : 0;

  let resultAnnouncement = "";
  if (showResultCard) {
    const metroLabel = multiMetroParcel
      ? "your metro districts"
      : "your metro district";
    const debtMetroLabel = multiMetroParcel
      ? "your metro districts'"
      : "your metro district's";
    const totalLine =
      totalMills > 0
        ? ` Total mills from levy stack ${formatMillsDisplay(totalMills)}.`
        : "";
    resultAnnouncement =
      totalDistrictShare > 0
        ? `${totalDistrictShare.toFixed(1)} percent of your property taxes go to ${metroLabel}.${totalLine}${
            showDebtHeadline
              ? ` ${debtShareOfTotal.toFixed(1)} percent of your property taxes are paying off ${debtMetroLabel} debt.`
              : ""
          } ${taxRateSplitAnnouncement}`
        : `No metro district mills shown in your property tax rate.${totalLine} ${taxRateSplitAnnouncement}`;
  } else if (totalMills > 0 && activeDistrictIds.length === 0) {
    resultAnnouncement =
      "No metro districts were matched from your levy stack for this card.";
  }

  const isNoAutoMatch = metroFromLevyStack?.kind === "no_metro_lgid_match";

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {resultAnnouncement}
      </div>
      <section aria-labelledby={flowHeadingId} className="">
        <h2 id={flowHeadingId} className="sr-only">
          Metro district tax share
        </h2>

        <div className="space-y-3 sm:space-y-4">
        {showResultCard ? (
          <div
            role="region"
            aria-label="Metro district share"
            className="min-w-0"
          >
              <div
                className={
                  showDebtHeadline
                    ? "grid gap-4 sm:grid-cols-2 sm:gap-6"
                    : ""
                }
              >
                <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-100 px-3 py-4 shadow-md sm:px-5 sm:py-5">
                  <p className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                    {totalDistrictShare.toFixed(1)}%
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600 sm:text-base">
                    {totalDistrictShare > 0
                      ? multiMetroParcel
                        ? "of your property taxes go to your metro districts (combined)"
                        : "of your property taxes go to your metro district"
                      : "No metro district mills shown in your property tax rate"}
                  </p>
                </div>
                {showDebtHeadline ? (
                  <div
                    className="min-w-0 rounded-xl border border-red-800 bg-red-700 px-3 py-4 text-white shadow-md sm:px-5 sm:py-5"
                    role="group"
                    aria-label="Share of your taxes paying metro district debt"
                  >
                    <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                      {debtShareOfTotal.toFixed(1)}%
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white sm:text-base">
                      {multiMetroParcel
                        ? "of your property taxes are paying off metro district debt (combined)"
                        : "of your property taxes are paying off your metro district's debt"}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="mt-5 space-y-3">
                <p
                  id={`${p}tax-rate-split-heading`}
                  className="text-sm font-semibold text-slate-900 sm:text-base"
                >
                  Your total property tax rate
                </p>
                <p id={`${p}tax-rate-split-desc`} className="sr-only">
                  {taxRateSplitAnnouncement} Percentages are shares of your total
                  mill rate. Levy names match the Mill levy name or purpose column
                  on the county form.
                </p>
                <div className={multiMetroParcel ? "space-y-2" : "space-y-5"}>
                  {multiMetroParcel ? (
                    <div className="space-y-2">
                      <div
                        className="h-5 w-full overflow-hidden rounded-full border border-slate-300 bg-slate-100 shadow-inner"
                        aria-hidden="true"
                      >
                        <div className="flex h-full w-full">
                          {combinedMetroBarRows.map(({ b, seg, flatIndex }) => {
                            const w = segmentBarWidthPercent(
                              totalMills,
                              b,
                              seg,
                            );
                            return w > 0 ? (
                              <div
                                key={`${b.districtId}-${seg.key}`}
                                className={`h-full min-w-0 ${metroBarSegmentColorClass(flatIndex)}`}
                                style={{ width: `${w}%` }}
                              />
                            ) : null;
                          })}
                          {combinedBarOtherPercent > 0 ? (
                            <div
                              className="h-full min-w-0 bg-slate-300"
                              style={{
                                width: `${combinedBarOtherPercent}%`,
                              }}
                            />
                          ) : null}
                        </div>
                      </div>
                      <ul
                        className="space-y-2.5 text-sm text-slate-800 sm:text-base"
                        aria-labelledby={`${p}tax-rate-split-heading`}
                        aria-describedby={`${p}tax-rate-split-desc`}
                      >
                        {combinedMetroBarRows.map(({ b, seg, flatIndex }) => {
                          const { percentage } = calculateSharePercentage(
                            totalMills,
                            allocatedMillsForSegment(b, seg),
                          );
                          const debtService = isMetroLevyDebtService(seg);
                          return (
                            <li
                              key={`${b.districtId}-${seg.key}`}
                              className="flex items-start justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex gap-2">
                                  <span
                                    className={`mt-1 h-3 w-3 shrink-0 rounded-sm ${metroBarSegmentColorClass(flatIndex)}`}
                                    aria-hidden="true"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold leading-snug text-slate-700 sm:text-sm">
                                      {b.name}
                                    </p>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                                      <span className="font-medium text-slate-900">
                                        {metroBarSegmentDisplayLabel(seg)}
                                      </span>
                                      {debtService ? (
                                        <span className="inline-flex min-h-5 max-w-[min(100%,14rem)] shrink-0 items-center justify-center rounded bg-red-700 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase leading-tight tracking-wide text-white shadow-sm sm:text-[0.65rem]">
                                          Debt passed on to you
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="mt-0.5 text-xs font-normal leading-snug text-slate-600 sm:text-sm">
                                      {metroPurposeCategoryHintForSegment(seg)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                                {percentage.toFixed(1)}%
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    perDistrictBundles.map((b) => {
                      const barOtherPct = stackWidthOtherPercentForBundle(
                        totalMills,
                        b,
                      );
                      return (
                        <div key={b.districtId} className="space-y-2">
                          <div
                            className="h-5 w-full overflow-hidden rounded-full border border-slate-300 bg-slate-100 shadow-inner"
                            aria-hidden="true"
                          >
                            <div className="flex h-full w-full">
                              {b.metroBarSegments.map((seg, i) => {
                                const w = segmentBarWidthPercent(
                                  totalMills,
                                  b,
                                  seg,
                                );
                                return w > 0 ? (
                                  <div
                                    key={seg.key}
                                    className={`h-full min-w-0 ${metroBarSegmentPurposeSwatchClass(seg, i)}`}
                                    style={{ width: `${w}%` }}
                                  />
                                ) : null;
                              })}
                              {barOtherPct > 0 ? (
                                <div
                                  className="h-full min-w-0 bg-slate-300"
                                  style={{
                                    width: `${barOtherPct}%`,
                                  }}
                                />
                              ) : null}
                            </div>
                          </div>
                          <ul
                            className="space-y-2.5 text-sm text-slate-800 sm:text-base"
                            aria-labelledby={`${p}tax-rate-split-heading`}
                            aria-describedby={`${p}tax-rate-split-desc`}
                          >
                            {b.metroBarSegments.map((seg, i) => {
                              const { percentage } = calculateSharePercentage(
                                totalMills,
                                allocatedMillsForSegment(b, seg),
                              );
                              const debtService = isMetroLevyDebtService(seg);
                              return (
                                <li
                                  key={seg.key}
                                  className="flex items-start justify-between gap-3"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex gap-2">
                                      <span
                                        className={`mt-1 h-3 w-3 shrink-0 rounded-sm ${metroBarSegmentPurposeSwatchClass(seg, i)}`}
                                        aria-hidden="true"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                          <span className="font-medium text-slate-900">
                                            {metroBarSegmentDisplayLabel(seg)}
                                          </span>
                                          {debtService ? (
                                            <span className="inline-flex min-h-5 max-w-[min(100%,14rem)] shrink-0 items-center justify-center rounded bg-red-700 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase leading-tight tracking-wide text-white shadow-sm sm:text-[0.65rem]">
                                              Debt passed on to you
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="mt-0.5 text-xs font-normal leading-snug text-slate-600 sm:text-sm">
                                          {metroPurposeCategoryHintForSegment(
                                            seg,
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                                    {percentage.toFixed(1)}%
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </div>
                <ul
                  className="mt-3 space-y-2.5 text-sm text-slate-800 sm:text-base"
                  aria-labelledby={`${p}tax-rate-split-heading`}
                  aria-describedby={`${p}tax-rate-split-desc`}
                >
                  <li className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-2">
                        <span
                          className="mt-1 h-3 w-3 shrink-0 rounded-sm bg-slate-300"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              Everything else
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs font-normal leading-snug text-slate-600 sm:text-sm">
                            Schools, county, city, and other local districts
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                      {shareOtherOfTotal.toFixed(1)}%
                    </span>
                  </li>
                </ul>
              </div>
              {perDistrictBundles.length > 0 ? (
                <>
                  {showResultDetails ? (
                    <div className="mt-4 space-y-6 text-sm text-slate-800 sm:text-base">
                      <div className="space-y-3 border-t border-slate-200 pt-4">
                        <div>
                          <p className="font-semibold text-indigo-950">
                            Check the math
                          </p>
                          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                            {multiMetroParcel ? (
                              <>
                                County mill levy file for{" "}
                                {formatDistrictNamesList(
                                  perDistrictBundles.map((x) => x.name),
                                )}
                                . Each district below has its own certified total.
                                Official PDF and related county links are at the
                                bottom of this section.
                              </>
                            ) : (
                              <>
                                County file for{" "}
                                <span className="font-medium text-slate-900">
                                  {perDistrictBundles[0]?.name}
                                </span>
                                . Metro debt mills here match the{" "}
                                <strong>debt mills</strong> value for this
                                district in the bundled county file (to three decimals:{" "}
                                <span className="font-mono">
                                  {perDistrictBundles[0]?.metroDebtMills.toFixed(
                                    3,
                                  )}
                                </span>
                                ). Official PDF and related county links are at
                                the bottom of this section.
                              </>
                            )}
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[280px] border-collapse text-left text-xs sm:text-sm">
                            <caption className="sr-only">
                              Mill rates used in this result
                            </caption>
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-600">
                                <th
                                  scope="col"
                                  className="py-1.5 pr-3 font-medium"
                                >
                                  Item
                                </th>
                                <th
                                  scope="col"
                                  className="py-1.5 text-right font-medium tabular-nums"
                                >
                                  Mills
                                </th>
                              </tr>
                            </thead>
                            <tbody className="font-mono text-slate-800">
                              <tr className="border-b border-slate-100">
                                <td className="py-2 pr-3 align-top text-[0.7rem] text-slate-700 sm:text-xs">
                                  Your total property tax mills
                                </td>
                                <td className="py-2 text-right tabular-nums">
                                  {totalMills.toFixed(3)}
                                </td>
                              </tr>
                              {perDistrictBundles.map((b) => (
                                <Fragment key={`math-block-${b.districtId}`}>
                                  {multiMetroParcel ? (
                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                      <td
                                        colSpan={2}
                                        className="py-2 pr-3 align-top text-[0.7rem] font-sans font-semibold text-slate-800 sm:text-xs"
                                      >
                                        {b.name}
                                      </td>
                                    </tr>
                                  ) : null}
                                  {b.metroBarSegments.map((seg) => (
                                    <tr
                                      key={`math-${b.districtId}-${seg.key}`}
                                      className="border-b border-slate-100"
                                    >
                                      <td className="py-2 pr-3 align-top text-[0.7rem] font-sans text-slate-700 sm:text-xs">
                                        {metroBarSegmentDisplayLabel(seg)}
                                      </td>
                                      <td className="py-2 text-right tabular-nums">
                                        {seg.mills.toFixed(3)}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="border-b border-slate-100">
                                    <td className="py-2 pr-3 align-top text-[0.7rem] text-slate-700 sm:text-xs">
                                      {multiMetroParcel
                                        ? `Metro total (certified), ${b.name}`
                                        : "Metro total (county certified)"}
                                    </td>
                                    <td className="py-2 text-right tabular-nums">
                                      {b.totalDistrictMills.toFixed(3)}
                                    </td>
                                  </tr>
                                </Fragment>
                              ))}
                              <tr>
                                <td className="py-2 pr-3 align-top text-[0.7rem] text-slate-700 sm:text-xs">
                                  Everything else (rest of your bill)
                                </td>
                                <td className="py-2 text-right tabular-nums">
                                  {otherMillsForStack.toFixed(3)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-800 sm:text-sm">
                            Shares of your total mills
                          </p>
                          {totalMills > 0 ? (
                            <div className="space-y-1.5 font-mono text-[0.7rem] leading-snug text-slate-700 sm:text-xs">
                              {perDistrictBundles.map((b) =>
                                b.metroBarSegments.map((seg) => {
                                  const alloc = allocatedMillsForSegment(
                                    b,
                                    seg,
                                  );
                                  const { percentage } =
                                    calculateSharePercentage(
                                      totalMills,
                                      alloc,
                                    );
                                  return (
                                    <p
                                      key={`share-${b.districtId}-${seg.key}`}
                                    >
                                      {multiMetroParcel ? `${b.name}: ` : ""}
                                      {metroBarSegmentDisplayLabel(seg)} share ={" "}
                                      {alloc.toFixed(3)} /{" "}
                                      {totalMills.toFixed(3)} ={" "}
                                      {percentage.toFixed(1)}%
                                    </p>
                                  );
                                }),
                              )}
                              <p>
                                Metro total share (headline) ={" "}
                                {totalDistrictMillsCombined.toFixed(3)} /{" "}
                                {totalMills.toFixed(3)} ={" "}
                                {totalDistrictShare.toFixed(1)}%
                              </p>
                              <p>
                                Everything else share ={" "}
                                {otherMillsForStack.toFixed(3)} /{" "}
                                {totalMills.toFixed(3)} ={" "}
                                {shareOtherOfTotal.toFixed(1)}%
                              </p>
                            </div>
                          ) : null}
                          {perDistrictBundles.map((b) => (
                            <Fragment key={`check-${b.districtId}`}>
                              {b.totalDistrictMills > 0 ? (
                                <p
                                  className={
                                    b.lineSumMatchesCertified
                                      ? "text-xs text-slate-600 sm:text-sm"
                                      : "text-xs text-amber-900 sm:text-sm"
                                  }
                                >
                                  {b.lineSumMatchesCertified
                                    ? `County check (${b.name}): sum of metro levy mills (${b.sumMetroLineMills.toFixed(3)}) matches certified metro total (${b.totalDistrictMills.toFixed(3)}).`
                                    : `County data note (${b.name}): sum of metro levy mills (${b.sumMetroLineMills.toFixed(3)}) does not match certified metro total (${b.totalDistrictMills.toFixed(3)}). Bar widths scale each metro levy to the certified total; the headline uses the certified total.`}
                                </p>
                              ) : null}
                              {!b.pickerDebtMatchesAggregate &&
                              b.totalDistrictMills > 0 ? (
                                <p className="text-xs text-amber-900 sm:text-sm">
                                  Debt mills on the bundled metro row for {b.name} (
                                  {b.metroDebtMills.toFixed(3)}) differ slightly
                                  from the county file debt aggregate (
                                  {b.metroDebtMillsFromAggregates.toFixed(3)}).
                                </p>
                              ) : null}
                            </Fragment>
                          ))}
                        </div>
                      </div>
                      {perDistrictBundles.map((b) => (
                        <div
                          key={`levy-cards-${b.districtId}`}
                          className="space-y-4 border-t border-slate-200 pt-4"
                        >
                          {multiMetroParcel ? (
                            <p className="text-sm font-semibold text-slate-900 sm:text-base">
                              {b.name}: levy lines from the county form
                            </p>
                          ) : null}
                          <LevyLinesCard
                            title="Debt service lines"
                            description="Bonds and other debt line items from the county form."
                            levies={b.metroDebtLevies}
                            rateToMills={RATE_TO_MILLS}
                            tone="debt"
                            showAllLines
                          />
                          <LevyLinesCard
                            title="Operations lines"
                            description="Ongoing services and administration lines from the county form."
                            levies={b.metroOpsLevies}
                            rateToMills={RATE_TO_MILLS}
                            showAllLines
                          />
                          <LevyLinesCard
                            title="Other purposes"
                            description="Parts of the rate not classified as operations or debt (for example summary totals)."
                            levies={b.metroOtherLevies}
                            rateToMills={RATE_TO_MILLS}
                            showAllLines
                          />
                        </div>
                      ))}
                      <p className="text-[0.7rem] text-slate-500 sm:text-xs">
                        Based on Arapahoe County&apos;s{" "}
                        <a
                          href={MILL_LEVY_PUBLIC_INFO_FORM_PDF_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={COUNTY_EXTERNAL_LINK_CLASS}
                        >
                          Mill Levy Public Information Form
                          <span className="sr-only">
                            {" "}
                            (opens in a new tab)
                          </span>
                        </a>{" "}
                        (PDF) for tax year {levyJson.year}
                        {bundledAsOfLabel && bundledAsOfIso ? (
                          <>
                            ; snapshot bundled{" "}
                            <time dateTime={bundledAsOfIso}>
                              {bundledAsOfLabel}
                            </time>
                          </>
                        ) : null}
                        .{" "}
                        {levyJson.source?.title
                          ? `Full citation: ${levyJson.source.title}. `
                          : null}
                        More levy PDFs:{" "}
                        <a
                          href={ASSESSOR_MILL_LEVIES_HUB_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={COUNTY_EXTERNAL_LINK_CLASS}
                        >
                          Assessor Mill Levies and Tax Districts
                          <span className="sr-only">
                            {" "}
                            (opens in a new tab)
                          </span>
                        </a>
                        .
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <HelpPillButton
                      className="text-xs sm:text-sm"
                      onClick={() =>
                        setShowResultDetails((prev) => !prev)
                      }
                    >
                      {showResultDetails
                        ? "Hide rate split details"
                        : "Show rate split details"}
                    </HelpPillButton>
                  </div>
                </>
              ) : null}
          </div>
        ) : null}

        {isNoAutoMatch ? (
          <div className="space-y-4">
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-sm text-amber-950 sm:text-base"
            >
              <p>
                <span className="font-medium text-amber-950">
                  No metro district was found on your levy stack.
                </span>{" "}
                This card only uses metro districts detected from your loaded levy
                lines (LG ID). We could not match any line to a metro row in our
                bundled county file, so metro share is not shown here. You can
                still use the map to see districts in your area:{" "}
                <a
                  href={COLORADO_SPECIAL_DISTRICTS_MAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800"
                >
                  Colorado special districts map
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                .
              </p>
            </div>
          </div>
        ) : null}
        </div>
      </section>
    </>
  );
}
