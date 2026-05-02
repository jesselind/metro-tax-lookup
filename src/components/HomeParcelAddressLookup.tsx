// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CountyAssessorMillLevyFigures } from "@/components/CountyAssessorMillLevyFigures";
import { CountyParcelPinLookupHelp } from "@/components/CountyParcelPinLookupHelp";
import { InlineErrorCallout } from "@/components/InlineErrorCallout";
import { MailContactCard } from "@/components/MailContactCard";
import { InfoHintPopover } from "@/components/InfoHintPopover";
import { InfoIcon } from "@/components/InfoIcon";
import {
  LevyStackVisualization,
  type LevyStackVisualizationProps,
} from "@/components/LevyStackVisualization";
import { MetroTaxShareFlow } from "@/components/MetroTaxShareFlow";
import { ParcelTermPopoverPanel } from "@/content/termDefinitionBodies";
import {
  TermActualValueAside,
  TermAssessedValueAside,
  TermCompsAside,
  TermLevyAside,
  TermPropertyClassificationAside,
  TermLgIdAside,
  TermMillsAside,
  TermOwnerListAside,
  TermParcelAside,
  TermPinAside,
  TermSpecialDistrictsAside,
  TermTagAside,
  TermTaxEntityAside,
} from "@/content/termDefinitions";
import {
  btnOutlinePrimaryMd,
  btnOutlineSecondaryMd,
  btnPrimaryMd,
} from "@/lib/buttonClasses";
import {
  CONTACT_EMAIL,
  REPORT_PROBLEM_MAILTO_HREF,
} from "@/lib/contact";
import {
  loadLevyStackFromPin,
  type CommittedLevyLine,
  type ParcelValuesFromExport,
} from "@/lib/committedLevyLine";
import {
  fetchArapahoeLevyStacksJson,
  fetchArapahoePinToTagJson,
} from "@/lib/arapahoeParcelLevyData";
import {
  buildSitusLookupKey,
  fetchArapahoeSitusToPinsJson,
  lookupPinsBySitusKey,
  normalizeStreetNameKey,
  parseSimpleAddressLineForSitusLookup,
  resolveSitusFieldsForLookup,
  situsUnitLooksLikeStreetAutofillDuplicate,
  SITUS_AUTOFILL_LINE1_MAX_LEN,
  SITUS_INPUT_MAX_LEN,
  SITUS_SIMPLE_ADDRESS_LINE_MAX_LEN,
  trySitusAutofillBlurSplit,
} from "@/lib/arapahoeSitusLookup";
import { metroFromLevyLines } from "@/lib/metroDistrictFromLevyLines";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH } from "@/lib/arapahoeCountyUrls";
import { safeArapahoeCompsGridPdfUrl } from "@/lib/safeExternalHref";
import { formatUsdWhole } from "@/lib/formatUsd";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
  DASHBOARD_TILE_RADIUS_CLASS,
  INPUT_CLASS,
  PARCEL_SUMMARY_ROW_CLASS,
  PARCEL_SUMMARY_TILE_ADDRESS_CLASS,
  PARCEL_SUMMARY_TILE_BODY_CLASS,
  PARCEL_SUMMARY_TILE_CLASS,
  PARCEL_SUMMARY_TILE_CLASS_POPOVER,
  PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS,
  PARCEL_SUMMARY_TILE_LABEL_CLASS,
  PARCEL_SUMMARY_TILE_VALUE_CLASS,
  PARCEL_SUMMARY_VALUE_PAIR_ROW_CLASS,
  PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";

/** Wider, scrollable panel for parcel summary term popovers (label copy can run long). */
const PARCEL_TERM_POPOVER_PANEL_CLASS =
  "max-w-[min(22rem,calc(100vw-2rem))] max-h-[min(18rem,60vh)] overflow-y-auto overscroll-contain";

/**
 * PIN + levy-stack JSON (~41MB) are needed right after situs lookup. Starting these fetches
 * while situs (~19MB) downloads overlaps network time (same cached promises as loadLevyStackFromPin).
 */
function prefetchParcelLevyJsonBundle(): void {
  void fetchArapahoePinToTagJson();
  void fetchArapahoeLevyStacksJson();
}

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

/** Single-line first step: label row + input row + Search (md: one row). */
const SIMPLE_ADDRESS_FORM_CLASS =
  "grid w-full min-w-0 grid-cols-1 gap-y-2.5 gap-x-0 md:grid-cols-[1fr_auto] md:items-end md:gap-x-3";

/** Below md: single column stack; from md up: one label row + one input row (5 cols + Search). */
const ADDRESS_LOOKUP_FORM_CLASS =
  "grid w-full min-w-0 grid-cols-1 gap-y-2.5 gap-x-0 max-md:justify-items-stretch md:grid-cols-[minmax(0,6rem)_minmax(0,8.5rem)_minmax(12rem,1fr)_minmax(0,7rem)_auto] md:grid-rows-[auto_auto] md:gap-x-3 md:gap-y-2";

const ADDRESS_FIELD_GRID_SHELL = "w-full min-w-0 md:contents";

const addressSitusGrid = {
  numberLabel: "md:col-start-1 md:row-start-1",
  numberInput: "md:col-start-1 md:row-start-2",
  suffixLabel: "md:col-start-2 md:row-start-1",
  suffixInput: "md:col-start-2 md:row-start-2",
  streetLabel: "md:col-start-3 md:row-start-1",
  streetInput: "md:col-start-3 md:row-start-2",
  unitLabel: "md:col-start-4 md:row-start-1",
  unitInput: "md:col-start-4 md:row-start-2",
  actions:
    "md:col-start-5 md:row-start-2 md:flex-row md:items-end md:gap-2",
} as const;

const ADDRESS_FORM_ACTION_BTN_CLASS = `${btnPrimaryMd} inline-flex w-full min-w-0 justify-center md:w-auto md:min-w-[8.75rem] md:flex-none`;

/** Shared shell for county help, PIN fallback, and list callouts. */
const ADDRESS_TILE_SURFACE_CLASS = `${DASHBOARD_TILE_RADIUS_CLASS} border border-slate-200 bg-slate-50/80`;

const ADDRESS_LOOKUP_PANEL_CLASS = `${ADDRESS_TILE_SURFACE_CLASS} p-3 sm:p-4`;

const HOME_DEFINITIONS_HEADING_CLASS =
  "text-base font-semibold text-slate-800 sm:text-lg";

/** Autocomplete section token paired with `address-line1` on the Number input (mobile autofill). */
const AC_SECTION = "section-arapahoe-situs";

/** Same-page anchor for the manual levy / breakdown region (Parcel PIN card link). */
const HOME_LEVY_BREAKDOWN_ID = "home-levy-breakdown-heading";

const HOME_ADDRESS_LOOKUP_ERROR_ID = "home-address-lookup-error";
const DEMO_SOURCE_PIN = "035457397";
const DEMO_DISPLAY_PIN = "000000000";
const DEMO_ADDRESS_LABEL = "1234 Example Lane, Watkins";
const DEMO_OWNER_LIST = "John Doe, Jane Doe";
const DEMO_PROPERTY_CLASSIFICATION = "Residential";

export type HomeParcelAddressLookupProps = {
  /** Fires when the header should offer Start over (any active address / result / PIN path). */
  onViewingParcelChange?: (viewingParcel: boolean, reset: () => void) => void;
};

export function HomeParcelAddressLookup({
  onViewingParcelChange,
}: HomeParcelAddressLookupProps = {}) {
  const [simpleAddressLine, setSimpleAddressLine] = useState("");
  /** After a first-line search returns no match or many matches, show the four-field form. */
  const [showAdvancedAddressFields, setShowAdvancedAddressFields] =
    useState(false);
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
    tagId: string;
    tagShortDescr: string;
    levyAspxUrl: string;
    parcelValues: ParcelValuesFromExport;
    parcelValuesTaxYear: string | null;
    ain: string | null;
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
  /** Parcel PIN is edited in the lookup flow only; levy and metro use loaded data, not a second PIN field. */
  const [parcelPin, setParcelPin] = useState("");

  /** Opens levy / metro / hub without a PIN load (user builds the stack with Add tile). */
  const [homeLevyWorkbenchOpen, setHomeLevyWorkbenchOpen] = useState(false);
  /** True after a single PIN match or after the user picks a row from multiple matches. */
  const [addressSearchLocked, setAddressSearchLocked] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const prevAddressSearchLockedRef = useRef(false);

  const headerOfferStartOver =
    addressSearchLocked ||
    showAdvancedAddressFields ||
    showCountyPinFallback ||
    (hits != null && hits.length > 0);

  const levyReadyForSummary =
    levyLoadedMeta != null &&
    !levyLoadError &&
    !levyLoadBusy;

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

  /** After Start over, return focus to the first visible address field. */
  useEffect(() => {
    const wasLocked = prevAddressSearchLockedRef.current;
    prevAddressSearchLockedRef.current = addressSearchLocked;
    if (!addressSearchLocked && wasLocked) {
      document
        .getElementById(
          showAdvancedAddressFields
            ? "home-situs-number"
            : "home-address-simple-line",
        )
        ?.focus();
    }
  }, [addressSearchLocked, showAdvancedAddressFields]);

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

  const loadLevyStack = useCallback(
    async (
      pin: string,
      opts?: {
        demoMode?: boolean;
      },
    ) => {
    setLevyLoadError(null);
    setLevyTemplateMillsError(null);
    setLevyLoadBusy(true);
    setIsDemoMode(Boolean(opts?.demoMode));
    try {
      const result = await loadLevyStackFromPin(pin);
      if (!result.ok) {
        setLevyLoadError(result.error);
        return;
      }
      const displayPin = opts?.demoMode ? DEMO_DISPLAY_PIN : result.matchedPin;
      setLevyLines(result.lines);
      setLevyAwaitingTemplateMills(result.awaitingTemplateMills);
      setLevyTemplateMillDrafts(result.templateMillDrafts);
      setParcelPin(displayPin);
      setLevyLoadedMeta({
        pin: displayPin,
        tagId: result.tagId,
        tagShortDescr: result.tagShortDescr,
        levyAspxUrl: result.levyAspxUrl,
        parcelValues: opts?.demoMode
          ? {
              ...result.parcelValues,
              ownerList: DEMO_OWNER_LIST,
              propertyClassification:
                result.parcelValues.propertyClassification ??
                DEMO_PROPERTY_CLASSIFICATION,
            }
          : result.parcelValues,
        parcelValuesTaxYear: result.parcelValuesTaxYear,
        ain: opts?.demoMode ? null : result.ain,
      });
    } finally {
      setLevyLoadBusy(false);
    }
    },
    [],
  );

  const sumMills = useMemo(() => {
    const s = levyLines.reduce((acc, l) => acc + l.mills, 0);
    return Math.round(s * 1000) / 1000;
  }, [levyLines]);

  const homeCompsGridPdfHref = useMemo(
    () => safeArapahoeCompsGridPdfUrl(levyLoadedMeta?.ain),
    [levyLoadedMeta?.ain],
  );

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
    setIsDemoMode(false);
    clearAllLevyState();
    setError(null);
    setHits(null);
    setShowCountyPinFallback(false);
    setAddressSearchLocked(false);

    const useAdvanced = showAdvancedAddressFields;

    let resolvedBlock: ReturnType<typeof resolveSitusFieldsForLookup>;
    if (!useAdvanced) {
      const rawSimple = simpleAddressLine.trim();
      if (!rawSimple) {
        setError("Enter your street address.");
        return;
      }
      const parsed = parseSimpleAddressLineForSitusLookup(simpleAddressLine);
      if (!parsed) {
        setError("That address line is too long. Shorten it and try again.");
        return;
      }
      resolvedBlock = resolveSitusFieldsForLookup(
        parsed.streetNumber,
        parsed.streetNumberSuffix,
        parsed.streetName,
        parsed.unit,
      );
    } else {
      resolvedBlock = resolveSitusFieldsForLookup(
        streetNumber,
        streetNumberSuffix,
        streetName,
        unit,
      );
    }

    const { resolved, clearUnitToState } = resolvedBlock;
    const { num, suffix, nameRaw, unitTrim } = resolved;

    setStreetNumber(resolved.num);
    setStreetNumberSuffix(resolved.suffix);
    setStreetName(resolved.nameRaw);
    setUnit(clearUnitToState ? "" : resolved.unitTrim);

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
      setError(
        useAdvanced
          ? "Enter the street number (digits)."
          : "Start with the building number (digits), then the street — for example 1234 Main Street.",
      );
      return;
    }
    if (!nameRaw) {
      setError(
        useAdvanced
          ? "Enter a street name."
          : "Include the street name after the number — for example 1234 Main Street.",
      );
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
      prefetchParcelLevyJsonBundle();
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
        if (!useAdvanced) {
          setShowAdvancedAddressFields(true);
          setError(
            "No property matched that address. Use the fields in this form to fix the street name, unit, or spelling, then search again.",
          );
          return;
        }
        setShowCountyPinFallback(true);
        setError(
          "Still no match. Use your Parcel PIN from the county site (see the help section), or double-check spelling and unit.",
        );
        return;
      }
      setHits(list);
      if (list.length === 1) {
        setAddressSearchLocked(true);
        setParcelPin(list[0].pin);
        void loadLevyStack(list[0].pin);
      } else {
        setShowAdvancedAddressFields(true);
      }
    } finally {
      setBusy(false);
    }
  }

  const resetAddressForm = useCallback(() => {
    setSimpleAddressLine("");
    setShowAdvancedAddressFields(false);
    setStreetNumber("");
    setStreetNumberSuffix("");
    setStreetName("");
    setUnit("");
    setError(null);
    setHits(null);
    setShowCountyPinFallback(false);
    setAddressSearchLocked(false);
    setIsDemoMode(false);
    clearAllLevyState();
  }, [clearAllLevyState]);

  async function onLoadDemoProperty() {
    if (busy || levyLoadBusy) return;
    setIsDemoMode(true);
    clearAllLevyState();
    setError(null);
    setShowAdvancedAddressFields(false);
    setShowCountyPinFallback(false);
    setAddressSearchLocked(true);
    setSimpleAddressLine("");
    setStreetNumber("");
    setStreetNumberSuffix("");
    setStreetName("");
    setUnit("");
    setHits([{ pin: DEMO_DISPLAY_PIN, label: DEMO_ADDRESS_LABEL }]);
    setParcelPin(DEMO_DISPLAY_PIN);
    await loadLevyStack(DEMO_SOURCE_PIN, { demoMode: true });
  }

  useEffect(() => {
    onViewingParcelChange?.(headerOfferStartOver, resetAddressForm);
  }, [headerOfferStartOver, onViewingParcelChange, resetAddressForm]);

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
   * or success), the user opens the levy workbench from the Parcel PIN section, or there is
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

  /**
   * Accuracy / report email callout: not on the empty address form; only after a submitted
   * search yielded matches or the county PIN fallback path (no address matches).
   */
  const showHomeAccuracyFeedbackAside =
    levyReadyForSummary &&
    addressSearchLocked &&
    ((hits != null && hits.length > 0) || showCountyPinFallback);

  /** County situs line for the matched or chosen row — not the raw typed search. */
  const lockedAddressHeadline = useMemo((): string | null => {
    if (hits == null || hits.length === 0) return null;
    if (hits.length === 1) return hits[0]?.label ?? null;
    const pin = trimmedParcelPin;
    if (pin.length === 0) return null;
    return hits.find((h) => h.pin === pin)?.label ?? null;
  }, [hits, trimmedParcelPin]);

  const homeLevyStackProps: LevyStackVisualizationProps = {
    lines: levyLines,
    setLines: setLevyLines,
    loadedParcelMeta: levyLoadedMeta,
    awaitingTemplateMills: levyAwaitingTemplateMills,
    setAwaitingTemplateMills: setLevyAwaitingTemplateMills,
    templateMillDrafts: levyTemplateMillDrafts,
    setTemplateMillDrafts: setLevyTemplateMillDrafts,
    templateMillsError: levyTemplateMillsError,
    setTemplateMillsError: setLevyTemplateMillsError,
    onClearLoadedStack: clearParcelTemplateExtended,
    allowLineEdit: true,
    termDefinitionsOnHomePage: levyReadyForSummary,
  };

  const levyStackSection = (
    <div
      className="space-y-3"
      role="region"
      aria-labelledby="home-levy-stack-subheading"
    >
      <h3
        id="home-levy-stack-subheading"
        className={DASHBOARD_SECTION_HEADING_CLASS}
      >
        Where is your money going?
      </h3>
      <LevyStackVisualization {...homeLevyStackProps} />
    </div>
  );

  const showMultiHitLevyIntroLead =
    hits != null && hits.length > 1;
  const compsIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-6"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  );

  return (
    <section
      className="w-full min-w-0 space-y-4 sm:space-y-5"
      aria-labelledby="home-tool-heading"
    >
      <h2 id="home-tool-heading" className="sr-only">
        Property tax lookup and breakdown
      </h2>
      {!addressSearchLocked ? (
        <div className="w-full min-w-0">
          {error ? (
            <InlineErrorCallout
              id={HOME_ADDRESS_LOOKUP_ERROR_ID}
              className="mb-3"
              liveRegion="polite"
            >
              {error}
            </InlineErrorCallout>
          ) : null}
          {showAdvancedAddressFields ? (
            <div className="mb-3">
              <p className="text-sm font-medium text-slate-800">Refine address</p>
              {hits != null && hits.length > 1 ? (
                <p className="mt-1 text-sm text-slate-600">
                  If none of the matching rows is yours, adjust these fields and
                  search again. You can also pick a row in the list or use your
                  PIN from the county site.
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-600">
                  Adjust number, street name, or unit if needed, then search
                  again.
                </p>
              )}
            </div>
          ) : null}
          <form
            className={
              showAdvancedAddressFields
                ? ADDRESS_LOOKUP_FORM_CLASS
                : SIMPLE_ADDRESS_FORM_CLASS
            }
            aria-label="Address lookup"
            aria-describedby={
              error ? HOME_ADDRESS_LOOKUP_ERROR_ID : undefined
            }
            noValidate
            aria-busy={busy}
            onSubmit={(e) => {
              e.preventDefault();
              void onLookup();
            }}
          >
            {!showAdvancedAddressFields ? (
              <>
                <div className="flex min-w-0 flex-col gap-y-1">
                  <label
                    htmlFor="home-address-simple-line"
                    className={FIELD_LABEL_CLASS}
                  >
                    Street address
                  </label>
                  <input
                    id="home-address-simple-line"
                    type="text"
                    name="address-line1"
                    inputMode="text"
                    enterKeyHint="search"
                    autoComplete={`${AC_SECTION} address-line1`}
                    autoCorrect="off"
                    autoCapitalize="sentences"
                    spellCheck={false}
                    maxLength={SITUS_SIMPLE_ADDRESS_LINE_MAX_LEN}
                    className={INPUT_ROW}
                    value={simpleAddressLine}
                    onChange={(e) => setSimpleAddressLine(e.target.value)}
                    disabled={busy}
                    placeholder="e.g. 1234 South Holly Street"
                  />
                </div>
                <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2 md:w-auto md:flex-none md:flex-col md:justify-end">
                  <button
                    type="submit"
                    className={ADDRESS_FORM_ACTION_BTN_CLASS}
                    disabled={busy}
                  >
                    {busy ? (
                      "Searching…"
                    ) : (
                      <>
                        <svg
                          className="h-5 w-5 shrink-0 opacity-95"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.061l-3.329-3.328A7 7 0 012 9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Search
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={ADDRESS_FIELD_GRID_SHELL}>
                  <div
                    className={`${FIELD_LABEL_RAIL} ${addressSitusGrid.numberLabel}`}
                  >
                    <label
                      htmlFor="home-situs-number"
                      className={FIELD_LABEL_CLASS}
                    >
                      Street number
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
                      <span className="font-medium">3721</span> in the street
                      number field, <span className="font-medium">1/2</span>{" "}
                      here.
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
                      {busy ? (
                        "Searching…"
                      ) : (
                        <>
                          <svg
                            className="h-5 w-5 shrink-0 opacity-95"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.061l-3.329-3.328A7 7 0 012 9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Search
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>
          <div
            className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            role="note"
            aria-label="County availability"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5">
                  <InfoIcon />
                </span>
                <p>Arapahoe County only.</p>
              </div>
              <button
                type="button"
                className={`${btnOutlineSecondaryMd} w-auto shrink-0 justify-center whitespace-nowrap px-3 py-2 text-sm disabled:cursor-not-allowed`}
                onClick={() => void onLoadDemoProperty()}
                disabled={busy || levyLoadBusy}
              >
                Try demo property
              </button>
            </div>
          </div>
          {hits != null && hits.length > 1 ? (
            <div
              className={`${ADDRESS_LOOKUP_PANEL_CLASS} mt-4`}
              role="region"
              aria-live="polite"
              aria-label="Matching properties"
            >
              <p className="mb-2 text-sm font-semibold text-slate-900">
                {hits.length} properties matched — pick the row that matches your
                unit or legal description
              </p>
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
                      <button
                        type="button"
                        className={`${btnOutlinePrimaryMd} w-full shrink-0 justify-center py-2.5 sm:w-auto sm:px-4`}
                        disabled={levyLoadBusy}
                        onClick={() => {
                          setAddressSearchLocked(true);
                          setParcelPin(h.pin);
                          void loadLevyStack(h.pin);
                        }}
                      >
                        Use this property
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="min-w-0 space-y-3">
          <div
            className={PARCEL_SUMMARY_ROW_CLASS}
            role="region"
            aria-label="Property search result summary"
          >
            {!busy &&
            levyReadyForSummary &&
            levyLoadedMeta &&
            levyLoadedMeta.parcelValuesTaxYear != null ? (
              <div
                className={PARCEL_SUMMARY_TILE_CLASS}
                id="home-parcel-tax-year"
              >
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <p className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>Tax year</p>
                  <p className={PARCEL_SUMMARY_TILE_VALUE_CLASS}>
                    {levyLoadedMeta.parcelValuesTaxYear}
                  </p>
                </div>
              </div>
            ) : null}
            {!busy &&
            levyLoadedMeta &&
            lockedAddressHeadline &&
            levyLoadedMeta.parcelValues.propertyClassification ? (
              <div
                className={PARCEL_SUMMARY_TILE_CLASS_POPOVER}
                id="home-parcel-property-class"
              >
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                    <InfoHintPopover
                      textTrigger="Property classification"
                      textTriggerId="property-classification-term-first"
                      textTriggerClassName={PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS}
                      ariaLabel="Brief definition of property classification."
                      panelClassName={PARCEL_TERM_POPOVER_PANEL_CLASS}
                    >
                      <ParcelTermPopoverPanel termId="term-property-classification" />
                    </InfoHintPopover>
                  </div>
                  <p className={PARCEL_SUMMARY_TILE_ADDRESS_CLASS}>
                    {levyLoadedMeta.parcelValues.propertyClassification}
                  </p>
                </div>
              </div>
            ) : null}
            {busy ? (
              <div
                className={PARCEL_SUMMARY_TILE_CLASS}
                aria-live="polite"
              >
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <p className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>Status</p>
                  <p className={PARCEL_SUMMARY_TILE_ADDRESS_CLASS}>Searching…</p>
                </div>
              </div>
            ) : null}
            {!busy &&
            lockedAddressHeadline &&
            (!levyReadyForSummary || levyLoadedMeta) ? (
              <div className={PARCEL_SUMMARY_TILE_CLASS}>
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <p className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>Address</p>
                  <p className={PARCEL_SUMMARY_TILE_ADDRESS_CLASS}>
                    {lockedAddressHeadline}
                  </p>
                  {!levyReadyForSummary &&
                  hits != null &&
                  hits.length === 1 &&
                  levyLoadBusy ? (
                    <p className="text-sm text-slate-600" aria-live="polite">
                      Loading your levy breakdown…
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
            {!busy && levyReadyForSummary && levyLoadedMeta ? (
              <div
                className={PARCEL_SUMMARY_TILE_CLASS_POPOVER}
                id="home-parcel-comps-pdf"
              >
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                    <InfoHintPopover
                      textTrigger="Comps PDF"
                      textTriggerId="comps-pdf-term-first"
                      textTriggerClassName={PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS}
                      ariaLabel="Brief definition of comps and the county PDF."
                      panelClassName={PARCEL_TERM_POPOVER_PANEL_CLASS}
                    >
                      <ParcelTermPopoverPanel termId="term-comps" />
                    </InfoHintPopover>
                  </div>
                  {homeCompsGridPdfHref ? (
                    <a
                      href={homeCompsGridPdfHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer justify-center rounded-md text-slate-600 outline-offset-2 transition-colors hover:bg-slate-100/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
                      aria-label="Open county comps grid PDF for this property (opens in a new tab)"
                    >
                      {compsIcon}
                    </a>
                  ) : isDemoMode ? (
                    <div className="flex justify-center">
                      <InfoHintPopover
                        ariaLabel="Comps PDF is unavailable for this property"
                        iconPanelBelow
                        iconTriggerChildren={compsIcon}
                        iconTriggerButtonClassName="min-h-[2.5rem] min-w-[2.5rem] cursor-pointer rounded-md text-slate-600 outline-offset-2 transition-colors focus-visible:ring-offset-2"
                      >
                        <>
                          Demo mode does not include a comps PDF. Select{" "}
                          <strong className="font-semibold text-slate-900">
                            Start over
                          </strong>
                          {", "}
                          then enter your address to open your county comps PDF.
                        </>
                      </InfoHintPopover>
                    </div>
                  ) : (
                    <div
                      className="space-y-2"
                      role="status"
                      aria-live="polite"
                    >
                      <p className="text-center text-sm leading-snug text-slate-600 sm:text-left">
                        No county comps PDF from here: this PIN is missing an
                        assessor parcel id (AIN) in the bundled parcel index.
                      </p>
                      <div className="flex justify-center sm:justify-start">
                        <InfoHintPopover
                          ariaLabel="Why there is no comps PDF link for this property"
                          iconPanelBelow
                          iconTriggerChildren={compsIcon}
                          iconTriggerButtonClassName="min-h-[2.5rem] min-w-[2.5rem] cursor-pointer rounded-md text-slate-600 outline-offset-2 transition-colors focus-visible:ring-offset-2"
                        >
                          <>
                            <p className="text-sm leading-relaxed text-slate-800">
                              We build the county link from your PIN&apos;s AIN in
                              the situs-to-PIN bundle. If that field is empty, we
                              cannot form{" "}
                              <span className="whitespace-nowrap">
                                FileDownload.ashx?AIN=…
                              </span>{" "}
                              safely.
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-slate-800">
                              Open{" "}
                              <a
                                href={ARAPAHOE_ASSESSOR_PROPERTY_SEARCH}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={COUNTY_EXTERNAL_LINK_CLASS}
                              >
                                Arapahoe property search
                                <span className="sr-only">
                                  {" "}
                                  (opens in a new tab)
                                </span>
                              </a>
                              {" "}
                              to reach your parcel and comps from the county. For
                              how the bundle is built, see{" "}
                              <a href="/sources" className={TERM_LINK_CLASS}>
                                Sources
                              </a>
                              {" "}
                              and the README.
                            </p>
                          </>
                        </InfoHintPopover>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            {!busy &&
            levyReadyForSummary &&
            levyLoadedMeta &&
            levyLoadedMeta.parcelValues.ownerList != null ? (
              <div
                className={PARCEL_SUMMARY_TILE_CLASS_POPOVER}
                id="home-parcel-owner-list"
              >
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                    <InfoHintPopover
                      textTrigger="Owner of record"
                      textTriggerId="owner-list-term-first"
                      textTriggerClassName={PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS}
                      ariaLabel="Brief definition of owner of record."
                      panelClassName={PARCEL_TERM_POPOVER_PANEL_CLASS}
                    >
                      <ParcelTermPopoverPanel termId="term-owner-list" />
                    </InfoHintPopover>
                  </div>
                  <p className="max-w-full break-words text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                    {levyLoadedMeta.parcelValues.ownerList}
                  </p>
                </div>
              </div>
            ) : null}
            {!busy &&
            levyReadyForSummary &&
            levyLoadedMeta &&
            (levyLoadedMeta.parcelValues.totalActual != null ||
              levyLoadedMeta.parcelValues.totalAssessed != null) ? (
                <div className={PARCEL_SUMMARY_VALUE_PAIR_ROW_CLASS}>
                  {levyLoadedMeta.parcelValues.totalActual != null ? (
                    <div className={PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER}>
                      <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                        <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                          <InfoHintPopover
                            textTrigger="Actual value"
                            textTriggerId="actual-value-term-first"
                            textTriggerClassName={
                              PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS
                            }
                            ariaLabel="Brief definition of actual value."
                            panelClassName={PARCEL_TERM_POPOVER_PANEL_CLASS}
                          >
                            <ParcelTermPopoverPanel termId="term-actual-value" />
                          </InfoHintPopover>
                        </div>
                        <p className={PARCEL_SUMMARY_TILE_VALUE_CLASS}>
                          {formatUsdWhole(levyLoadedMeta.parcelValues.totalActual)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {levyLoadedMeta.parcelValues.totalAssessed != null ? (
                    <div className={PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER}>
                      <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                        <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                          <InfoHintPopover
                            textTrigger="Assessed value"
                            textTriggerId="assessed-value-term-first"
                            textTriggerClassName={
                              PARCEL_SUMMARY_TILE_GLOSSARY_LINK_CLASS
                            }
                            ariaLabel="Brief definition of assessed value."
                            panelClassName={PARCEL_TERM_POPOVER_PANEL_CLASS}
                          >
                            <ParcelTermPopoverPanel termId="term-assessed-value" />
                          </InfoHintPopover>
                        </div>
                        <p className={PARCEL_SUMMARY_TILE_VALUE_CLASS}>
                          {formatUsdWhole(levyLoadedMeta.parcelValues.totalAssessed)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
            ) : null}
          </div>
          {!busy &&
          hits != null &&
          hits.length > 1 &&
          trimmedParcelPin.length === 0 ? (
            <p className="text-sm text-slate-600">
              Pick the row that matches your property in the list below.
            </p>
          ) : null}
          {error ? (
            <InlineErrorCallout className="mt-1" liveRegion="polite">
              {error}
            </InlineErrorCallout>
          ) : null}
        </div>
      )}
      {showParcelPinSection ? (
            <div
              className={ADDRESS_LOOKUP_PANEL_CLASS}
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
                    onFocus={() => prefetchParcelLevyJsonBundle()}
                    disabled={levyLoadBusy}
                    placeholder="from address search or county record"
                    aria-describedby="home-parcel-pin-hint"
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
              <p className="mt-3 text-sm text-slate-700">
                <a
                  href={`#${HOME_LEVY_BREAKDOWN_ID}`}
                  className={TERM_LINK_CLASS}
                  onClick={() => setHomeLevyWorkbenchOpen(true)}
                >
                  Add levies without a PIN
                </a>
                <span className="font-normal text-slate-600">
                  {" "}
                  — use{" "}
                  <strong className="font-semibold text-slate-800">Add tile</strong>
                  {" "}
                  in the levy section with rows from{" "}
                  <strong className="font-semibold text-slate-800">
                    Tax District Levies
                  </strong>
                  .
                </span>
              </p>
            </div>
          ) : null}
      {showCountyPinFallback ? (
            <div
              className={ADDRESS_LOOKUP_PANEL_CLASS}
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
                Enter that PIN in the <strong>Parcel PIN</strong> section above.
              </p>
            </div>
          ) : null}
          {levyLoadError ? (
            <InlineErrorCallout liveRegion="polite">{levyLoadError}</InlineErrorCallout>
          ) : null}

      {(showParcelPinSection || showHomeLevyMetroAndHub) ? (
        <div
          id={HOME_LEVY_BREAKDOWN_ID}
          className={`scroll-mt-6 space-y-5 sm:scroll-mt-8 ${!showHomeLevyMetroAndHub ? "min-h-px" : ""}`}
          role={showHomeLevyMetroAndHub ? "region" : undefined}
          aria-label={showHomeLevyMetroAndHub ? "Property tax breakdown" : undefined}
        >
          {showHomeLevyMetroAndHub ? (
          <>
          {showLevyIntroBlock && !showCountyPinFallback ? (
            <div className="space-y-5">
              {!showMultiHitLevyIntroLead ? (
                <p className="text-sm text-slate-600 sm:text-base">
                  Use{" "}
                  <strong className="font-semibold text-slate-800">Add tile</strong>
                  {" "}
                  below for each row from your county{" "}
                  <strong className="font-semibold text-slate-800">Tax District Levies</strong>{" "}
                  table, or{" "}
                  <strong className="font-semibold text-slate-800">Load property data</strong>
                  {" "}
                  when you have a PIN.
                </p>
              ) : null}
              <div
                className={ADDRESS_LOOKUP_PANEL_CLASS}
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
              totalAssessedForEstimate={
                levyLoadedMeta &&
                typeof levyLoadedMeta.parcelValues.totalAssessed === "number" &&
                levyLoadedMeta.parcelValues.totalAssessed > 0
                  ? levyLoadedMeta.parcelValues.totalAssessed
                  : null
              }
            >
              {levyStackSection}
            </MetroTaxShareFlow>
          ) : (
            levyStackSection
          )}

          </>
          ) : null}
        </div>
      ) : null}

      {levyReadyForSummary ? (
        <>
          {showHomeAccuracyFeedbackAside ? (
            <aside aria-label="Accuracy and feedback">
              <MailContactCard
                href={REPORT_PROBLEM_MAILTO_HREF}
                kicker="Feedback"
                primaryLine={CONTACT_EMAIL}
                secondary="We aim for accuracy. If something looks wrong, let us know. This link opens your mail app with a short form ready to fill in."
              />
            </aside>
          ) : null}
          <div
            id="page-definitions"
            className="scroll-mt-6 border-t border-slate-200 pt-6 sm:pt-8"
            aria-labelledby="home-page-definitions-heading"
          >
            <h3
              id="home-page-definitions-heading"
              className={HOME_DEFINITIONS_HEADING_CLASS}
            >
              Key terms
            </h3>
            <div className="mt-4 space-y-4">
              {/* Alphabetical by title (Actual value, Assessed value, Comps, …) */}
              <TermActualValueAside />
              <TermAssessedValueAside />
              <TermCompsAside />
              <TermLevyAside />
              <TermLgIdAside />
              <TermMillsAside />
              <TermOwnerListAside />
              <TermParcelAside />
              <TermPinAside />
              <TermPropertyClassificationAside />
              <TermSpecialDistrictsAside />
              <TermTagAside />
              <TermTaxEntityAside />
            </div>
            <div className="mt-6 flex justify-center sm:justify-start">
              <button
                type="button"
                className={`${btnOutlineSecondaryMd} px-4 py-2 text-sm`}
                onClick={() => {
                  let movedFocus = false;
                  const focusPageTop = () => {
                    if (movedFocus) return;
                    movedFocus = true;
                    document.getElementById("page-top")?.focus({ preventScroll: true });
                  };
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  window.addEventListener("scrollend", focusPageTop, { once: true });
                  window.setTimeout(focusPageTop, 600);
                }}
                aria-label="Back to top of page"
              >
                Back to top
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
