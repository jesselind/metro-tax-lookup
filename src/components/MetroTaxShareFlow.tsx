"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import { calculateSharePercentage } from "@/lib/levyCalculator";
import type {
  LevyDataFile,
  LevyDistrictFromJson,
  MetroDistrictOption,
} from "@/lib/levyTypes";
import levyData from "../../public/data/metro-levies-2025.json";
import { parseMills } from "@/lib/committedLevyLine";
import { HelpPillButton } from "@/components/HelpPillButton";
import { LevyLinesCard } from "@/components/LevyLinesCard";
import { MetroDistrictSelect } from "@/components/MetroDistrictSelect";
import {
  ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB as ASSESSOR_MILL_LEVIES_HUB_URL,
  ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF as MILL_LEVY_PUBLIC_INFO_FORM_PDF_URL,
} from "@/lib/arapahoeCountyUrls";
import { btnOutlineSecondaryMd } from "@/lib/buttonClasses";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  INPUT_CLASS,
} from "@/lib/toolFlowStyles";
import type { MetroFromLevyStack } from "@/lib/metroDistrictFromLevyLines";
import { COLORADO_SPECIAL_DISTRICTS_MAP_URL } from "@/lib/dataSourceUrls";
import {
  buildMetroLevyBarSegments,
  isMetroLevyDebtService,
  metroBarSegmentPurposeSwatchClass,
  metroBarSegmentDisplayLabel,
  metroPurposeCategoryHintForSegment,
  type MetroLevyBarSegment,
} from "@/lib/metroLevyBarSegments";

/** JSON stores mill rate (decimal, e.g. 0.0634); county and inputs use mills (e.g. 63.4). */
const RATE_TO_MILLS = 1000;

type MetroAutoMatchBannerProps = {
  districtName: string | undefined;
  /** When true, hide metro picker and mills (simplified "all set" layout). */
  onSuppressPickerChange: (suppress: boolean) => void;
};

function MetroAutoMatchBanner({
  districtName,
  onSuppressPickerChange,
}: MetroAutoMatchBannerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  useLayoutEffect(() => {
    onSuppressPickerChange(!showAdvanced);
  }, [showAdvanced, onSuppressPickerChange]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-sm text-emerald-950 sm:text-base"
    >
      <p className="font-medium text-emerald-950">You are all set here</p>
      <p className="mt-1 text-emerald-900">
        We matched your levy breakdown to{" "}
        <strong className="font-semibold text-emerald-950">
          {districtName ?? "your metro district"}
        </strong>
        . The share above already uses that district and your total mills from the stack.
      </p>
      <div className="mt-3">
        <HelpPillButton
          className="text-xs sm:text-sm"
          type="button"
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced((prev) => !prev)}
        >
          {showAdvanced
            ? "Hide metro district and mills options"
            : "Change metro district or mills"}
        </HelpPillButton>
      </div>
    </div>
  );
}

export type MetroTaxShareFlowProps = {
  idPrefix?: string;
  embedded?: boolean;
  prefillTotalMills?: number | null;
  metroFromLevyStack?: MetroFromLevyStack;
  /**
   * When set (e.g. home embedded flow), committing a valid total rescales levy stack lines
   * so the on-screen stack matches this field.
   */
  onApplyTotalMillsToLevy?: (mills: number) => void;
  /** Re-runs PIN load for the loaded parcel (same as loading property data again). */
  onReloadCountyLevyStack?: () => void;
  countyLevyReloadBusy?: boolean;
  /** Increments when the parent reloads the stack from the county; forces metro total to resync. */
  levyStackReloadRevision?: number;
};

export function MetroTaxShareFlow({
  idPrefix = "",
  embedded = false,
  prefillTotalMills = null,
  metroFromLevyStack,
  onApplyTotalMillsToLevy,
  onReloadCountyLevyStack,
  countyLevyReloadBusy = false,
  levyStackReloadRevision = 0,
}: MetroTaxShareFlowProps) {
  const p = idPrefix ? `${idPrefix}-` : "";
  const flowHeadingId = `${p}flow-heading`;
  const totalMillsId = `${p}total-mills`;
  const totalMillsHintId = `${p}total-mills-hint`;

  const [totalMillsInput, setTotalMillsInput] = useState("");
  const [selectedMetroId, setSelectedMetroId] = useState<string>("");
  const [showResultDetails, setShowResultDetails] = useState(false);
  const [autoMatchSuppressPicker, setAutoMatchSuppressPicker] =
    useState(true);

  const handleAutoMatchSuppressPicker = useCallback((suppress: boolean) => {
    setAutoMatchSuppressPicker(suppress);
  }, []);

  const prevMetroHintKeyRef = useRef<string>("");
  const totalMillsDirtyRef = useRef(false);
  const lastProcessedReloadRevision = useRef(0);

  useEffect(() => {
    if (levyStackReloadRevision <= lastProcessedReloadRevision.current) {
      return;
    }
    lastProcessedReloadRevision.current = levyStackReloadRevision;
    totalMillsDirtyRef.current = false;
    if (prefillTotalMills != null && prefillTotalMills > 0) {
      const formatted =
        Math.round(prefillTotalMills * 1000) / 1000 === prefillTotalMills
          ? String(prefillTotalMills)
          : prefillTotalMills.toFixed(3);
      queueMicrotask(() => setTotalMillsInput(formatted));
    }
  }, [levyStackReloadRevision, prefillTotalMills]);

  useEffect(() => {
    if (prefillTotalMills == null || prefillTotalMills <= 0) return;
    const formatted =
      Math.round(prefillTotalMills * 1000) / 1000 === prefillTotalMills
        ? String(prefillTotalMills)
        : prefillTotalMills.toFixed(3);
    if (onApplyTotalMillsToLevy) {
      if (totalMillsDirtyRef.current) return;
      queueMicrotask(() => setTotalMillsInput(formatted));
      return;
    }
    queueMicrotask(() =>
      setTotalMillsInput((prev) => (prev.trim() === "" ? formatted : prev)),
    );
  }, [prefillTotalMills, onApplyTotalMillsToLevy]);

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

  useEffect(() => {
    const key =
      metroFromLevyStack == null
        ? "none"
        : metroFromLevyStack.kind === "match"
          ? `m:${metroFromLevyStack.districtId}`
          : "no";
    if (key !== prevMetroHintKeyRef.current) {
      prevMetroHintKeyRef.current = key;
    }
    if (metroFromLevyStack == null) return;
    if (metroFromLevyStack.kind === "match") {
      const { districtId } = metroFromLevyStack;
      if (metroDistrictIdSet.has(districtId)) {
        queueMicrotask(() => setSelectedMetroId(districtId));
      }
      return;
    }
    queueMicrotask(() => setSelectedMetroId(""));
  }, [metroFromLevyStack, metroDistrictIdSet]);

  const totalMills = parseFloat(totalMillsInput) || 0;
  const selectedDistrict = metroOptions.find((m) => m.id === selectedMetroId);
  const metroDebtMills = selectedDistrict
    ? selectedDistrict.debtMills * RATE_TO_MILLS
    : 0;

  const totalDistrictMills = selectedDistrict
    ? selectedDistrict.totalMills * RATE_TO_MILLS
    : 0;
  const { percentage: totalDistrictShare } = calculateSharePercentage(
    totalMills,
    totalDistrictMills,
  );

  const fullDistrict = levyJson.districts.find(
    (d) => d.districtId === selectedMetroId,
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

  const metroBarSegments = useMemo((): MetroLevyBarSegment[] => {
    const fromLines = buildMetroLevyBarSegments(metroLevies, RATE_TO_MILLS);
    if (fromLines.length > 0) return fromLines;
    if (totalDistrictMills > 0 && selectedMetroId.length > 0) {
      return [
        {
          key: "certified-fallback",
          label: "Certified total",
          mills: totalDistrictMills,
          purposeCategory: "other",
          rawRowIndex: -1,
        },
      ];
    }
    return [];
  }, [metroLevies, totalDistrictMills, selectedMetroId]);

  const sumMetroLineMills = useMemo(
    () => metroBarSegments.reduce((s, seg) => s + seg.mills, 0),
    [metroBarSegments],
  );

  const showResultCard = totalMills > 0 && selectedMetroId.length > 0;

  const otherMillsForStack =
    totalMills > 0
      ? Math.max(0, totalMills - totalDistrictMills)
      : 0;
  const { percentage: shareOtherOfTotal } = calculateSharePercentage(
    totalMills,
    otherMillsForStack,
  );

  const MILLS_ROUND_EPS = 0.0005;
  const lineSumMatchesCertified =
    totalDistrictMills <= 0 ||
    Math.abs(sumMetroLineMills - totalDistrictMills) < MILLS_ROUND_EPS;
  const pickerDebtMatchesAggregate =
    Math.abs(metroDebtMills - metroDebtMillsFromAggregates) < MILLS_ROUND_EPS;

  const { debtShareOfTotal, showDebtHeadline } = useMemo(() => {
    if (sumMetroLineMills <= 0 || totalMills <= 0) {
      return { debtShareOfTotal: 0, showDebtHeadline: false };
    }
    const debtLineMillsSum = metroBarSegments.reduce(
      (s, seg) => s + (isMetroLevyDebtService(seg) ? seg.mills : 0),
      0,
    );
    const debtAllocated =
      totalDistrictMills * (debtLineMillsSum / sumMetroLineMills);
    if (debtAllocated <= MILLS_ROUND_EPS) {
      return { debtShareOfTotal: 0, showDebtHeadline: false };
    }
    const { percentage } = calculateSharePercentage(totalMills, debtAllocated);
    return { debtShareOfTotal: percentage, showDebtHeadline: true };
  }, [
    metroBarSegments,
    sumMetroLineMills,
    totalDistrictMills,
    totalMills,
  ]);

  function allocatedMillsForSegment(seg: MetroLevyBarSegment): number {
    if (sumMetroLineMills <= 0) return 0;
    return totalDistrictMills * (seg.mills / sumMetroLineMills);
  }

  function segmentBarWidthPercent(seg: MetroLevyBarSegment): number {
    if (totalMills <= 0 || sumMetroLineMills <= 0) return 0;
    return (
      (totalDistrictMills / totalMills) *
      (seg.mills / sumMetroLineMills) *
      100
    );
  }

  const stackWidthOther =
    totalMills > 0
      ? Math.max(
          0,
          100 -
            metroBarSegments.reduce(
              (s, seg) => s + segmentBarWidthPercent(seg),
              0,
            ),
        )
      : 0;

  const taxRateSplitAnnouncement = useMemo(() => {
    if (totalMills <= 0 || metroBarSegments.length === 0) {
      return `Split of your total property tax rate: ${shareOtherOfTotal.toFixed(1)} percent other local districts and taxes.`;
    }
    const metroParts = metroBarSegments.map((seg) => {
      const allocated =
        sumMetroLineMills > 0
          ? totalDistrictMills * (seg.mills / sumMetroLineMills)
          : 0;
      const { percentage } = calculateSharePercentage(totalMills, allocated);
      return `${percentage.toFixed(1)}% ${metroBarSegmentDisplayLabel(seg)}`;
    });
    const cap = 6;
    const shown =
      metroParts.length > cap
        ? `${metroParts.slice(0, cap).join(", ")}, and ${metroParts.length - cap} more parts of this metro rate`
        : metroParts.join(", ");
    return `Split of your total property tax rate: ${shown}; ${shareOtherOfTotal.toFixed(1)} percent other local districts and taxes.`;
  }, [
    totalMills,
    metroBarSegments,
    shareOtherOfTotal,
    sumMetroLineMills,
    totalDistrictMills,
  ]);

  function handleTotalMillsChange(raw: string) {
    totalMillsDirtyRef.current = true;
    setTotalMillsInput(raw);
  }

  function handleTotalMillsBlur() {
    const parsed = parseMills(totalMillsInput);
    if (parsed == null || parsed <= 0) {
      if (prefillTotalMills != null && prefillTotalMills > 0) {
        const formatted =
          Math.round(prefillTotalMills * 1000) / 1000 === prefillTotalMills
            ? String(prefillTotalMills)
            : prefillTotalMills.toFixed(3);
        setTotalMillsInput(formatted);
      }
      totalMillsDirtyRef.current = false;
      return;
    }
    if (onApplyTotalMillsToLevy && parsed > 0) {
      const baseline = prefillTotalMills ?? 0;
      if (Math.abs(parsed - baseline) > 0.0005) {
        onApplyTotalMillsToLevy(parsed);
      }
    }
    totalMillsDirtyRef.current = false;
  }

  let resultAnnouncement = "";
  if (showResultCard) {
    resultAnnouncement =
      totalDistrictShare > 0
        ? `${totalDistrictShare.toFixed(1)} percent of your property taxes go to your metro district.${
            showDebtHeadline
              ? ` ${debtShareOfTotal.toFixed(1)} percent of your property taxes are paying off your metro district's debt.`
              : ""
          } ${taxRateSplitAnnouncement}`
        : `No metro district mills shown in your property tax rate. ${taxRateSplitAnnouncement}`;
  } else if (totalMills > 0 && !selectedMetroId) {
    resultAnnouncement = "Select a metro district to see your share.";
  }

  const isNoAutoMatch = metroFromLevyStack?.kind === "no_metro_lgid_match";

  const isMetroAutoMatchUi =
    metroFromLevyStack?.kind === "match" &&
    selectedMetroId === metroFromLevyStack.districtId;
  const hideMetroPickerAndTotals =
    isMetroAutoMatchUi && autoMatchSuppressPicker;

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
                      ? "of your property taxes go to your metro district"
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
                      of your property taxes are paying off your metro district&apos;s debt
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
                <div
                  className="h-5 w-full overflow-hidden rounded-full border border-slate-300 bg-slate-100 shadow-inner"
                  aria-hidden="true"
                >
                  <div className="flex h-full w-full">
                    {metroBarSegments.map((seg, i) => {
                      const w = segmentBarWidthPercent(seg);
                      return w > 0 ? (
                        <div
                          key={seg.key}
                          className={`h-full min-w-0 ${metroBarSegmentPurposeSwatchClass(seg, i)}`}
                          style={{ width: `${w}%` }}
                        />
                      ) : null;
                    })}
                    {stackWidthOther > 0 ? (
                      <div
                        className="h-full min-w-0 bg-slate-300"
                        style={{ width: `${stackWidthOther}%` }}
                      />
                    ) : null}
                  </div>
                </div>
                <ul
                  className="space-y-2.5 text-sm text-slate-800 sm:text-base"
                  aria-labelledby={`${p}tax-rate-split-heading`}
                  aria-describedby={`${p}tax-rate-split-desc`}
                >
                  {metroBarSegments.map((seg, i) => {
                    const { percentage } = calculateSharePercentage(
                      totalMills,
                      allocatedMillsForSegment(seg),
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
              {selectedDistrict && fullDistrict ? (
                <>
                  {showResultDetails ? (
                    <div className="mt-4 space-y-4 text-sm text-slate-800 sm:text-base">
                      <div className="space-y-3 border-t border-slate-200 pt-4">
                        <div>
                          <p className="font-semibold text-indigo-950">
                            Check the math
                          </p>
                          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                            County file for{" "}
                            <span className="font-medium text-slate-900">
                              {selectedDistrict.name}
                            </span>
                            . Metro debt mills here match the{" "}
                            <strong>debt mills</strong> value for this district in
                            the picker (to three decimals:{" "}
                            <span className="font-mono">
                              {metroDebtMills.toFixed(3)}
                            </span>
                            ). Official PDF and related county links are at the
                            bottom of this section.
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
                              {metroBarSegments.map((seg) => (
                                <tr
                                  key={`math-${seg.key}`}
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
                                  Metro total (county certified)
                                </td>
                                <td className="py-2 text-right tabular-nums">
                                  {totalDistrictMills.toFixed(3)}
                                </td>
                              </tr>
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
                              {metroBarSegments.map((seg) => {
                                const alloc = allocatedMillsForSegment(seg);
                                const { percentage } = calculateSharePercentage(
                                  totalMills,
                                  alloc,
                                );
                                return (
                                  <p key={`share-${seg.key}`}>
                                    {metroBarSegmentDisplayLabel(seg)} share ={" "}
                                    {alloc.toFixed(3)} / {totalMills.toFixed(3)}{" "}
                                    = {percentage.toFixed(1)}%
                                  </p>
                                );
                              })}
                              <p>
                                Metro total share (headline) ={" "}
                                {totalDistrictMills.toFixed(3)} /{" "}
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
                          {totalDistrictMills > 0 ? (
                            <p
                              className={
                                lineSumMatchesCertified
                                  ? "text-xs text-slate-600 sm:text-sm"
                                  : "text-xs text-amber-900 sm:text-sm"
                              }
                            >
                              {lineSumMatchesCertified
                                ? `County check: sum of all metro levy mills (${sumMetroLineMills.toFixed(3)}) matches certified metro total (${totalDistrictMills.toFixed(3)}).`
                                : `County data note: sum of all metro levy mills (${sumMetroLineMills.toFixed(3)}) does not match certified metro total (${totalDistrictMills.toFixed(3)}). Bar widths scale each metro levy to the certified total; the headline uses the certified total.`}
                            </p>
                          ) : null}
                          {!pickerDebtMatchesAggregate &&
                          totalDistrictMills > 0 ? (
                            <p className="text-xs text-amber-900 sm:text-sm">
                              Debt mills in the district list (
                              {metroDebtMills.toFixed(3)}) differ slightly from
                              the county file debt aggregate (
                              {metroDebtMillsFromAggregates.toFixed(3)}).
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <LevyLinesCard
                        title="Debt service lines"
                        description="Bonds and other debt line items from the county form."
                        levies={metroDebtLevies}
                        rateToMills={RATE_TO_MILLS}
                        tone="debt"
                        showAllLines
                      />
                      <LevyLinesCard
                        title="Operations lines"
                        description="Ongoing services and administration lines from the county form."
                        levies={metroOpsLevies}
                        rateToMills={RATE_TO_MILLS}
                        showAllLines
                      />
                      <LevyLinesCard
                        title="Other purposes"
                        description="Parts of the rate not classified as operations or debt (for example summary totals)."
                        levies={metroOtherLevies}
                        rateToMills={RATE_TO_MILLS}
                        showAllLines
                      />
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

        <div className="space-y-4">
            {isMetroAutoMatchUi ? (
                <MetroAutoMatchBanner
                  districtName={selectedDistrict?.name}
                  onSuppressPickerChange={handleAutoMatchSuppressPicker}
                />
              ) : null}
            {isNoAutoMatch ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-sm text-amber-950 sm:text-base"
              >
                <p>
                  <span className="font-medium text-amber-950">
                    No metro district match found.
                  </span>{" "}
                  If you know you live in one, please select a metro district from
                  the list below. If you are unsure, please see{" "}
                  <a
                    href={COLORADO_SPECIAL_DISTRICTS_MAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800"
                  >
                    this map
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  .
                </p>
              </div>
            ) : null}

            <div>
              {!hideMetroPickerAndTotals && !isNoAutoMatch ? (
                <p className="text-base text-slate-800 sm:text-lg">
                  Choose your <strong>metro district</strong>. Mills for each district
                  come from the county file (shown in the list).
                </p>
              ) : null}
              {!hideMetroPickerAndTotals && metroOptions.length > 0 ? (
                <MetroDistrictSelect
                  metroOptions={metroOptions}
                  selectedMetroId={selectedMetroId}
                  onSelect={(id) => setSelectedMetroId(id)}
                />
              ) : null}
            </div>

            {selectedMetroId && !hideMetroPickerAndTotals ? (
              <div className="border-t border-slate-200 pt-4">
                <label htmlFor={totalMillsId} className="sr-only">
                  Total property tax rate (mills)
                </label>
                <p className="mb-1.5 text-base font-medium text-slate-900 sm:text-lg">
                  Total property tax mills
                </p>
                {embedded &&
                onApplyTotalMillsToLevy &&
                prefillTotalMills != null &&
                prefillTotalMills > 0 ? (
                  <p className="mb-2 text-sm text-slate-600 sm:text-base">
                    Matches your levy stack. Change the number and leave this field to
                    rescale every line proportionally.
                  </p>
                ) : null}
                <input
                  id={totalMillsId}
                  name={totalMillsId}
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  placeholder="Example: 183.894"
                  className={INPUT_CLASS}
                  value={totalMillsInput}
                  onChange={(e) => handleTotalMillsChange(e.target.value)}
                  onBlur={handleTotalMillsBlur}
                  aria-describedby={totalMillsHintId}
                />
                <p
                  id={totalMillsHintId}
                  className="mt-1 text-sm text-slate-500 sm:text-base"
                >
                  {onApplyTotalMillsToLevy && !isNoAutoMatch
                    ? "Combined rate for all districts; kept in sync with the levy stack above when you leave the field."
                    : isNoAutoMatch
                      ? "Your combined rate from your tax bill or assessor page."
                      : "Combined rate from your property tax bill or assessor page (all districts together)."}
                </p>
                {onReloadCountyLevyStack ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={onReloadCountyLevyStack}
                      disabled={countyLevyReloadBusy}
                      aria-label={
                        countyLevyReloadBusy
                          ? "Reloading levy data from the county file"
                          : "Reset to county numbers. Reloads this parcel from the bundled county data, same as Load property data again."
                      }
                      className={`${btnOutlineSecondaryMd} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {countyLevyReloadBusy
                        ? "Reloading county data…"
                        : "Reset to county numbers"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
        </div>
        </div>
      </section>
      {embedded &&
      selectedMetroId &&
      !hideMetroPickerAndTotals ? (
        <p className="mt-6 text-sm text-slate-600 sm:text-base">
          To reset this calculator and your levy breakdown, use{" "}
          <strong className="font-semibold text-slate-800">Start over</strong>{" "}
          in the <strong className="font-semibold text-slate-800">Start with your address</strong>{" "}
          section above.
        </p>
      ) : null}
    </>
  );
}
