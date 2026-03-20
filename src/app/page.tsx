"use client";

import Image from "next/image";
import { useState } from "react";
import { DEBT_RESULT_STRIP_CLASS } from "@/lib/debtUiClasses";
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

const ASSESSOR_SEARCH_URL =
  "https://www.arapahoeco.gov/your_county/county_departments/assessor/property_search/search_residential_commercial_ag_and_vacant.php";

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
                        <span className="font-mono text-slate-800">{metroDebtMills.toFixed(6)}</span>
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
                    {showResultDetails && (
                      <div className="mt-4 flex flex-col text-sm sm:text-base">
                        <div className={DEBT_RESULT_STRIP_CLASS}>
                          <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 sm:px-4">
                            <div className="text-slate-800">
                              <p className="font-medium text-slate-900">Metro debt share</p>
                              <p className="text-xs text-slate-600 sm:text-sm">
                                Portion of your total property tax rate going to metro district debt
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">
                                {metroDebtPercentage.toFixed(1)}%
                              </p>
                              <p className="font-mono text-xs text-slate-700 sm:text-sm">
                                {metroDebtMills.toFixed(3)} mills
                              </p>
                            </div>
                          </div>
                          {totalMills > 0 && (
                            <div className="px-3 pb-2.5 sm:px-4">
                              <div className="space-y-0.5 font-mono text-[0.7rem] text-slate-700 sm:text-xs">
                                <p>
                                  Metro debt share = metro district debt mills / total property tax mills
                                </p>
                                <p>
                                  = {metroDebtMills.toFixed(3)} / {totalMills.toFixed(3)} ={" "}
                                  {metroDebtPercentage.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedDistrict && totalDistrictShare > 0 && (
                          <div className="border-x border-b border-slate-200 bg-slate-50">
                            <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 sm:px-4">
                              <div className="text-slate-700">
                                <p className="font-medium">Metro total share</p>
                                <p className="text-xs text-slate-500 sm:text-sm">
                                  Portion of your total property tax rate going to metro district operations and debt
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-900">
                                  {totalDistrictShare.toFixed(1)}%
                                </p>
                                <p className="font-mono text-xs text-slate-600 sm:text-sm">
                                  {totalDistrictMills.toFixed(3)} mills
                                </p>
                              </div>
                            </div>
                            {totalMills > 0 && (
                              <div className="px-3 pb-2.5 sm:px-4">
                                <div className="space-y-0.5 font-mono text-[0.7rem] text-slate-600 sm:text-xs">
                                  <p>
                                    Metro total share = metro district total mills / total property tax mills
                                  </p>
                                  <p>
                                    = {totalDistrictMills.toFixed(3)} / {totalMills.toFixed(3)} ={" "}
                                    {totalDistrictShare.toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedDistrict && fullDistrict && (
                      <>
                        {showResultDetails && (
                          <div className="mt-3 space-y-3 text-sm text-slate-700 sm:text-base">
                            <div className="border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4">
                              <p className="font-medium text-indigo-950">
                                Metro mills (from the county data)
                              </p>
                              <div className="mt-1 space-y-1 font-mono text-xs text-slate-700 sm:text-sm">
                                <p>
                                  <strong>Metro operations mills</strong>: {metroOpsMills.toFixed(3)}
                                </p>
                                <p>
                                  <strong className="text-red-900">Metro debt service mills</strong>:{" "}
                                  {metroDebtMillsFromAggregates.toFixed(3)}
                                </p>
                                {totalDistrictMills > 0 && (
                                  <p>
                                    <strong>Metro total mills (ops + debt)</strong>: {totalDistrictMills.toFixed(3)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <LevyLinesCard
                              title="Debt service lines"
                              description="Line items from the county form that are categorized as debt payments (bonds and similar obligations)."
                              levies={metroDebtLevies}
                              rateToMills={RATE_TO_MILLS}
                              tone="debt"
                            />
                            <LevyLinesCard
                              title="Operations lines"
                              description="Line items from the county form that are categorized as operations (the metro district&apos;s ongoing services and administration)."
                              levies={metroOpsLevies}
                              rateToMills={RATE_TO_MILLS}
                            />
                            <p className="text-[0.7rem] text-slate-500 sm:text-xs">
                              Based on the county&apos;s mill levy public information form
                              for tax year {levyJson.year}.{" "}
                              {levyJson.source?.title
                                ? `Source: ${levyJson.source.title}.`
                                : null}
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

