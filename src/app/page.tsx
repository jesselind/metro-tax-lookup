"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { calculateDebtPercentage } from "@/lib/levyCalculator";
import levyData from "../../public/data/metro-levies-2025.json";
import propertyPageImg from "@/assets/images/mill-levy-property-page.png";
import millLevyDetailImg from "@/assets/images/mill-levy-detail.png";

const ASSESSOR_SEARCH_URL =
  "https://www.arapahoeco.gov/your_county/county_departments/assessor/property_search/search_residential_commercial_ag_and_vacant.php";

type MetroDistrictOption = {
  id: string;
  name: string;
  debtMills: number;
  totalMills: number;
};

/** Shape of a district entry in the imported levy JSON. */
type LevyDistrictFromJson = {
  districtId: string;
  name: string;
  type: string;
  aggregates?: { debtMills?: number; totalMills?: number };
};

const MAX_NAME_LEN = 48;
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
const CARD_CLASS_DROPDOWN = "rounded-xl border border-slate-700 bg-white";
const CARD_HEADER_CLASS_DROPDOWN =
  "rounded-t-xl bg-slate-700 px-4 py-3 text-base font-semibold text-white sm:px-5";
const CARD_BODY_CLASS_DROPDOWN = "rounded-b-xl bg-white px-4 py-4 sm:px-5 sm:py-5";

function InfoIcon() {
  return (
    <span
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-900 text-white"
      aria-hidden
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021" />
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path d="M12 8.25h.008v.008H12V8.25Z" />
      </svg>
    </span>
  );
}

function formatOptionLabel(m: MetroDistrictOption): string {
  const name =
    m.name.length > MAX_NAME_LEN
      ? `${m.name.slice(0, MAX_NAME_LEN - 1)}\u2026`
      : m.name;
  const mills = m.debtMills * RATE_TO_MILLS;
  return `${name} \u2014 debt mills ${mills.toFixed(3)}`;
}

function MetroDistrictSelect({
  metroOptions,
  selectedMetroId,
  onSelect,
}: {
  metroOptions: MetroDistrictOption[];
  selectedMetroId: string;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = metroOptions.find((m) => m.id === selectedMetroId);
  const displayLabel = selected
    ? formatOptionLabel(selected)
    : "Choose your district...";

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const id =
      focusedIndex === -1
        ? "metro-option-none"
        : `metro-option-${metroOptions[focusedIndex]?.id}`;
    const opt = id ? document.getElementById(id) : null;
    opt?.scrollIntoView({ block: "nearest" });
  }, [isOpen, focusedIndex, metroOptions]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        const idx = selectedMetroId
          ? metroOptions.findIndex((m) => m.id === selectedMetroId)
          : -1;
        setFocusedIndex(idx >= 0 ? idx : -1);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) =>
        i < metroOptions.length - 1 ? i + 1 : i
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => (i > -1 ? i - 1 : -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex === -1) {
        onSelect("");
      } else if (metroOptions[focusedIndex]) {
        onSelect(metroOptions[focusedIndex].id);
      }
      setIsOpen(false);
    }
  }

  return (
    <div className="relative mt-2" ref={containerRef}>
      <label id="metro-select-label" className="sr-only">
        Select metropolitan district
      </label>
      <button
        type="button"
        id="metro-select"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby="metro-select-label"
        className="flex min-h-[2.75rem] w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-base shadow-sm focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
        onClick={() => {
          if (!isOpen) {
            const idx = selectedMetroId
              ? metroOptions.findIndex((m) => m.id === selectedMetroId)
              : -1;
            setFocusedIndex(idx >= 0 ? idx : -1);
          }
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">{displayLabel}</span>
        <span
          className="ml-2 shrink-0 text-indigo-700"
          aria-hidden
        >
          {isOpen ? "\u25B2" : "\u25BC"}
        </span>
      </button>
      {isOpen && (
        <ul
          role="listbox"
          aria-labelledby="metro-select-label"
          className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded-md border border-indigo-400 bg-white py-1 shadow-lg"
          id="metro-listbox"
        >
          <li
            id="metro-option-none"
            role="option"
            aria-selected={!selectedMetroId}
            className={`cursor-pointer px-3 py-2.5 text-base text-slate-600 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${focusedIndex === -1 ? "bg-indigo-50" : "bg-white"
              }`}
            onClick={() => {
              onSelect("");
              setIsOpen(false);
            }}
            onMouseEnter={() => setFocusedIndex(-1)}
          >
            None / I don&apos;t have a metro district
          </li>
          {metroOptions.map((m, i) => (
            <li
              key={m.id}
              id={`metro-option-${m.id}`}
              role="option"
              aria-selected={m.id === selectedMetroId}
              className={`cursor-pointer px-3 py-2.5 text-base text-slate-900 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${i === focusedIndex ? "bg-indigo-50" : "bg-white"
                }`}
              onClick={() => {
                onSelect(m.id);
                setIsOpen(false);
              }}
              onMouseEnter={() => setFocusedIndex(i)}
              title={m.name.length > MAX_NAME_LEN ? m.name : undefined}
            >
              {formatOptionLabel(m)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function HomePage() {
  const [totalMillsInput, setTotalMillsInput] = useState("");
  const [showMetroHelpDetails, setShowMetroHelpDetails] = useState(false);
  const [showStepsDetails, setShowStepsDetails] = useState(false);
  const [knowsMetroName, setKnowsMetroName] = useState(false);
  const [selectedMetroId, setSelectedMetroId] = useState<string>("");

  const metroOptions: MetroDistrictOption[] = (
    levyData as { districts: LevyDistrictFromJson[] }
  ).districts
    .filter((d: LevyDistrictFromJson) => d.type === "metro")
    .map((d: LevyDistrictFromJson) => ({
      id: d.districtId,
      name: d.name,
      debtMills: d.aggregates?.debtMills ?? 0,
      totalMills: d.aggregates?.totalMills ?? 0,
    }))
    .filter((d: MetroDistrictOption) => d.debtMills > 0)
    .sort((a: MetroDistrictOption, b: MetroDistrictOption) =>
      a.name.localeCompare(b.name)
    );

  const totalMills = parseFloat(totalMillsInput) || 0;
  const selectedDistrict = metroOptions.find((m) => m.id === selectedMetroId);
  const metroDebtMills = selectedDistrict ? selectedDistrict.debtMills * RATE_TO_MILLS : 0;

  const { percentage } = calculateDebtPercentage(
    totalMills,
    metroDebtMills
  );

  const totalDistrictMills =
    selectedDistrict && totalMills > 0
      ? selectedDistrict.totalMills * RATE_TO_MILLS
      : 0;
  const totalDistrictShare =
    totalMills > 0 && totalDistrictMills > 0
      ? Math.round((totalDistrictMills / totalMills) * 1000) / 10
      : 0;

  const showResult = totalMills > 0 || metroDebtMills > 0;

  function handleStartOver() {
    setTotalMillsInput("");
    setKnowsMetroName(false);
    setSelectedMetroId("");
    setShowStepsDetails(false);
    setShowMetroHelpDetails(false);
  }

  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 pt-8 pb-4 sm:pt-12 sm:pb-6">
        <header className="pb-4 sm:pb-6">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-900 sm:text-base" aria-hidden>
            Arapahoe County
          </p>
          <h1 className="mt-2 bg-slate-700 px-4 py-3 text-2xl font-bold leading-tight tracking-tight text-white sm:mt-3 sm:px-5 sm:py-4 sm:text-3xl">
            What share of your property tax pays off your metro district&apos;s debt?
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-slate-600 sm:text-lg">
            Follow the steps below. You&apos;ll grab two numbers from the county site (or your bill), enter them here, and see your result.
          </p>
          <div
            className="mt-5 max-w-prose overflow-hidden rounded-xl border border-indigo-400 bg-indigo-50"
            role="region"
            aria-label="Important information"
          >
            <details className="group">
              <summary className="cursor-pointer bg-transparent px-4 py-3 text-indigo-950 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700 sm:px-5">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
                    <InfoIcon />
                    <span className="truncate">What&apos;s a metro district?</span>
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-slate-600 transition-transform duration-150 group-open:rotate-180"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </summary>
              <div className="bg-transparent px-4 pb-4 text-base text-slate-800 sm:px-5">
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
                    through their tax bill. Some districts are structured so that
                    insiders can lock in years of high tax collections with little
                    oversight, weak accountability, and almost no practical way
                    for homeowners to push back. In Colorado, metropolitan
                    districts are a type of special district, and special
                    districts are explicitly exempt from the jurisdiction of the
                    Colorado Independent Ethics Commission.
                  </p>
                </div>
              </div>
            </details>

            <div className="w-full border-t border-indigo-400" aria-hidden />

            <details className="group">
              <summary className="cursor-pointer bg-transparent px-4 py-3 text-indigo-950 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-700 sm:px-5">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
                    <InfoIcon />
                    <span className="truncate">What are &quot;mills&quot;?</span>
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-slate-600 transition-transform duration-150 group-open:rotate-180"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </summary>
              <div className="bg-transparent px-4 pb-4 text-base text-slate-800 sm:px-5">
                <p>
                  <strong>Mills</strong> are how property tax rates are shown on
                  your bill and the county site. You don&apos;t need to convert
                  them — just copy the numbers. For example, if the county shows
                  &quot;Total: 183.894,&quot; enter <span className="font-mono">183.894</span>.
                </p>
              </div>
            </details>
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
            {/* Step 1: Go to property lookup */}
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>Step 1 - Find your property</div>
                <div className={CARD_BODY_CLASS}>
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

            {/* Step 2: Find total mills on property details page */}
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>Step 2 - Find total mills</div>
                <div className={`${CARD_BODY_CLASS} space-y-2`}>
                  <p className="text-base text-slate-800 sm:text-lg">
                    On the property details page, find <strong>2025 Mill Levy</strong> (the total mills, example: 183.894). Enter it below.
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
                      <p className="mb-3">Look for <strong>2025 Mill Levy</strong> on the property details page.</p>
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
                      step="0.000001"
                      placeholder="Example: 183.894"
                      className={INPUT_CLASS}
                      value={totalMillsInput}
                      onChange={(e) => setTotalMillsInput(e.target.value)}
                      aria-describedby="total-mills-hint"
                    />
                    <p id="total-mills-hint" className="mt-1 text-sm text-slate-500 sm:text-base">Total property tax rate (mills)</p>
                  </div>
                </div>
              </div>
            </li>

            {/* Step 3: Get metro district debt — picker if they know name, or guide + image if not */}
            <li>
              <div className={CARD_CLASS_DROPDOWN}>
                <div className={CARD_HEADER_CLASS_DROPDOWN}>Step 3 - Metro debt mills</div>
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
                        On your property details page, tap the <strong>2025 Mill Levy</strong> number from Step 2. Find the row with your metro district&apos;s <strong>name</strong>.
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
                      Select your metro district here. We&apos;ll fill in the <strong>debt service mills</strong> automatically.
                    </p>
                    {metroOptions.length > 0 && (
                      <MetroDistrictSelect
                        metroOptions={metroOptions}
                        selectedMetroId={selectedMetroId}
                        onSelect={(id) => setSelectedMetroId(id)}
                      />
                    )}
                    <p className="mt-2 text-sm text-slate-500 sm:text-base">
                      {selectedDistrict
                        ? `Debt service mills used: ${metroDebtMills.toFixed(6)}`
                        : "If you do not have a metro district, leave this unselected."}
                    </p>
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
                      {percentage.toFixed(1)}%
                    </p>
                    <p className="mt-2 text-base font-medium text-slate-900 sm:text-lg">
                      {percentage > 0
                        ? `${percentage.toFixed(1)}% of your property taxes are paying off your metro district's debt.`
                        : "None of your property taxes go to metro district debt."}
                    </p>
                    {selectedDistrict && totalDistrictShare > 0 && (
                      <p className="mt-2 text-base text-slate-700 sm:text-lg">
                        {totalDistrictShare.toFixed(1)}% of your property taxes go to your metro district in total (operations + debt).
                      </p>
                    )}
                    <details className="mt-4 group">
                      <summary className="cursor-pointer text-sm font-medium text-indigo-900 hover:text-indigo-700">
                        Show the math
                      </summary>
                      <div className="mt-3 space-y-4 text-base text-slate-700 sm:text-lg">
                        <div>
                          <p className="mb-1 font-medium text-indigo-950">Debt service share</p>
                          <p className="font-mono text-sm sm:text-base">
                            (metro district debt mills &divide; total property tax mills) &times; 100
                          </p>
                          <p className="mt-0.5 font-mono text-sm sm:text-base">
                            = ({metroDebtMills.toFixed(3)} &divide; {totalMills.toFixed(3)}) &times; 100 = {percentage.toFixed(1)}%
                          </p>
                        </div>
                        {selectedDistrict && totalDistrictMills > 0 && (
                          <div>
                            <p className="mb-1 font-medium text-indigo-950">Metro district total share (operations + debt)</p>
                            <p className="font-mono text-sm sm:text-base">
                              (metro district total mills &divide; total property tax mills) &times; 100
                            </p>
                            <p className="mt-0.5 font-mono text-sm sm:text-base">
                              = ({totalDistrictMills.toFixed(3)} &divide; {totalMills.toFixed(3)}) &times; 100 = {totalDistrictShare.toFixed(1)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </details>
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

