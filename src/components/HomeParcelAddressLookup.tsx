"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CountyAssessorMillLevyFigures } from "@/components/CountyAssessorMillLevyFigures";
import { CountyParcelPinLookupHelp } from "@/components/CountyParcelPinLookupHelp";
import { InfoHintPopover } from "@/components/InfoHintPopover";
import { LevyStackVisualization } from "@/components/LevyStackVisualization";
import { MetroTaxShareFlow } from "@/components/MetroTaxShareFlow";
import { TermLevyAside, TermLgIdAside, TermMillsAside } from "@/content/termDefinitions";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
import { formatTaxAreaShortDescrDisplay } from "@/lib/arapahoeParcelLevyData";
import {
  loadLevyStackFromPin,
  type CommittedLevyLine,
} from "@/lib/committedLevyLine";
import {
  buildSitusLookupKey,
  fetchArapahoeSitusToPinsJson,
  lookupPinsBySitusKey,
  normalizeStreetNameKey,
  resolveSitusFieldsForLookup,
  situsUnitLooksLikeStreetAutofillDuplicate,
  SITUS_AUTOFILL_LINE1_MAX_LEN,
  SITUS_INPUT_MAX_LEN,
  trySitusAutofillBlurSplit,
} from "@/lib/arapahoeSitusLookup";
import { metroFromLevyLines } from "@/lib/metroDistrictFromLevyLines";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH } from "@/lib/arapahoeCountyUrls";
import {
  CARD_BODY_CLASS,
  CARD_CLASS_CLIPPED,
  CARD_HEADER_CLASS,
  COUNTY_EXTERNAL_LINK_CLASS,
  INPUT_CLASS,
} from "@/lib/toolFlowStyles";

const INPUT_ROW = `${INPUT_CLASS} min-w-0 w-full !max-w-none px-2 py-2 text-base sm:text-base`;
const INPUT_PIN_ROW = `${INPUT_CLASS} w-full min-w-0 max-w-none px-2 py-2 text-base`;
const FIELD_LABEL_CLASS =
  "whitespace-nowrap text-xs font-medium text-slate-700 sm:text-sm";

/**
 * Label strip above each control. From md up, the form uses CSS Grid with a dedicated
 * label row and input row (via `md:contents` on field wrappers), so labels align without
 * a fixed min-height. On small screens the wrapper stays a normal block; `mb-1` separates
 * label from input inside that stack.
 */
const FIELD_LABEL_RAIL = "mb-1 flex items-end md:mb-0";

/** Full class strings so Tailwind can scan them; centralizes md 2-col vs lg 5-col placement. */
const ADDRESS_LOOKUP_FORM_CLASS =
  "grid w-full min-w-0 grid-cols-1 gap-y-2.5 gap-x-0 max-md:justify-items-stretch md:grid-cols-2 md:gap-3 md:gap-y-2 lg:grid-cols-[minmax(0,6rem)_minmax(0,8.5rem)_minmax(12rem,1fr)_minmax(0,7rem)_auto] lg:grid-rows-[auto_auto] lg:gap-x-3 lg:gap-y-2";

const ADDRESS_FIELD_GRID_SHELL = "w-full min-w-0 md:contents";

const addressSitusGrid = {
  numberLabel:
    "md:col-start-1 md:row-start-1 lg:col-start-1 lg:row-start-1",
  numberInput:
    "md:col-start-1 md:row-start-2 lg:col-start-1 lg:row-start-2",
  suffixLabel:
    "md:col-start-2 md:row-start-1 lg:col-start-2 lg:row-start-1",
  suffixInput:
    "md:col-start-2 md:row-start-2 lg:col-start-2 lg:row-start-2",
  streetLabel:
    "md:col-span-2 md:col-start-1 md:row-start-3 lg:col-span-1 lg:col-start-3 lg:row-start-1",
  streetInput:
    "md:col-span-2 md:col-start-1 md:row-start-4 lg:col-span-1 lg:col-start-3 lg:row-start-2",
  unitLabel:
    "md:col-start-1 md:row-start-5 lg:col-start-4 lg:row-start-1",
  unitInput:
    "md:col-start-1 md:row-start-6 lg:col-start-4 lg:row-start-2",
  actions:
    "md:col-start-2 md:row-start-6 md:flex-row md:items-end md:gap-2 lg:col-start-5 lg:row-start-2 lg:flex-row lg:items-end",
} as const;

const ADDRESS_FORM_ACTION_BTN_CLASS = `${btnOutlinePrimaryMd} inline-flex w-full min-w-0 justify-center sm:flex-1 md:flex-1 lg:w-auto lg:min-w-[7.5rem] lg:flex-none`;

const HOME_DEFINITIONS_HEADING_CLASS =
  "text-lg font-semibold text-slate-900 sm:text-xl";

/** Autocomplete section token paired with `address-line1` on the Number input (mobile autofill). */
const AC_SECTION = "section-arapahoe-situs";

export function HomeParcelAddressLookup() {
  const [streetNumber, setStreetNumber] = useState("");
  const [streetNumberSuffix, setStreetNumberSuffix] = useState("");
  const [streetName, setStreetName] = useState("");
  const [unit, setUnit] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<{ pin: string; label: string }[] | null>(
    null,
  );
  const [showCountyPinFallback, setShowCountyPinFallback] = useState(false);

  const [levyLines, setLevyLines] = useState<CommittedLevyLine[]>([]);
  const [levyLoadedMeta, setLevyLoadedMeta] = useState<{
    pin: string;
    tagShortDescr: string;
    levyAspxUrl: string;
  } | null>(null);
  const [levyAwaitingTemplateMills, setLevyAwaitingTemplateMills] =
    useState(false);
  const [levyTemplateMillDrafts, setLevyTemplateMillDrafts] = useState<
    Record<string, string>
  >({});
  const [levyTemplateMillsError, setLevyTemplateMillsError] = useState<
    string | null
  >(null);
  const [levyLoadBusy, setLevyLoadBusy] = useState(false);
  const [levyLoadError, setLevyLoadError] = useState<string | null>(null);
  /** Parcel PIN lives only in the address card; levy and metro panels read loaded data, not a second PIN field. */
  const [parcelPin, setParcelPin] = useState("");

  /** Opens levy / metro / hub without a PIN load (user builds the stack with Add tile). */
  const [homeLevyWorkbenchOpen, setHomeLevyWorkbenchOpen] = useState(false);
  const addressPanelId = useId();
  const addressDisclosureId = useId();
  const [addressSectionExpanded, setAddressSectionExpanded] = useState(true);
  const prevSuccessfulLoadKeyRef = useRef<string | null>(null);
  const prevAddressExpandedRef = useRef(true);

  const levyReadyForSummary =
    levyLoadedMeta != null &&
    !levyLoadError &&
    !levyLoadBusy;
  const successfulLoadKey = levyReadyForSummary ? levyLoadedMeta.pin : null;
  const loadedTaxAuthCodeDisplay =
    levyLoadedMeta != null
      ? formatTaxAreaShortDescrDisplay(levyLoadedMeta.tagShortDescr)
      : "";
  const hasLoadedTaxAuthCode = loadedTaxAuthCodeDisplay.length > 0;

  useEffect(() => {
    if (successfulLoadKey == null) {
      prevSuccessfulLoadKeyRef.current = null;
      setAddressSectionExpanded(true);
      return;
    }
    if (successfulLoadKey !== prevSuccessfulLoadKeyRef.current) {
      prevSuccessfulLoadKeyRef.current = successfulLoadKey;
      setAddressSectionExpanded(false);
    }
  }, [successfulLoadKey]);

  /** Mobile autofill often ignores autocomplete=off on Unit; strip duplicate street lines. */
  useEffect(() => {
    if (
      !situsUnitLooksLikeStreetAutofillDuplicate(
        unit,
        streetNumber,
        streetNumberSuffix,
        streetName,
      )
    ) {
      return;
    }
    setUnit("");
  }, [unit, streetNumber, streetNumberSuffix, streetName]);

  useEffect(() => {
    if (
      prevAddressExpandedRef.current &&
      !addressSectionExpanded &&
      levyReadyForSummary
    ) {
      const heading = document.getElementById("home-levy-breakdown-heading");
      if (heading instanceof HTMLElement) {
        const reduceMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        heading.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
        // Move focus to the levy section so keyboard and SR users land with the
        // viewport (scroll alone does not move focus).
        const moveFocus = () =>
          heading.focus({ preventScroll: true });
        if (reduceMotion) {
          queueMicrotask(moveFocus);
        } else {
          window.setTimeout(moveFocus, 450);
        }
      }
    }
    prevAddressExpandedRef.current = addressSectionExpanded;
  }, [addressSectionExpanded, levyReadyForSummary]);

  const clearAllLevyState = useCallback(() => {
    setLevyLines([]);
    setLevyLoadedMeta(null);
    setLevyAwaitingTemplateMills(false);
    setLevyTemplateMillDrafts({});
    setLevyTemplateMillsError(null);
    setLevyLoadError(null);
    setLevyLoadBusy(false);
    setParcelPin("");
    setHomeLevyWorkbenchOpen(false);
  }, []);

  function clearLevyStackOnly() {
    setLevyLines([]);
    setLevyAwaitingTemplateMills(false);
    setLevyTemplateMillDrafts({});
    setLevyLoadedMeta(null);
    setLevyTemplateMillsError(null);
  }

  const loadLevyStack = useCallback(async (pin: string) => {
    setLevyLoadError(null);
    setLevyTemplateMillsError(null);
    setLevyLoadBusy(true);
    try {
      const result = await loadLevyStackFromPin(pin);
      if (!result.ok) {
        setLevyLoadError(result.error);
        return;
      }
      setParcelPin(result.matchedPin);
      setLevyLines(result.lines);
      setLevyAwaitingTemplateMills(result.awaitingTemplateMills);
      setLevyTemplateMillDrafts(result.templateMillDrafts);
      setLevyLoadedMeta({
        pin: result.matchedPin,
        tagShortDescr: result.tagShortDescr,
        levyAspxUrl: result.levyAspxUrl,
      });
    } finally {
      setLevyLoadBusy(false);
    }
  }, []);

  const sumMills = useMemo(() => {
    const s = levyLines.reduce((acc, l) => acc + l.mills, 0);
    return Math.round(s * 1000) / 1000;
  }, [levyLines]);

  const metroPrefillTotalMills = useMemo(() => {
    if (levyAwaitingTemplateMills) return null;
    if (sumMills <= 0) return null;
    return sumMills;
  }, [levyAwaitingTemplateMills, sumMills]);

  const homeMetroFromLevyStack = useMemo(
    () => metroFromLevyLines(levyLines),
    [levyLines],
  );
  const showHomeMetroSection = homeMetroFromLevyStack?.kind === "match";

  function clearParcelTemplateExtended() {
    clearLevyStackOnly();
    setLevyLoadError(null);
    setHomeLevyWorkbenchOpen(true);
  }

  function applySitusBlurSplit(
    rawFromInput: string,
    mode: "number" | "street",
  ) {
    const split = trySitusAutofillBlurSplit(rawFromInput, mode, {
      streetNumber,
      streetNumberSuffix,
      streetName,
    });
    if (!split) return;
    setStreetNumber(split.streetNumber);
    setStreetNumberSuffix(split.streetNumberSuffix);
    setStreetName(split.streetName);
  }

  async function onLookup() {
    if (busy) return;
    clearAllLevyState();
    setError(null);
    setHits(null);
    setShowCountyPinFallback(false);

    const { resolved, syncNumberFieldsToState, clearUnitToState } =
      resolveSitusFieldsForLookup(
        streetNumber,
        streetNumberSuffix,
        streetName,
        unit,
      );
    const { num, suffix, nameRaw, unitTrim } = resolved;

    if (syncNumberFieldsToState) {
      setStreetNumber(resolved.num);
      setStreetNumberSuffix(resolved.suffix);
      setStreetName(resolved.nameRaw);
    }
    if (clearUnitToState) {
      setUnit("");
    }

    if (num.length > SITUS_INPUT_MAX_LEN.streetNumber) {
      setError("Street number is too long.");
      return;
    }
    if (suffix.length > SITUS_INPUT_MAX_LEN.numberSuffix) {
      setError("Number suffix is too long.");
      return;
    }
    if (nameRaw.length > SITUS_INPUT_MAX_LEN.streetName) {
      setError("Street name is too long.");
      return;
    }
    if (unitTrim.length > SITUS_INPUT_MAX_LEN.unit) {
      setError("Unit is too long.");
      return;
    }
    if (!num || !/\d/.test(num)) {
      setError("Enter the number (digits).");
      return;
    }
    if (!nameRaw) {
      setError("Enter a street name.");
      return;
    }
    const nameNorm = normalizeStreetNameKey(nameRaw);
    if (!nameNorm) {
      setError(
        "Could not read a street name from that — try the main name of the road (for example Holly for South Holly Circle).",
      );
      return;
    }

    setBusy(true);
    try {
      const data = await fetchArapahoeSitusToPinsJson();
      if (!data?.byKey) {
        setError(
          "Address lookup data is missing. Run npm run build:arapahoe-index with Main Parcel Table.csv in supporting-data (see README).",
        );
        return;
      }
      const key = buildSitusLookupKey(num, suffix, nameRaw, unitTrim);
      if (!key) {
        setError("Could not build a lookup key from those fields.");
        return;
      }
      const list = lookupPinsBySitusKey(data, key);
      if (list.length === 0) {
        setShowCountyPinFallback(true);
        setError(
          "No property matched. Check spelling, add a unit if this is a multi-unit building, or confirm the address is in Arapahoe County.",
        );
        return;
      }
      setHits(list);
      if (list.length === 1) {
        setParcelPin(list[0].pin);
        void loadLevyStack(list[0].pin);
      }
    } finally {
      setBusy(false);
    }
  }

  function resetAddressForm() {
    setStreetNumber("");
    setStreetNumberSuffix("");
    setStreetName("");
    setUnit("");
    setError(null);
    setHits(null);
    setShowCountyPinFallback(false);
    clearAllLevyState();
  }

  const fieldsEmpty =
    !streetNumber.trim() &&
    !streetNumberSuffix.trim() &&
    !streetName.trim() &&
    !unit.trim();
  const hasLookupResults = hits != null && hits.length > 0;
  const hasLevyContent =
    levyLines.length > 0 ||
    levyAwaitingTemplateMills ||
    levyLoadedMeta != null;
  const trimmedParcelPin = parcelPin.trim();
  /** Omit wrapper when empty so parent space-y-5 does not add a stray gap above the stack. */
  const showLevyIntroBlock =
    !levyLoadBusy &&
    levyLines.length === 0 &&
    !levyLoadedMeta &&
    !levyAwaitingTemplateMills &&
    !levyLoadError;
  /** Single reset control for the whole home tool (address, PIN, levy, metro). */
  const showStartOverInAddressCard =
    !fieldsEmpty ||
    hasLookupResults ||
    error != null ||
    showCountyPinFallback ||
    hasLevyContent ||
    homeLevyWorkbenchOpen ||
    trimmedParcelPin.length > 0 ||
    levyLoadBusy ||
    levyLoadError != null;
  const startOverAriaLabel =
    "Reset address lookup, parcel PIN, search results, and levy and metro sections on this page";
  const pinMatchesLoadedLevy =
    trimmedParcelPin.length > 0 &&
    levyLoadedMeta != null &&
    levyLoadedMeta.pin === trimmedParcelPin;
  /** Hide when this PIN is already loaded OK; keep visible while a load is in flight (error retry clears error first). */
  const showPinLoadButton =
    trimmedParcelPin.length > 0 &&
    (!pinMatchesLoadedLevy || levyLoadError != null || levyLoadBusy);

  /**
   * Levy, metro, and hub stay hidden until a PIN load is attempted (in progress, error,
   * or success), the user opens the levy workbench from the address card, or there is
   * already levy content. Typing address fields or PIN alone does not reveal these
   * sections; address search results without a chosen/loaded PIN stay hidden too.
   */
  const showHomeLevyMetroAndHub =
    hasLevyContent ||
    levyLoadBusy ||
    levyLoadError != null ||
    homeLevyWorkbenchOpen;

  /** PIN entry + workbench shortcut stay hidden until address search needs a manual PIN path. */
  const showParcelPinSection =
    showCountyPinFallback || (hits != null && hits.length > 1);

  return (
    <>
      <section
        className={CARD_CLASS_CLIPPED}
        aria-labelledby={addressDisclosureId}
      >
        <h2 className={CARD_HEADER_CLASS}>
          <button
            type="button"
            id={addressDisclosureId}
            className="flex w-full cursor-pointer items-center justify-between gap-2 bg-transparent p-0 text-left text-base font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/75"
            aria-expanded={addressSectionExpanded}
            aria-controls={addressPanelId}
            onClick={() => setAddressSectionExpanded((open) => !open)}
          >
            <span className="min-w-0 flex-1">
              <span className="block">Start with your address</span>
              {levyReadyForSummary && !addressSectionExpanded ? (
                <span className="mt-0.5 block text-sm font-normal leading-snug text-white/85">
                  PIN {levyLoadedMeta.pin}
                  {hasLoadedTaxAuthCode ? (
                    <>
                      {" "}
                      · Taxing authority code {loadedTaxAuthCodeDisplay}
                    </>
                  ) : null}
                </span>
              ) : null}
            </span>
            <span className="shrink-0 text-white/90" aria-hidden>
              {addressSectionExpanded ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          </button>
        </h2>
        <div
          id={addressPanelId}
          role="region"
          aria-labelledby={addressDisclosureId}
          hidden={!addressSectionExpanded}
          className={`${CARD_BODY_CLASS} space-y-4 sm:space-y-5`}
        >
          <form
            className={ADDRESS_LOOKUP_FORM_CLASS}
            aria-label="Address lookup"
            noValidate
            aria-busy={busy}
            onSubmit={(e) => {
              e.preventDefault();
              void onLookup();
            }}
          >
            <div className={ADDRESS_FIELD_GRID_SHELL}>
              <div
                className={`${FIELD_LABEL_RAIL} ${addressSitusGrid.numberLabel}`}
              >
                <label
                  htmlFor="home-situs-number"
                  className={FIELD_LABEL_CLASS}
                >
                  Number
                </label>
              </div>
              <input
                id="home-situs-number"
                type="text"
                name="situs_line1"
                inputMode="text"
                enterKeyHint="next"
                autoComplete={`${AC_SECTION} address-line1`}
                spellCheck={false}
                maxLength={SITUS_AUTOFILL_LINE1_MAX_LEN}
                className={`${INPUT_ROW} ${addressSitusGrid.numberInput}`}
                value={streetNumber}
                onChange={(e) => setStreetNumber(e.target.value)}
                onBlur={(e) => applySitusBlurSplit(e.target.value, "number")}
                disabled={busy}
              />
            </div>
            <div className={ADDRESS_FIELD_GRID_SHELL}>
              <div
                className={`${FIELD_LABEL_RAIL} min-w-0 ${addressSitusGrid.suffixLabel}`}
              >
                <InfoHintPopover
                  textTrigger="Suffix"
                  textTriggerId="home-situs-suffix-label-trigger"
                  textTriggerClassName={FIELD_LABEL_CLASS}
                  ariaLabel="Optional letters or fraction after the street number (example: 1/2)."
                  disabled={busy}
                >
                  <span className="whitespace-nowrap">Ex. 3721 1/2</span>:{" "}
                  <span className="font-medium">3721</span> in the Number field,{" "}
                  <span className="font-medium">1/2</span> here.
                </InfoHintPopover>
              </div>
              <input
                id="home-situs-number-suffix"
                type="text"
                name="arapahoe_situs_number_suffix"
                enterKeyHint="next"
                autoComplete="off"
                spellCheck={false}
                maxLength={SITUS_INPUT_MAX_LEN.numberSuffix}
                className={`${INPUT_ROW} ${addressSitusGrid.suffixInput}`}
                aria-labelledby="home-situs-suffix-label-trigger"
                value={streetNumberSuffix}
                onChange={(e) => setStreetNumberSuffix(e.target.value)}
                disabled={busy}
                placeholder="optional"
              />
            </div>
            <div className={ADDRESS_FIELD_GRID_SHELL}>
              <div
                className={`${FIELD_LABEL_RAIL} ${addressSitusGrid.streetLabel}`}
              >
                <label
                  htmlFor="home-situs-street"
                  className={FIELD_LABEL_CLASS}
                >
                  Street name
                </label>
              </div>
              <input
                id="home-situs-street"
                type="text"
                name="arapahoe_situs_street_name"
                enterKeyHint="next"
                autoComplete="off"
                spellCheck={false}
                maxLength={SITUS_INPUT_MAX_LEN.streetName}
                className={`${INPUT_ROW} ${addressSitusGrid.streetInput}`}
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                onBlur={(e) => applySitusBlurSplit(e.target.value, "street")}
                disabled={busy}
                placeholder="e.g. Holly or South Holly Circle"
              />
            </div>
            <div className={ADDRESS_FIELD_GRID_SHELL}>
              <div
                className={`${FIELD_LABEL_RAIL} ${addressSitusGrid.unitLabel}`}
              >
                <label htmlFor="home-situs-unit" className={FIELD_LABEL_CLASS}>
                  Unit
                </label>
              </div>
              <input
                id="home-situs-unit"
                type="text"
                name="situs_unit"
                enterKeyHint="done"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                maxLength={SITUS_INPUT_MAX_LEN.unit}
                className={`${INPUT_ROW} ${addressSitusGrid.unitInput}`}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={busy}
                placeholder="optional"
              />
            </div>
            <div className="flex w-full min-w-0 flex-col md:contents">
              <div
                className={`flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2 ${addressSitusGrid.actions}`}
              >
                <button
                  type="submit"
                  className={ADDRESS_FORM_ACTION_BTN_CLASS}
                  disabled={busy}
                >
                  {busy ? "Searching…" : "Search"}
                </button>
                {showStartOverInAddressCard ? (
                  <button
                    type="button"
                    className={ADDRESS_FORM_ACTION_BTN_CLASS}
                    disabled={busy}
                    onClick={resetAddressForm}
                    aria-label={startOverAriaLabel}
                  >
                    Start over
                  </button>
                ) : null}
              </div>
            </div>
          </form>
          {showParcelPinSection ? (
            <div
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4"
              aria-labelledby="home-parcel-pin-heading"
            >
              <h3
                id="home-parcel-pin-heading"
                className="mb-2 text-sm font-semibold text-slate-900 sm:text-base"
              >
                Parcel PIN
              </h3>
              <p
                id="home-parcel-pin-hint"
                className="mb-3 text-sm text-slate-700"
              >
                {showCountyPinFallback
                  ? "Enter the PIN from your county parcel record (see help below if needed)."
                  : "Pick the row that matches your property below, or type a PIN here if you already know it. If you are unsure, verify on the county parcel record (see note under the list)."}
              </p>
              {levyReadyForSummary && hasLoadedTaxAuthCode ? (
                <p
                  id="home-parcel-pin-tax-auth"
                  className="mb-3 text-sm text-slate-600"
                >
                  Taxing authority code (the county levy screen labels this
                  &quot;Taxing authority&quot;):{" "}
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {loadedTaxAuthCodeDisplay}
                  </span>
                </p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                <div className="min-w-0 w-full sm:min-w-[12rem] sm:flex-1">
                  <label
                    htmlFor="home-parcel-pin-input"
                    className="sr-only"
                  >
                    Parcel PIN
                  </label>
                  <input
                    id="home-parcel-pin-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={24}
                    className={INPUT_PIN_ROW}
                    value={parcelPin}
                    onChange={(e) => setParcelPin(e.target.value)}
                    disabled={levyLoadBusy}
                    placeholder="from address search or county record"
                    aria-describedby={
                      levyReadyForSummary && hasLoadedTaxAuthCode
                        ? "home-parcel-pin-hint home-parcel-pin-tax-auth"
                        : "home-parcel-pin-hint"
                    }
                  />
                </div>
                {showPinLoadButton ? (
                  <button
                    type="button"
                    className={`${btnOutlinePrimaryMd} w-full shrink-0 justify-center py-3 sm:w-auto sm:whitespace-nowrap`}
                    disabled={levyLoadBusy}
                    onClick={() => void loadLevyStack(trimmedParcelPin)}
                  >
                    {levyLoadBusy ? "Loading…" : "Load property data"}
                  </button>
                ) : null}
              </div>
              {!showHomeLevyMetroAndHub ? (
                <p className="mt-3 text-sm text-slate-700">
                  <button
                    type="button"
                    className="font-medium text-indigo-950 underline decoration-indigo-700 decoration-2 underline-offset-2 hover:text-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/30 focus-visible:ring-offset-2"
                    onClick={() => setHomeLevyWorkbenchOpen(true)}
                  >
                    Add levy lines without loading a PIN
                  </button>
                  <span className="font-normal text-slate-600">
                    {" "}
                    — opens the breakdown below. Copy rows from your county{" "}
                    <strong className="font-semibold text-slate-800">
                      Tax District Levies
                    </strong>{" "}
                    screen using <strong className="font-semibold text-slate-800">Add tile</strong>.
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {showCountyPinFallback ? (
            <div
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4"
              role="region"
              aria-labelledby="home-county-pin-fallback-heading"
            >
              <h3
                id="home-county-pin-fallback-heading"
                className="mb-3 text-sm font-semibold text-slate-900 sm:text-base"
              >
                Find your PIN on the county site
              </h3>
              <CountyParcelPinLookupHelp includeLevyTableScreenshots />
              <p className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-700">
                Enter that PIN in the <strong>Parcel PIN</strong> field at the
                top of this card (under the address form).
              </p>
            </div>
          ) : null}
          {hits && hits.length > 0 ? (
            <div
              className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4"
              role="region"
              aria-live="polite"
              aria-label="Matching properties"
            >
              <p className="mb-2 text-sm font-semibold text-slate-900">
                {hits.length === 1
                  ? "One property matched"
                  : `${hits.length} properties matched — pick the row that matches your unit or legal description`}
              </p>
              {hits.length > 1 ? (
                <p className="mb-3 text-sm text-slate-700">
                  Not sure which PIN is yours? Open your parcel on the{" "}
                  <a
                    href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={COUNTY_EXTERNAL_LINK_CLASS}
                  >
                    county property search
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>{" "}
                  and compare the PIN to the address, unit, or legal description.
                </p>
              ) : null}
              <ul className="space-y-2 text-sm text-slate-800 sm:text-base">
                {hits.map((h) => (
                  <li
                    key={h.pin}
                    className="rounded-md border border-slate-200 bg-white px-3 py-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <span className="font-mono font-semibold text-slate-900">
                          {h.pin}
                        </span>
                        <span className="mt-1 block text-slate-700">
                          {h.label}
                        </span>
                      </div>
                      {hits.length > 1 ? (
                        <button
                          type="button"
                          className={`${btnOutlinePrimaryMd} w-full shrink-0 justify-center py-2.5 sm:w-auto sm:px-4`}
                          disabled={levyLoadBusy}
                          onClick={() => {
                            setParcelPin(h.pin);
                            void loadLevyStack(h.pin);
                          }}
                        >
                          Use this property
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              {hits.length === 1 && levyLoadBusy ? (
                <p className="mt-3 text-sm text-slate-600" aria-live="polite">
                  Loading your levy breakdown…
                </p>
              ) : null}
            </div>
          ) : null}
          {levyLoadError ? (
            <p className="text-sm text-red-700" role="alert">
              {levyLoadError}
            </p>
          ) : null}
        </div>
      </section>

      {showHomeLevyMetroAndHub ? (
        <>
      <section
        className={CARD_CLASS_CLIPPED}
        aria-labelledby="home-levy-breakdown-heading"
      >
        <h2
          id="home-levy-breakdown-heading"
          tabIndex={-1}
          className={`${CARD_HEADER_CLASS} outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/75`}
        >
          Your property tax bill
        </h2>
        <div className={`${CARD_BODY_CLASS} space-y-5`}>
          {levyLoadError ? (
            <p className="text-sm text-red-700" role="alert">
              {levyLoadError}
            </p>
          ) : null}

          {showLevyIntroBlock ? (
            <div className="space-y-5">
              <p className="text-sm text-slate-600 sm:text-base">
                Nothing loaded from a PIN yet — use{" "}
                <strong className="font-semibold text-slate-800">Load property data</strong>{" "}
                in the address card when you have a PIN, or tap{" "}
                <strong className="font-semibold text-slate-800">Add tile</strong>{" "}
                below to type lines from your county{" "}
                <strong className="font-semibold text-slate-800">Tax District Levies</strong>{" "}
                screen.
              </p>
              <div
                className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:p-4"
                aria-labelledby="home-levy-county-table-help-heading"
              >
                <h3
                  id="home-levy-county-table-help-heading"
                  className="mb-2 text-sm font-semibold text-slate-900 sm:text-base"
                >
                  Where to find those rows on the county site
                </h3>
                <p className="mb-3 text-sm text-slate-700 sm:text-base">
                  Open your parcel from the{" "}
                  <a
                    href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={COUNTY_EXTERNAL_LINK_CLASS}
                  >
                    county property search
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  . On the parcel record, use{" "}
                  <strong className="font-semibold text-slate-800">
                    Tax District Levies
                  </strong>{" "}
                  for the table (one row per <strong>Add tile</strong>).{" "}
                  <strong className="font-semibold text-slate-800">
                    2025 Mill Levy
                  </strong>{" "}
                  on that page is the total mills if you want to compare to your stack.
                </p>
                <CountyAssessorMillLevyFigures />
              </div>
            </div>
          ) : null}

          {showHomeMetroSection ? (
            <MetroTaxShareFlow
              idPrefix="home-metro"
              prefillTotalMills={metroPrefillTotalMills}
              metroFromLevyStack={homeMetroFromLevyStack}
            />
          ) : null}

          <div
            className={
              showHomeMetroSection
                ? "space-y-3 border-t border-slate-200 pt-6 sm:pt-7"
                : "space-y-3"
            }
            role="region"
            aria-labelledby={
              showHomeMetroSection
                ? "home-levy-stack-subheading"
                : undefined
            }
            aria-label={
              showHomeMetroSection ? undefined : "Levy stack visualization"
            }
          >
            {showHomeMetroSection ? (
              <p
                id="home-levy-stack-subheading"
                className="text-sm font-normal leading-snug text-slate-500 sm:text-base"
              >
                Your tax bill breakdown
              </p>
            ) : null}
            <LevyStackVisualization
              lines={levyLines}
              setLines={setLevyLines}
              loadedParcelMeta={levyLoadedMeta}
              awaitingTemplateMills={levyAwaitingTemplateMills}
              setAwaitingTemplateMills={setLevyAwaitingTemplateMills}
              templateMillDrafts={levyTemplateMillDrafts}
              setTemplateMillDrafts={setLevyTemplateMillDrafts}
              templateMillsError={levyTemplateMillsError}
              setTemplateMillsError={setLevyTemplateMillsError}
              onClearLoadedStack={clearParcelTemplateExtended}
              allowLineEdit
              termDefinitionsOnHomePage={levyReadyForSummary}
            />
          </div>
        </div>
      </section>
        </>
      ) : null}

      {levyReadyForSummary ? (
        <section
          id="page-definitions"
          aria-labelledby="home-page-definitions-heading"
          className="mt-10 w-full scroll-mt-8 border-t border-slate-200 pt-10"
        >
          <h2 id="home-page-definitions-heading" className={HOME_DEFINITIONS_HEADING_CLASS}>
            Definitions
          </h2>
          <TermMillsAside />
          <TermLevyAside />
          <TermLgIdAside />
        </section>
      ) : null}
    </>
  );
}
