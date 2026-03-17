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

type LevyLineFromJson = {
  purposeRaw: string;
  purposeCategory: string;
  rateMillsCurrent: number;
  rateMillsPrevious: number | null;
  taborExempt: boolean | null;
  rawRowIndex: number;
};

/** Shape of a district entry in the imported levy JSON. */
type LevyDistrictFromJson = {
  districtId: string;
  name: string;
  type: string;
  aggregates?: { opsMills?: number; debtMills?: number; totalMills?: number };
  levies?: LevyLineFromJson[];
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
const CARD_CLASS_DROPDOWN =
  "overflow-visible rounded-xl border border-slate-700 bg-slate-700";
const CARD_HEADER_CLASS_DROPDOWN =
  "px-4 py-3 text-base font-semibold text-white sm:px-5";
const CARD_BODY_CLASS_DROPDOWN =
  "rounded-b-xl bg-white px-4 py-4 sm:px-5 sm:py-5";

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

  const activeDescendantId = isOpen
    ? focusedIndex === -1
      ? "metro-option-none"
      : `metro-option-${metroOptions[focusedIndex]?.id}`
    : undefined;

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
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="metro-listbox"
        aria-labelledby="metro-select-label"
        aria-activedescendant={activeDescendantId}
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
  const [showResultDetails, setShowResultDetails] = useState(false);

  const levyJson = levyData as {
    year: number;
    source?: { title?: string };
    districts: LevyDistrictFromJson[];
  };

  const metroOptions: MetroDistrictOption[] = levyJson.districts
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
  const metroTotalMillsFromAggregates =
    metroOpsMills + metroDebtMillsFromAggregates;
  const metroDebtShareWithinDistrict =
    metroTotalMillsFromAggregates > 0
      ? (metroDebtMillsFromAggregates / metroTotalMillsFromAggregates) * 100
      : 0;
  const metroOpsShareWithinDistrict =
    metroTotalMillsFromAggregates > 0
      ? (metroOpsMills / metroTotalMillsFromAggregates) * 100
      : 0;
  const showResult = totalMills > 0 || metroDebtMills > 0;

  function handleStartOver() {
    setTotalMillsInput("");
    setKnowsMetroName(false);
    setSelectedMetroId("");
    setShowStepsDetails(false);
    setShowMetroHelpDetails(false);
    setShowResultDetails(false);
  }

  const resultAnnouncement = showResult
    ? percentage > 0
      ? `${percentage.toFixed(1)} percent of your property taxes go to metro district debt service`
      : "No metro district debt shown in your property tax rate"
    : "";

  return (
    <main className="flex min-h-screen flex-col bg-white text-slate-900">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {resultAnnouncement}
      </div>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 pt-8 pb-4 sm:pt-12 sm:pb-6">
        <header className="pb-4 sm:pb-6">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-900 sm:text-base" aria-hidden>
            Arapahoe County
          </p>
          <h1 className="mt-2 bg-slate-700 px-4 py-3 text-2xl font-bold leading-tight tracking-tight text-white sm:mt-3 sm:px-5 sm:py-4 sm:text-3xl">
            What share of your property tax pays off your metro district&apos;s debt?
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-slate-600 sm:text-lg">
            Not all Colorado properties are in a metropolitan district. If your property is not in a metro district, you do not need this tool.
          </p>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-slate-500 sm:text-base">
            If you are unsure whether your property is in a district, you can look it up on the state&apos;s{" "}
            <a
              href="https://gis.dola.colorado.gov/CO_SpecialDistrict/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-900 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800"
            >
              Colorado Special Districts map
            </a>
            .
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
                  <strong>Mills</strong> are the units used to express property
                  tax rates. One mill means <strong>$1 of tax for every $1,000 of
                  taxable (assessed) value</strong>. So if your assessed value is
                  $400,000 and the rate is 100 mills, your tax from that rate
                  would be about $400.
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

            {/* Step 2: Find total property tax mills on property details page */}
            <li>
              <div className={CARD_CLASS_CLIPPED}>
                <div className={CARD_HEADER_CLASS}>Step 2 - Find total property tax mills</div>
                <div className={`${CARD_BODY_CLASS} space-y-2`}>
                  <p className="text-base text-slate-800 sm:text-lg">
                    On the property details page, find <strong>2025 Mill Levy</strong> (your total property tax mills, example: 183.894). Enter it below.
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
                      step="0.001"
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
                    <p className="mt-1.5 text-xs text-slate-500 sm:text-sm">
                      Only districts that report debt service mills are listed.
                    </p>
                    {selectedDistrict && (
                      <p className="mt-2 text-sm text-slate-500 sm:text-base">
                        Debt service mills used: {metroDebtMills.toFixed(6)}
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
                      {percentage.toFixed(1)}%
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700 sm:text-base">
                      {percentage > 0
                        ? "Share of your property taxes going to metro district debt"
                        : "No metro district debt shown in your property tax rate"}
                    </p>
                    <div className="mt-4 divide-y divide-slate-200 border border-slate-200 bg-slate-50 text-sm sm:text-base">
                      <div>
                        <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 sm:px-4">
                          <div className="text-slate-700">
                            <p className="font-medium">Metro debt share</p>
                            <p className="text-xs text-slate-500 sm:text-sm">
                              Portion of your total property tax rate going to metro district debt
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {percentage.toFixed(1)}%
                            </p>
                            <p className="font-mono text-xs text-slate-600 sm:text-sm">
                              {metroDebtMills.toFixed(3)} mills
                            </p>
                          </div>
                        </div>
                        {showResultDetails && totalMills > 0 && (
                          <div className="px-3 pb-2.5 sm:px-4">
                            <div className="space-y-0.5 font-mono text-[0.7rem] text-slate-600 sm:text-xs">
                              <p>
                                Metro debt share = metro district debt mills / total property tax mills
                              </p>
                              <p>
                                = {metroDebtMills.toFixed(3)} / {totalMills.toFixed(3)} ={" "}
                                {percentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedDistrict && totalDistrictShare > 0 && (
                        <div>
                          <div className="flex items-baseline justify-between gap-4 px-3 py-2.5 sm:px-4">
                            <div className="text-slate-700">
                              <p className="font-medium">
                                Metro total share (ops + debt)
                              </p>
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
                          {showResultDetails && totalMills > 0 && (
                            <div className="px-3 pb-2.5 sm:px-4">
                              <div className="space-y-0.5 font-mono text-[0.7rem] text-slate-600 sm:text-xs">
                                <p>
                                  Metro total share (ops + debt) = metro district total mills / total property tax mills
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
                    {selectedDistrict && fullDistrict && (
                      <>
                        {showResultDetails && (
                          <div className="mt-3 space-y-3 text-sm text-slate-700 sm:text-base">
                            <div className="border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4">
                              <p className="font-medium text-indigo-950">
                                Visual breakdown
                              </p>
                              {totalMills > 0 && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-slate-600 sm:text-sm">
                                    Metro debt vs total bill
                                  </p>
                                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div
                                      className="h-full bg-indigo-600"
                                      style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                                    />
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-[0.7rem] text-slate-600 sm:text-xs">
                                    <span className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                      Metro debt {percentage.toFixed(1)}%
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                                      Everything else{" "}
                                      {(Math.max(0, 100 - percentage)).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              )}
                              {totalMills > 0 && totalDistrictShare > 0 && (
                                <div className="mt-3 space-y-1">
                                  <p className="text-xs text-slate-600 sm:text-sm">
                                    Metro total (ops + debt) vs total bill
                                  </p>
                                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div
                                      className="h-full bg-indigo-400"
                                      style={{
                                        width: `${Math.min(Math.max(totalDistrictShare, 0), 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-[0.7rem] text-slate-600 sm:text-xs">
                                    <span className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                                      Metro total {totalDistrictShare.toFixed(1)}%
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                                      Everything else{" "}
                                      {(Math.max(0, 100 - totalDistrictShare)).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              )}
                              {metroTotalMillsFromAggregates > 0 && (
                                <div className="mt-3 space-y-1">
                                  <p className="text-xs text-slate-600 sm:text-sm">
                                    Metro district: operations vs debt (within metro mills)
                                  </p>
                                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div
                                      className="h-full bg-emerald-500"
                                      style={{
                                        width: `${Math.min(
                                          Math.max(metroOpsShareWithinDistrict, 0),
                                          100
                                        )}%`,
                                      }}
                                    />
                                    <div
                                      className="relative -mt-2.5 h-2.5 bg-transparent"
                                      aria-hidden
                                    >
                                      <div
                                        className="h-2.5 bg-indigo-500"
                                        style={{
                                          width: `${Math.min(
                                            Math.max(metroDebtShareWithinDistrict, 0),
                                            100
                                          )}%`,
                                          marginLeft: `${Math.min(
                                            Math.max(metroOpsShareWithinDistrict, 0),
                                            100
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-1 flex items-center justify-between text-[0.7rem] text-slate-600 sm:text-xs">
                                    <span className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                      Ops {metroOpsShareWithinDistrict.toFixed(1)}%
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                      Debt {metroDebtShareWithinDistrict.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="border border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4">
                              <p className="font-medium text-indigo-950">
                                Metro mills (from the county data)
                              </p>
                              <div className="mt-1 space-y-1 font-mono text-xs text-slate-700 sm:text-sm">
                                <p>
                                  <strong>Metro operations mills</strong>: {metroOpsMills.toFixed(3)}
                                </p>
                                <p>
                                  <strong>Metro debt service mills</strong>: {metroDebtMillsFromAggregates.toFixed(3)}
                                </p>
                                {totalDistrictMills > 0 && (
                                  <p>
                                    <strong>Metro total mills (ops + debt)</strong>: {totalDistrictMills.toFixed(3)}
                                  </p>
                                )}
                              </div>
                            </div>
                            {metroDebtLevies.length > 0 && (
                              <div className="border border-slate-200 bg-slate-50">
                                <div className="px-3 py-2.5 sm:px-4">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-indigo-950">
                                      Debt service lines
                                    </p>
                                  </div>
                                  <p className="mt-0.5 text-[0.7rem] text-slate-500 sm:text-xs">
                                    Line items from the county form that are categorized as debt payments (bonds and similar obligations).
                                  </p>
                                </div>
                                <ul className="divide-y divide-slate-200">
                                  {metroDebtLevies.slice(0, 3).map((levy) => (
                                    <li
                                      key={levy.rawRowIndex}
                                      className="flex items-baseline justify-between gap-3 px-3 py-2 sm:px-4"
                                    >
                                      <span className="text-xs sm:text-sm">
                                        {levy.purposeRaw}
                                      </span>
                                      <span className="flex flex-col items-end text-right">
                                        <span className="text-xs font-mono text-slate-700 sm:text-sm">
                                          {(levy.rateMillsCurrent * RATE_TO_MILLS).toFixed(3)}{" "}
                                          mills
                                        </span>
                                        {levy.taborExempt && (
                                          <span className="mt-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-amber-900">
                                            TABOR-exempt
                                          </span>
                                        )}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {metroOpsLevies.length > 0 && (
                              <div className="border border-slate-200 bg-slate-50">
                                <div className="px-3 py-2.5 sm:px-4">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-indigo-950">
                                      Operations lines
                                    </p>
                                  </div>
                                  <p className="mt-0.5 text-[0.7rem] text-slate-500 sm:text-xs">
                                    Line items from the county form that are categorized as operations (the metro district&apos;s ongoing services and administration).
                                  </p>
                                </div>
                                <ul className="divide-y divide-slate-200">
                                  {metroOpsLevies.slice(0, 3).map((levy) => (
                                    <li
                                      key={levy.rawRowIndex}
                                      className="flex items-baseline justify-between gap-3 px-3 py-2 sm:px-4"
                                    >
                                      <span className="text-xs sm:text-sm">
                                        {levy.purposeRaw}
                                      </span>
                                      <span className="flex flex-col items-end text-right">
                                        <span className="text-xs font-mono text-slate-700 sm:text-sm">
                                          {(levy.rateMillsCurrent * RATE_TO_MILLS).toFixed(3)}{" "}
                                          mills
                                        </span>
                                        {levy.taborExempt && (
                                          <span className="mt-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-amber-900">
                                            TABOR-exempt
                                          </span>
                                        )}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
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

