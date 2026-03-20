"use client";

import Image from "next/image";
import { useState } from "react";
import { calculateSharePercentage } from "@/lib/levyCalculator";
import type {
  LevyDataFile,
  LevyDistrictFromJson,
  MetroDistrictOption,
} from "@/lib/levyTypes";
import levyData from "../../public/data/metro-levies-2025.json";
import propertyPageImg from "@/assets/images/mill-levy-property-page.png";
import millLevyDetailImg from "@/assets/images/mill-levy-detail.png";
import { InfoDetails } from "@/components/InfoDetails";
import { LevyLinesCard } from "@/components/LevyLinesCard";
import { MetroDistrictSelect } from "@/components/MetroDistrictSelect";
import {
  ARAPAHOE_ASSESSOR_MILL_LEVIES_HUB as ASSESSOR_MILL_LEVIES_HUB_URL,
  ARAPAHOE_ASSESSOR_PROPERTY_SEARCH as ASSESSOR_SEARCH_URL,
  ARAPAHOE_MILL_LEVY_PUBLIC_INFO_FORM_PDF as MILL_LEVY_PUBLIC_INFO_FORM_PDF_URL,
} from "@/lib/arapahoeCountyUrls";

const COUNTY_EXTERNAL_LINK_CLASS =
  "font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-1";

/** JSON stores mill rate (decimal, e.g. 0.0634); county and inputs use mills (e.g. 63.4). */
const RATE_TO_MILLS = 1000;

const HELP_PILL_CLASS =
  "inline-flex items-center gap-1.5 rounded-full border border-indigo-400 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-950 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-700 focus:ring-offset-1 sm:text-base";
const INPUT_CLASS =
  "block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-base shadow-sm placeholder:text-slate-400 focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/30";
const CARD_CLASS_CLIPPED =
  "overflow-hidden rounded-xl border border-slate-700 bg-slate-700";
const CARD_HEADER_CLASS = "px-4 py-3 text-base font-semibold text-white sm:px-5";
const CARD_BODY_CLASS = "bg-white px-4 py-4 sm:px-5 sm:py-5";

// For the Step 3 dropdown card: keep overflow visible so the menu can escape,
// but avoid corner artifacts by using a single white surface.
const CARD_CLASS_DROPDOWN =
  "overflow-visible rounded-xl border border-slate-700 bg-slate-700";
const CARD_HEADER_CLASS_DROPDOWN =
  "px-4 py-3 text-base font-semibold text-white sm:px-5";
const CARD_BODY_CLASS_DROPDOWN =
  "rounded-b-xl bg-white px-4 py-4 sm:px-5 sm:py-5";

const INFO_DETAILS_WIDE_CLASS =
  "w-full max-w-prose overflow-hidden rounded-xl border border-indigo-400 bg-indigo-50";

export default function HomePage() {
  const [totalMillsInput, setTotalMillsInput] = useState("");
  const [showMetroHelpDetails, setShowMetroHelpDetails] = useState(false);
  const [showStepsDetails, setShowStepsDetails] = useState(false);
  const [knowsMetroName, setKnowsMetroName] = useState(false);
  const [selectedMetroId, setSelectedMetroId] = useState<string>("");
  const [showResultDetails, setShowResultDetails] = useState(false);

  const levyJson = levyData as LevyDataFile;

  const metroOptions: MetroDistrictOption[] = levyJson.districts
    .filter((d: LevyDistrictFromJson) => d.type === "metro")
    .map((d: LevyDistrictFromJson) => ({
      id: d.districtId,
      name: d.name,
      debtMills: d.aggregates?.debtMills ?? 0,
      totalMills: d.aggregates?.totalMills ?? 0,
    }))
    .sort((a: MetroDistrictOption, b: MetroDistrictOption) =>
      a.name.localeCompare(b.name)
    );

  const totalMills = parseFloat(totalMillsInput) || 0;
  const selectedDistrict = metroOptions.find((m) => m.id === selectedMetroId);
  const metroDebtMills = selectedDistrict ? selectedDistrict.debtMills * RATE_TO_MILLS : 0;

  const { percentage: metroDebtPercentage } = calculateSharePercentage(
    totalMills,
    metroDebtMills
  );

  const totalDistrictMills = selectedDistrict
    ? selectedDistrict.totalMills * RATE_TO_MILLS
    : 0;
  const { percentage: totalDistrictShare } = calculateSharePercentage(
    totalMills,
    totalDistrictMills
  );

  const fullDistrict = levyJson.districts.find(
    (d) => d.districtId === selectedMetroId
  );
  const metroLevies = fullDistrict?.levies ?? [];
  const metroDebtLevies = metroLevies.filter(
    (l) => l.purposeCategory === "debt_service"
  );
  const metroOpsLevies = metroLevies
    .filter((l) => l.purposeCategory === "operations")
    .slice()
    .sort((a, b) => (b.rateMillsCurrent ?? 0) - (a.rateMillsCurrent ?? 0));
  const metroOpsMills =
    fullDistrict?.aggregates?.opsMills != null
      ? fullDistrict.aggregates.opsMills * RATE_TO_MILLS
      : 0;
  const metroDebtMillsFromAggregates =
    fullDistrict?.aggregates?.debtMills != null
      ? fullDistrict.aggregates.debtMills * RATE_TO_MILLS
      : 0;
  const showResult = totalMills > 0;

  const otherMillsForStack =
    totalMills > 0
      ? Math.max(0, totalMills - metroOpsMills - metroDebtMills)
      : 0;
  const { percentage: shareOpsOfTotal } = calculateSharePercentage(
    totalMills,
    metroOpsMills
  );
  const { percentage: shareDebtOfTotal } = calculateSharePercentage(
    totalMills,
    metroDebtMills
  );
  const { percentage: shareOtherOfTotal } = calculateSharePercentage(
    totalMills,
    otherMillsForStack
  );
  const stackWidthOps =
    totalMills > 0 ? (metroOpsMills / totalMills) * 100 : 0;
  const stackWidthDebt =
    totalMills > 0 ? (metroDebtMills / totalMills) * 100 : 0;
  const stackWidthOther =
    totalMills > 0
      ? Math.max(0, 100 - stackWidthOps - stackWidthDebt)
      : 0;

  const MILLS_ROUND_EPS = 0.0005;
  const metroSumOpsPlusDebtFromFile =
    metroOpsMills + metroDebtMillsFromAggregates;
  const countyOpsDebtMatchesTotal =
    totalDistrictMills <= 0 ||
    Math.abs(metroSumOpsPlusDebtFromFile - totalDistrictMills) < MILLS_ROUND_EPS;
  const pickerDebtMatchesAggregate =
    Math.abs(metroDebtMills - metroDebtMillsFromAggregates) < MILLS_ROUND_EPS;
  const barMetroPartsSum = metroOpsMills + metroDebtMills;
  const barMatchesCountyTotal =
    totalDistrictMills <= 0 ||
    Math.abs(barMetroPartsSum - totalDistrictMills) < MILLS_ROUND_EPS;

  function handleStartOver() {
    setTotalMillsInput("");
    setKnowsMetroName(false);
    setSelectedMetroId("");
    setShowStepsDetails(false);
    setShowMetroHelpDetails(false);
    setShowResultDetails(false);
  }

  const taxRateSplitAnnouncement = `Split of your total property tax rate: ${shareOpsOfTotal.toFixed(1)} percent metro operations, ${shareDebtOfTotal.toFixed(1)} percent metro debt, ${shareOtherOfTotal.toFixed(1)} percent other local districts and taxes.`;
  const resultAnnouncement = showResult
    ? totalDistrictShare > 0
      ? `${totalDistrictShare.toFixed(1)} percent of your property taxes go to metro district (operations + debt). ${taxRateSplitAnnouncement}`
      : `No metro district mills shown in your property tax rate. ${taxRateSplitAnnouncement}`
    : "";

  return (
    <main className="flex min-h-screen flex-col overflow-x-hidden bg-white text-slate-900">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {resultAnnouncement}
      </div>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 pt-8 pb-4 sm:pt-12 sm:pb-6">
        <header className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 pb-4">
          <div className="mx-auto w-full max-w-xl px-4">
            <p
              className="text-sm font-medium uppercase tracking-widest text-indigo-900 sm:text-base"
              aria-hidden
            >
              Arapahoe County
            </p>
          </div>
          <div className="mt-2 bg-slate-700 sm:mt-3">
            <div className="mx-auto w-full max-w-xl px-4 py-4 sm:px-5 sm:py-5">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                What share of your property tax goes to your metro district?
              </h1>
            </div>
          </div>
        </header>

        <section
          aria-labelledby="flow-heading"
          className=""
        >
          <h2 id="flow-heading" className="sr-only">
            Step-by-step: find your numbers and see your result
          </h2>
          <ol className="space-y-6 sm:space-y-8">
            {/* Step 1: Determine metro district first */}
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>Step 1 - Do you live in a metro district?</div>
                <div className={`${CARD_BODY_CLASS} space-y-2`}>
                  <p className="text-base text-slate-800 sm:text-lg">
                    Check the{" "}
                    <a
                      href="https://gis.dola.colorado.gov/CO_SpecialDistrict/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800"
                    >
                      Colorado Special Districts map
                    </a>{" "}
                    for a <strong>metro district</strong> covering your property.
                  </p>
                  <p className="text-base text-slate-800 sm:text-lg">
                    If you do not see a metro district covering your property, you can stop here.
                  </p>
                  <InfoDetails title="What&apos;s a metro district?">
                    <div className="space-y-2">
                      <p>
                        A <strong>metro district</strong> (metropolitan district) is a
                        local government that can charge property taxes in your
                        neighborhood for things like roads, parks, and water. Often part
                        of that tax goes to paying off long-term debt (bonds).
                      </p>
                      <p>
                        A bond is like a long-term IOU: the district borrows money to
                        build things, then repays it over many years using a portion
                        of property taxes. The &quot;debt service&quot; number in this
                        tool is the part of your tax rate that goes to those
                        repayments.
                      </p>
                      <p>
                        <strong>How it is supposed to work:</strong> Developers often
                        form metro districts and the district may issue bonds that
                        investors (sometimes the developer) buy. In a conservative or
                        well-run district, the money borrowed roughly matches the cost
                        of roads, parks, and other improvements, and property taxes
                        simply pay that debt back over time.
                      </p>
                      <p>
                        <strong>How it can be abused:</strong> In other districts, the
                        bonds are used as a cash-flow strategy: the amount borrowed is
                        intentionally larger than what was spent on improvements so
                        investors can make a profit. Homeowners repay that debt
                        through property taxes over many years, and can end up paying
                        for infrastructure twice: once in the home price and again
                        through their tax bill.
                      </p>
                      <p>
                        On top of that, many metro district debt service mill levies are
                        approved by voters as TABOR-exempt. Colorado&apos;s Taxpayer&apos;s Bill
                        of Rights (TABOR) normally limits how fast local government tax
                        revenue can grow. But metro district voters can approve mill
                        levies that are TABOR-exempt, especially for debt payments. Those
                        levies are allowed to increase as needed to cover bonds and other
                        obligations, even when other parts of a tax bill are held down by
                        TABOR limits.
                      </p>
                      <p>
                        Early on, the only &quot;voters&quot; in a new metro district are
                        often the developer and people closely tied to them. It is not
                        unusual for a developer to sell tiny parcels to employees or
                        other insiders for the sole purpose of making them property owners with voting power. They then unanimously approve high mill levies,
                        generous debt authority, and TABOR-exempt status for that debt.
                        That structure can leave homeowners locked into years of high tax
                        collections with little oversight, weak accountability, and almost
                        no practical way for them to push back. In Colorado, metropolitan
                        districts are a type of special district, and special districts
                        are explicitly exempt from the jurisdiction of the Colorado
                        Independent Ethics Commission.
                      </p>
                    </div>
                  </InfoDetails>
                </div>
              </div>
            </li>

            {/* Step 2: Go to property lookup */}
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>Step 2 - Find your property</div>
                <div className={`${CARD_BODY_CLASS} space-y-2`}>
                  <p className="text-base text-slate-800 sm:text-lg">
                    Open the county{" "}
                    <a
                      href={ASSESSOR_SEARCH_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800"
                    >
                      property search
                    </a>
                    , type your address, then open the county assessor property details page (your parcel record).
                  </p>
                </div>
              </div>
            </li>

            {/* Step 3: Find total property tax mills on property details page */}
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>Step 3 - Find total property tax mills</div>
                <div className={`${CARD_BODY_CLASS} space-y-2`}>
                  <p className="text-base text-slate-800 sm:text-lg">
                    On the property details page, find <strong>2025 Mill Levy</strong>{" "}
                    (your total property tax mills, example: 183.894). Enter it below.
                  </p>
                  <button
                    type="button"
                    className={HELP_PILL_CLASS}
                    onClick={() => setShowStepsDetails((prev) => !prev)}
                  >
                    {showStepsDetails ? "Hide" : "Show"} where to find it
                  </button>
                  {showStepsDetails && (
                    <div className="rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
                      <p className="mb-3">
                        Look for <strong>2025 Mill Levy</strong> on the property details page.
                      </p>
                      <figure>
                        <a href={propertyPageImg.src} target="_blank" rel="noopener noreferrer" className="block">
                          <Image
                            src={propertyPageImg}
                            alt="Arapahoe County property page with 2025 Mill Levy and Tax District Levies link highlighted."
                            className="w-full rounded border border-slate-400"
                            width={800}
                            height={500}
                          />
                        </a>
                        <figcaption className="mt-1 text-sm text-slate-500 sm:text-base">Tap image to open full size.</figcaption>
                      </figure>
                    </div>
                  )}
                  <div className="pt-1">
                    <label htmlFor="total-mills" className="sr-only">Total property tax rate (mills)</label>
                    <input
                      id="total-mills"
                      name="total-mills"
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      placeholder="Example: 183.894"
                      className={INPUT_CLASS}
                      value={totalMillsInput}
                      onChange={(e) => setTotalMillsInput(e.target.value)}
                      aria-describedby="total-mills-hint"
                    />
                    <p id="total-mills-hint" className="mt-1 text-sm text-slate-500 sm:text-base">Total property tax rate (mills)</p>
                  </div>
                  <InfoDetails
                    title="What are &quot;mills&quot;?"
                    className={INFO_DETAILS_WIDE_CLASS}
                  >
                    <p>
                      <strong>Mills</strong> are the units used to express property
                      tax rates. One mill means <strong>$1 of tax for every $1,000 of
                      taxable (assessed) value</strong>. So if your assessed value is
                      $400,000 and the rate is 100 mills, your tax from that rate
                      would be about $400.
                    </p>
                  </InfoDetails>
                  <InfoDetails
                    title="What is a &quot;levy&quot;?"
                    className={INFO_DETAILS_WIDE_CLASS}
                  >
                    <p>
                      A <strong>levy</strong> is a taxing district&apos;s{" "}
                      <strong>certified property tax rate</strong> for a given year,
                      usually expressed in <strong>mills</strong>. Your{" "}
                      <strong>mill levy</strong> on the assessor page is the{" "}
                      <strong>combined</strong> rate from every district that taxes your
                      parcel (schools, county, metro district, and others).
                    </p>
                  </InfoDetails>
                </div>
              </div>
            </li>

            {/* Step 4: Get metro district debt - picker if they know name, or guide + image if not */}
            <li>
              <div className={CARD_CLASS_DROPDOWN}>
                <div className={CARD_HEADER_CLASS_DROPDOWN}>Step 4 - Metro mills</div>
                <div className={`${CARD_BODY_CLASS_DROPDOWN} space-y-3`}>
                  <div className="rounded-md border border-slate-300 bg-white px-3 py-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
                      <input
                        id="knows-metro-name"
                        type="checkbox"
                        checked={knowsMetroName}
                        onChange={(e) => {
                          setKnowsMetroName(e.target.checked);
                          if (e.target.checked) setShowMetroHelpDetails(false);
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-900 focus:ring-indigo-700"
                      />
                      <label htmlFor="knows-metro-name" className="text-base font-medium text-slate-900">
                        I know my metro district&apos;s name
                      </label>
                    </div>
                  </div>

                  {!knowsMetroName && (
                    <>
                      <p className="text-base text-slate-800 sm:text-lg">
                        On your property details page, tap the <strong>2025 Mill Levy</strong>{" "}
                        number from Step 3. Find the row with your metro district&apos;s{" "}
                        <strong>name</strong>.
                      </p>
                      <button
                        type="button"
                        className={HELP_PILL_CLASS}
                        onClick={() => setShowMetroHelpDetails((prev) => !prev)}
                      >
                        {showMetroHelpDetails ? "Hide" : "Show"} example
                      </button>
                      {showMetroHelpDetails && (
                        <div className="rounded-lg border border-slate-400 bg-white p-3 text-sm text-slate-700 sm:text-base">
                          <p className="mb-3">Use this page to identify the metro district name (the row label).</p>
                          <figure>
                            <a href={millLevyDetailImg.src} target="_blank" rel="noopener noreferrer" className="block">
                              <Image
                                src={millLevyDetailImg}
                                alt="County tax levies table with the metro district name highlighted (example: Sky Ranch Metro Dist. #3)."
                                className="w-full rounded border border-slate-400"
                                width={800}
                                height={500}
                              />
                            </a>
                            <figcaption className="mt-1 text-sm text-slate-500 sm:text-base">Tap image to open full size.</figcaption>
                          </figure>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <p className="text-base text-slate-800 sm:text-lg">
                      Select your metro district here. We&apos;ll fill in the <strong>metro mills</strong>{" "}
                      automatically (including{" "}
                      <strong className="text-red-900">debt service mills</strong>, if any).
                    </p>
                    {metroOptions.length > 0 && (
                      <MetroDistrictSelect
                        metroOptions={metroOptions}
                        selectedMetroId={selectedMetroId}
                        onSelect={(id) => setSelectedMetroId(id)}
                      />
                    )}
                    <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                      All metro districts from the county form are listed (including ones with 0 debt mills).
                    </p>
                    {selectedDistrict && (
                      <p className="mt-2 text-sm text-slate-800 sm:text-base">
                        <span className="font-medium text-red-900">Debt service mills used:</span>{" "}
                        <span className="font-mono text-slate-800">{metroDebtMills.toFixed(3)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>

            {/* Result */}
            {showResult && (
              <li>
                <div className="overflow-hidden rounded-xl border-2 border-indigo-950 bg-indigo-950">
                  <div className={CARD_HEADER_CLASS}>Result</div>
                  <div className={CARD_BODY_CLASS}>
                    <p className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                      {totalDistrictShare.toFixed(1)}%
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700 sm:text-base">
                      {totalDistrictShare > 0
                        ? "Share of your property taxes going to your metro district (operations + debt)"
                        : "No metro district mills shown in your property tax rate"}
                    </p>
                    <div className="mt-5 space-y-3">
                      <p
                        id="tax-rate-split-heading"
                        className="text-sm font-semibold text-slate-900 sm:text-base"
                      >
                        Your total property tax rate, in three parts
                      </p>
                      <p id="tax-rate-split-desc" className="sr-only">
                        Stacked bar: {shareOpsOfTotal.toFixed(1)} percent metro
                        operations, {shareDebtOfTotal.toFixed(1)} percent metro
                        debt, {shareOtherOfTotal.toFixed(1)} percent other local
                        districts and taxes. Percentages are shares of your total
                        mill rate.
                      </p>
                      <div
                        className="h-5 w-full overflow-hidden rounded-full border border-slate-300 bg-slate-100 shadow-inner"
                        aria-hidden="true"
                      >
                        <div className="flex h-full w-full">
                          {stackWidthOps > 0 && (
                            <div
                              className="h-full min-w-0 bg-emerald-600"
                              style={{ width: `${stackWidthOps}%` }}
                            />
                          )}
                          {stackWidthDebt > 0 && (
                            <div
                              className="h-full min-w-0 bg-red-700"
                              style={{ width: `${stackWidthDebt}%` }}
                            />
                          )}
                          {stackWidthOther > 0 && (
                            <div
                              className="h-full min-w-0 bg-slate-300"
                              style={{ width: `${stackWidthOther}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <ul
                        className="space-y-2.5 text-sm text-slate-800 sm:text-base"
                        aria-labelledby="tax-rate-split-heading"
                        aria-describedby="tax-rate-split-desc"
                      >
                        <li className="flex items-start justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="mt-0.5 h-3 w-3 shrink-0 rounded-sm bg-emerald-600"
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className="font-medium text-slate-900">
                                Metro operations
                              </span>
                              <span className="mt-0.5 block text-xs font-normal text-slate-600 sm:text-sm">
                                Day-to-day metro district services
                              </span>
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                            {shareOpsOfTotal.toFixed(1)}%
                          </span>
                        </li>
                        <li className="flex items-start justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="mt-0.5 h-3 w-3 shrink-0 rounded-sm bg-red-700"
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className="font-medium text-slate-900">
                                Metro debt
                              </span>
                              <span className="mt-0.5 block text-xs font-normal text-slate-600 sm:text-sm">
                                Bond repayments and similar debt
                              </span>
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                            {shareDebtOfTotal.toFixed(1)}%
                          </span>
                        </li>
                        <li className="flex items-start justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="mt-0.5 h-3 w-3 shrink-0 rounded-sm bg-slate-300"
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className="font-medium text-slate-900">
                                Everything else
                              </span>
                              <span className="mt-0.5 block text-xs font-normal text-slate-600 sm:text-sm">
                                Schools, county, city, and other local districts
                              </span>
                            </span>
                          </span>
                          <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                            {shareOtherOfTotal.toFixed(1)}%
                          </span>
                        </li>
                      </ul>
                    </div>
                    {selectedDistrict && fullDistrict && (
                      <>
                        {showResultDetails && (
                          <div className="mt-4 space-y-4 text-sm text-slate-800 sm:text-base">
                            <div className="overflow-hidden rounded-lg border border-slate-300 bg-slate-50">
                              <div className="border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
                                <p className="font-semibold text-indigo-950">
                                  Check the math
                                </p>
                                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                                  County file for{" "}
                                  <span className="font-medium text-slate-900">
                                    {selectedDistrict.name}
                                  </span>
                                  . Debt mills in the table match{" "}
                                  <strong>Debt service mills used</strong> in Step 4
                                  (shown to three decimals there:{" "}
                                  <span className="font-mono">
                                    {metroDebtMills.toFixed(3)}
                                  </span>
                                  ). Official PDF and related county links are at
                                  the bottom of this section.
                                </p>
                              </div>
                              <div className="overflow-x-auto px-3 py-3 sm:px-4">
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
                                        Your total property tax mills (Step 3)
                                      </td>
                                      <td className="py-2 text-right tabular-nums">
                                        {totalMills.toFixed(3)}
                                      </td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-2 pr-3 align-top text-[0.7rem] text-slate-700 sm:text-xs">
                                        Metro operations (county)
                                      </td>
                                      <td className="py-2 text-right tabular-nums">
                                        {metroOpsMills.toFixed(3)}
                                      </td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                      <td className="py-2 pr-3 align-top text-[0.7rem] text-slate-700 sm:text-xs">
                                        Metro debt service (county)
                                      </td>
                                      <td className="py-2 text-right tabular-nums">
                                        {metroDebtMills.toFixed(3)}
                                      </td>
                                    </tr>
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
                              <div className="space-y-2 border-t border-slate-200 bg-white px-3 py-3 sm:px-4">
                                <p className="text-xs font-medium text-slate-800 sm:text-sm">
                                  Shares of your total mills
                                </p>
                                {totalMills > 0 ? (
                                  <div className="space-y-1.5 font-mono text-[0.7rem] leading-snug text-slate-700 sm:text-xs">
                                    <p>
                                      Metro operations share ={" "}
                                      {metroOpsMills.toFixed(3)} /{" "}
                                      {totalMills.toFixed(3)} ={" "}
                                      {shareOpsOfTotal.toFixed(1)}%
                                    </p>
                                    <p>
                                      Metro debt share ={" "}
                                      {metroDebtMills.toFixed(3)} /{" "}
                                      {totalMills.toFixed(3)} ={" "}
                                      {metroDebtPercentage.toFixed(1)}%
                                    </p>
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
                                {totalDistrictMills > 0 && (
                                  <p
                                    className={
                                      countyOpsDebtMatchesTotal
                                        ? "text-xs text-slate-600 sm:text-sm"
                                        : "text-xs text-amber-900 sm:text-sm"
                                    }
                                  >
                                    {countyOpsDebtMatchesTotal
                                      ? `County check: metro operations (${metroOpsMills.toFixed(3)}) + metro debt from file (${metroDebtMillsFromAggregates.toFixed(3)}) equals metro total (${totalDistrictMills.toFixed(3)}).`
                                      : `County data note: operations (${metroOpsMills.toFixed(3)}) plus debt from file (${metroDebtMillsFromAggregates.toFixed(3)}) is ${metroSumOpsPlusDebtFromFile.toFixed(3)} mills, which does not match certified metro total (${totalDistrictMills.toFixed(3)}). The headline uses the certified total.`}
                                  </p>
                                )}
                                {!pickerDebtMatchesAggregate &&
                                  totalDistrictMills > 0 && (
                                    <p className="text-xs text-amber-900 sm:text-sm">
                                      Debt mills used for the bar and formulas (
                                      {metroDebtMills.toFixed(3)}) differ slightly
                                      from the county file debt aggregate (
                                      {metroDebtMillsFromAggregates.toFixed(3)}).
                                    </p>
                                  )}
                                {totalDistrictMills > 0 &&
                                  !barMatchesCountyTotal && (
                                    <p className="text-xs text-amber-900 sm:text-sm">
                                      Bar segments use operations plus debt (
                                      {barMetroPartsSum.toFixed(3)} mills); the
                                      headline metro share uses certified metro
                                      total ({totalDistrictMills.toFixed(3)}{" "}
                                      mills). Totals may differ slightly.
                                    </p>
                                  )}
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
                              (PDF) for tax year {levyJson.year}.{" "}
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
                        )}
                        <div className="mt-3">
                          <button
                            type="button"
                            className={`${HELP_PILL_CLASS} text-xs sm:text-sm`}
                            onClick={() => setShowResultDetails((prev) => !prev)}
                          >
                            {showResultDetails ? "Hide details" : "Show details"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )}
          </ol>
        </section>

        <p className="text-center">
          <button
            type="button"
            onClick={handleStartOver}
            className="rounded-md border border-indigo-400 bg-white px-4 py-2 text-base font-medium text-indigo-950 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-700/30 focus:ring-offset-1"
          >
            Start over
          </button>
        </p>
      </div>
    </main>
  );
}

