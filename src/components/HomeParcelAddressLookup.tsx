// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BackToTopButton } from "@/components/BackToTopButton";
import { CountyAssessorMillLevyFigures } from "@/components/CountyAssessorMillLevyFigures";
import { CountyCompsPdfUnavailablePopoverBody } from "@/components/CountyCompsPdfGuidance";
import {
  CountyCompsPdfHelpPopover,
  COMPS_PDF_ICON_CONTROL_CLASS,
} from "@/components/CountyCompsPdfHelpPopover";
import { CountyParcelPinLookupHelp } from "@/components/CountyParcelPinLookupHelp";
import { InlineErrorCallout } from "@/components/InlineErrorCallout";
import { MailContactCard } from "@/components/MailContactCard";
import { InfoHintPopover } from "@/components/InfoHintPopover";
import { InfoIcon } from "@/components/InfoIcon";
import { LevyCountyCompareSection } from "@/components/LevyCountyCompareSection";
import {
  LevyStackVisualization,
  type LevyStackVisualizationProps,
} from "@/components/LevyStackVisualization";
import { ParcelRecordPanel } from "@/components/ParcelRecordPanel";
import { ParcelRecordExtendedSection, PARCEL_RECORD_EXTENDED_SECTION_ID, shouldShowParcelRecordExtendedSection } from "@/components/ParcelRecordExtendedSection";
import { MetroTaxShareFlow } from "@/components/MetroTaxShareFlow";
import { NovCompsGridPanel } from "@/components/NovCompsGridPanel";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import { SitusEnvelopeAddress } from "@/components/SitusEnvelopeAddress";
import {
  COUNTY_COMPS_PDF_TILE_UNAVAILABLE_ARIA_LABEL,
  COUNTY_COMPS_PDF_TILE_UNAVAILABLE_STATUS,
} from "@/content/countyCompsPdfGuidance";
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
  DEMO_ADDRESS_LABEL,
  DEMO_DISPLAY_PIN,
  loadDemoProperty,
} from "@/lib/demoProperty";
import {
  loadLevyStackFromPin,
  type CommittedLevyLine,
  type ParcelValuesFromExport,
} from "@/lib/committedLevyLine";
import {
  fetchArapahoeLevyStacksJson,
  fetchArapahoeParcelRecordForPin,
  fetchArapahoePinToTagJson,
  looksLikeParcelIdInput,
  type ArapahoeParcelRecordRow,
} from "@/lib/arapahoeParcelLevyData";
import {
  fetchArapahoeSitusToPinsJson,
  lookupPinsBySitusFuzzy,
  normalizeStreetNameKey,
  parseSimpleAddressLineForSitusLookup,
  resolveSitusFieldsForLookup,
  situsUnitLooksLikeStreetAutofillDuplicate,
  suggestSitusStreetsForNumber,
  SITUS_AUTOFILL_LINE1_MAX_LEN,
  SITUS_INPUT_MAX_LEN,
  SITUS_SIMPLE_ADDRESS_LINE_MAX_LEN,
  trySitusAutofillBlurSplit,
  type SitusStreetSuggestion,
} from "@/lib/arapahoeSitusLookup";
import { metroFromLevyLines } from "@/lib/metroDistrictFromLevyLines";
import {
  FIRST_CHANGED_LEVY_TILE_DOM_ID,
  LEVY_TILE_OPEN_BTN_SELECTOR,
  billImpactCalloutForLevyLines,
  levyStackRateChangeCalloutSurfaceClasses,
} from "@/lib/metroLevyYearOverYear";
import { buildSitusEnvelopeDisplayRows } from "@/lib/addressLabelDifference";
import { ARAPAHOE_ASSESSOR_PROPERTY_SEARCH } from "@/lib/arapahoeCountyUrls";
import { novCompsGridDemoPayload } from "@/lib/novCompsGridSamplePayload";
import {
  ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE,
  safeArapahoeCompsGridPdfUrl,
} from "@/lib/safeExternalHref";
import { formatUsdWhole } from "@/lib/formatUsd";
import {
  annualTaxDollarsFromAssessedMills,
  parcelAssessedForDollarEstimate,
} from "@/lib/annualTaxFromAssessedMills";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import {
  parcelTaxAndAssessmentYearsDiffer,
} from "@/lib/parcelRecordDisplay";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
  DASHBOARD_SECTION_META_CLASS,
  DASHBOARD_TILE_RADIUS_CLASS,
  INPUT_CLASS,
  PARCEL_SUMMARY_COMPS_UNAVAILABLE_STATUS_CLASS,
  PARCEL_SUMMARY_COMPS_UNAVAILABLE_TILE_CLASS,
  PARCEL_SUMMARY_ROW_CLASS,
  PARCEL_SUMMARY_TILE_ADDRESS_CLASS,
  PARCEL_SUMMARY_TILE_BODY_CLASS,
  PARCEL_SUMMARY_TILE_CLASS,
  PARCEL_SUMMARY_TILE_CLASS_POPOVER,
  PARCEL_SUMMARY_TILE_LABEL_CLASS,
  PARCEL_SUMMARY_TILE_VALUE_CLASS,
  PARCEL_SUMMARY_VALUE_PAIR_ROW_CLASS,
  PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER,
  TERM_LINK_CLASS,
  TILE_DETAILS_CUE_ON_LIGHT_CLASS,
  TOOL_DISCLOSURE_ROW_ALIGN_CLASS,
  TOOL_LINK_UNDERLINE_CLASS,
} from "@/lib/toolFlowStyles";

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

/** Autocomplete section token paired with `address-line1` on the Number input (mobile autofill). */
const AC_SECTION = "section-arapahoe-situs";

/** Same-page anchor for the manual levy / breakdown region (Parcel PIN card link). */
const HOME_LEVY_BREAKDOWN_ID = "home-levy-breakdown-heading";
const HOME_LEVY_BREAKDOWN_ARIA_LABEL = "Property tax breakdown";

/** Property details panel (below levy stack on small screens). */
const HOME_PROPERTY_DETAILS_ID = "home-property-details";

const PROPERTY_DETAILS_JUMP_CHEVRON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="size-5 shrink-0"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
    />
  </svg>
);

const HOME_ADDRESS_LOOKUP_ERROR_ID = "home-address-lookup-error";
const HOME_ADDRESS_STREET_SUGGESTIONS_ID = "home-address-street-suggestions";

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
  /** Close street-name alternatives when exact/fuzzy auto-match is ambiguous. */
  const [streetDidYouMean, setStreetDidYouMean] = useState<
    SitusStreetSuggestion[] | null
  >(null);
  /** Polite status when search used an approximate street name. */
  const [addressMatchStatus, setAddressMatchStatus] = useState<string | null>(
    null,
  );
  /** Live street suggestions for the current house number (typeahead). */
  const [streetTypeahead, setStreetTypeahead] = useState<
    SitusStreetSuggestion[]
  >([]);
  const [streetTypeaheadOpen, setStreetTypeaheadOpen] = useState(false);
  const [streetTypeaheadActiveIndex, setStreetTypeaheadActiveIndex] =
    useState(-1);
  const streetTypeaheadListId = "home-address-street-typeahead";
  /** Simple-line combobox field + listbox (outside pointer closes the list). */
  const streetTypeaheadRootRef = useRef<HTMLDivElement>(null);
  const simpleAddressInputRef = useRef<HTMLInputElement>(null);
  const [showCountyPinFallback, setShowCountyPinFallback] = useState(false);

  const [levyLines, setLevyLines] = useState<CommittedLevyLine[]>([]);
  const [levyLoadedMeta, setLevyLoadedMeta] = useState<{
    pin: string;
    tagId: string;
    tagShortDescr: string;
    levyAspxUrl: string;
    parcelValues: ParcelValuesFromExport;
    parcelAssessmentYear: string | null;
    parcelTaxYear: string | null;
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
  const [parcelRecord, setParcelRecord] = useState<ArapahoeParcelRecordRow | null>(
    null,
  );
  const [parcelRecordLoading, setParcelRecordLoading] = useState(false);
  const [parcelRecordLoadFailed, setParcelRecordLoadFailed] = useState(false);
  const [parcelRecordBundledAsOf, setParcelRecordBundledAsOf] = useState<
    string | null
  >(null);
  const prevAddressSearchLockedRef = useRef(false);
  /** Incremented on each levy load/clear so stale PIN lookups cannot apply state. */
  const levyLoadRequestRef = useRef(0);
  /** Incremented with levy loads; pairs with per-call id inside loadParcelRecord. */
  const parcelRecordRequestRef = useRef(0);

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

  /**
   * Lock → property report: jump to top (same-page swap keeps window scroll).
   * Unlock → Start over: return focus to the first visible address field.
   */
  useEffect(() => {
    const wasLocked = prevAddressSearchLockedRef.current;
    prevAddressSearchLockedRef.current = addressSearchLocked;
    if (addressSearchLocked && !wasLocked) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.getElementById("page-top")?.focus({ preventScroll: true });
      return;
    }
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
    levyLoadRequestRef.current += 1;
    parcelRecordRequestRef.current += 1;
    setLevyLines([]);
    setLevyLoadedMeta(null);
    setLevyAwaitingTemplateMills(false);
    setLevyTemplateMillDrafts({});
    setLevyTemplateMillsError(null);
    setLevyLoadError(null);
    setLevyLoadBusy(false);
    setParcelPin("");
    setHomeLevyWorkbenchOpen(false);
    setParcelRecord(null);
    setParcelRecordLoading(false);
    setParcelRecordLoadFailed(false);
    setParcelRecordBundledAsOf(null);
  }, []);

  const loadParcelRecord = useCallback(async (lookupPin: string) => {
    const requestId = ++parcelRecordRequestRef.current;
    const isCurrentRequest = () => requestId === parcelRecordRequestRef.current;
    setParcelRecordLoading(true);
    setParcelRecordLoadFailed(false);
    setParcelRecord(null);
    setParcelRecordBundledAsOf(null);
    try {
      const result = await fetchArapahoeParcelRecordForPin(lookupPin);
      if (!isCurrentRequest()) return;
      if (!result) {
        setParcelRecordLoadFailed(true);
        return;
      }
      setParcelRecord(result.row);
      setParcelRecordBundledAsOf(result.bundledAsOf);
    } finally {
      if (isCurrentRequest()) {
        setParcelRecordLoading(false);
      }
    }
  }, []);

  function clearLevyStackOnly() {
    levyLoadRequestRef.current += 1;
    parcelRecordRequestRef.current += 1;
    setLevyLines([]);
    setLevyAwaitingTemplateMills(false);
    setLevyTemplateMillDrafts({});
    setLevyLoadedMeta(null);
    setLevyTemplateMillsError(null);
    setParcelRecord(null);
    setParcelRecordLoading(false);
    setParcelRecordLoadFailed(false);
    setParcelRecordBundledAsOf(null);
  }

  const loadLevyStack = useCallback(
    async (pin: string): Promise<boolean> => {
    const requestId = ++levyLoadRequestRef.current;
    const isCurrentRequest = () => requestId === levyLoadRequestRef.current;
    parcelRecordRequestRef.current += 1;
    setLevyLoadError(null);
    setLevyTemplateMillsError(null);
    setLevyLoadBusy(true);
    setIsDemoMode(false);
    setParcelRecord(null);
    setParcelRecordLoading(false);
    setParcelRecordLoadFailed(false);
    setParcelRecordBundledAsOf(null);
    try {
      const result = await loadLevyStackFromPin(pin);
      if (!isCurrentRequest()) return false;
      if (!result.ok) {
        setLevyLoadError(result.error);
        return false;
      }
      setLevyLines(result.lines);
      setLevyAwaitingTemplateMills(result.awaitingTemplateMills);
      setLevyTemplateMillDrafts(result.templateMillDrafts);
      setParcelPin(result.matchedPin);
      setLevyLoadedMeta({
        pin: result.matchedPin,
        tagId: result.tagId,
        tagShortDescr: result.tagShortDescr,
        levyAspxUrl: result.levyAspxUrl,
        parcelValues: result.parcelValues,
        parcelAssessmentYear: result.parcelAssessmentYear,
        parcelTaxYear: result.parcelTaxYear,
        ain: result.ain,
      });
      if (!isCurrentRequest()) return false;
      void loadParcelRecord(result.matchedPin);
      return true;
    } finally {
      if (isCurrentRequest()) {
        setLevyLoadBusy(false);
      }
    }
    },
    [loadParcelRecord],
  );

  const streetTypeaheadRequestRef = useRef(0);
  const refreshStreetTypeahead = useCallback(
    async (
      num: string,
      suffix: string,
      namePartial: string,
      open: boolean,
    ) => {
      if (!num.trim() || !/\d/.test(num)) {
        setStreetTypeahead([]);
        setStreetTypeaheadOpen(false);
        return;
      }
      const requestId = ++streetTypeaheadRequestRef.current;
      const data = await fetchArapahoeSitusToPinsJson();
      if (requestId !== streetTypeaheadRequestRef.current) return;
      if (!data?.byKey) {
        setStreetTypeahead([]);
        return;
      }
      const list = suggestSitusStreetsForNumber(
        data,
        num,
        suffix,
        namePartial,
      );
      if (requestId !== streetTypeaheadRequestRef.current) return;
      setStreetTypeahead(list);
      setStreetTypeaheadActiveIndex(-1);
      setStreetTypeaheadOpen(open && list.length > 0);
    },
    [],
  );

  /** Debounced street typeahead for the simple address line. */
  useEffect(() => {
    if (addressSearchLocked || busy || showAdvancedAddressFields) {
      setStreetTypeaheadOpen(false);
      return;
    }
    const handle = window.setTimeout(() => {
      const parsed = parseSimpleAddressLineForSitusLookup(simpleAddressLine);
      if (!parsed || !parsed.streetNumber.trim()) {
        setStreetTypeahead([]);
        setStreetTypeaheadOpen(false);
        return;
      }
      void refreshStreetTypeahead(
        parsed.streetNumber,
        parsed.streetNumberSuffix,
        parsed.streetName,
        parsed.streetName.trim().length >= 1,
      );
    }, 180);
    return () => window.clearTimeout(handle);
  }, [
    addressSearchLocked,
    busy,
    showAdvancedAddressFields,
    simpleAddressLine,
    refreshStreetTypeahead,
  ]);

  /**
   * Keep the typeahead open after the field blurs (e.g. scroll dismisses the
   * mobile keyboard). Close on outside pointer, Tab/focus to a control outside
   * the combobox, Escape, Search, or pick.
   */
  useEffect(() => {
    if (!streetTypeaheadOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = streetTypeaheadRootRef.current;
      if (!root || !(e.target instanceof Node)) return;
      if (!root.contains(e.target)) {
        setStreetTypeaheadOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [streetTypeaheadOpen]);

  const sumMills = useMemo(() => {
    const s = levyLines.reduce((acc, l) => acc + l.mills, 0);
    return Math.round(s * 1000) / 1000;
  }, [levyLines]);

  /** Same estimated annual $ as the levy stack Total row (mills × assessed ÷ 1000). */
  const estimatedAnnualPropertyTaxDollars = useMemo(() => {
    if (levyAwaitingTemplateMills) return null;
    const assessed = parcelAssessedForDollarEstimate(
      levyLoadedMeta?.parcelValues?.totalAssessed,
    );
    if (assessed == null || sumMills <= 0) return null;
    return annualTaxDollarsFromAssessedMills(assessed, sumMills);
  }, [
    levyAwaitingTemplateMills,
    levyLoadedMeta?.parcelValues?.totalAssessed,
    sumMills,
  ]);

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

  /** Rate-change callout when any stack authority changed (metro or AUTH). */
  const billImpactCallout = useMemo(
    () => billImpactCalloutForLevyLines(levyLines),
    [levyLines],
  );

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
    setStreetDidYouMean(null);
    setAddressMatchStatus(null);
    setStreetTypeaheadOpen(false);
    setShowCountyPinFallback(false);
    setAddressSearchLocked(false);

    const useAdvanced = showAdvancedAddressFields;

    if (!useAdvanced) {
      const rawSimple = simpleAddressLine.trim();
      if (!rawSimple) {
        setError("Enter your street address.");
        return;
      }
      if (looksLikeParcelIdInput(rawSimple)) {
        setBusy(true);
        try {
          setParcelPin(rawSimple);
          const ok = await loadLevyStack(rawSimple);
          if (ok) {
            setAddressSearchLocked(true);
          } else {
            setShowCountyPinFallback(true);
          }
        } finally {
          setBusy(false);
        }
        return;
      }
    }

    let resolvedBlock: ReturnType<typeof resolveSitusFieldsForLookup>;
    if (!useAdvanced) {
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
          : "Start with the building number (digits), then the street (for example 1234 Main Street).",
      );
      return;
    }
    if (!nameRaw) {
      setError(
        useAdvanced
          ? "Enter a street name."
          : "Include the street name after the number (for example 1234 Main Street).",
      );
      return;
    }
    const nameNorm = normalizeStreetNameKey(nameRaw);
    if (!nameNorm) {
      setError(
        "Could not read a street name from that. Try the main name of the road (for example Holly for South Holly Circle).",
      );
      return;
    }

    setBusy(true);
    try {
      prefetchParcelLevyJsonBundle();
      const data = await fetchArapahoeSitusToPinsJson();
      if (!data?.byKey) {
        setError(
          "Address lookup data is missing. Run npm run build:arapahoe-index with county mart CSVs in supporting-data/county-mart (see README).",
        );
        return;
      }
      const result = lookupPinsBySitusFuzzy(
        data,
        num,
        suffix,
        nameRaw,
        unitTrim,
      );
      if (result.kind === "none") {
        if (!useAdvanced) {
          setShowAdvancedAddressFields(true);
          setError(
            "No property matched that address. Use the fields in this form to fix the street name, unit, or spelling, then search again.",
          );
          return;
        }
        setShowCountyPinFallback(true);
        setError(
          "Still no match. Use your Parcel PIN or AIN from the county site (see the help section), or double-check spelling and unit.",
        );
        return;
      }
      if (result.kind === "suggest") {
        setShowAdvancedAddressFields(true);
        setStreetDidYouMean(result.suggestions);
        return;
      }
      if (result.approximateStreet) {
        setStreetName(result.matchedStreetNameKey);
        setAddressMatchStatus(
          `Showing results for ${result.matchedStreetNameKey}. No exact match for ${nameNorm}.`,
        );
        if (!useAdvanced) {
          setSimpleAddressLine(
            [num, suffix, result.matchedStreetNameKey, unitTrim]
              .filter(Boolean)
              .join(" "),
          );
        }
      }
      const list = result.hits;
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

  function applyStreetSuggestion(suggestion: SitusStreetSuggestion) {
    setStreetDidYouMean(null);
    setAddressMatchStatus(null);
    setStreetTypeaheadOpen(false);
    setError(null);
    setStreetName(suggestion.streetNameKey);
    setShowAdvancedAddressFields(true);
    const list = suggestion.hits;
    setHits(list);
    if (list.length === 1) {
      setAddressSearchLocked(true);
      setParcelPin(list[0].pin);
      void loadLevyStack(list[0].pin);
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
    setStreetDidYouMean(null);
    setAddressMatchStatus(null);
    setStreetTypeahead([]);
    setStreetTypeaheadOpen(false);
    setShowCountyPinFallback(false);
    setAddressSearchLocked(false);
    setIsDemoMode(false);
    clearAllLevyState();
  }, [clearAllLevyState]);

  function onLoadDemoProperty() {
    if (busy || levyLoadBusy) return;
    clearAllLevyState();
    const requestId = ++levyLoadRequestRef.current;
    const parcelRequestId = ++parcelRecordRequestRef.current;
    const isCurrentRequest = () =>
      requestId === levyLoadRequestRef.current &&
      parcelRequestId === parcelRecordRequestRef.current;
    setIsDemoMode(true);
    setError(null);
    setShowAdvancedAddressFields(false);
    setShowCountyPinFallback(false);
    setAddressSearchLocked(true);
    setSimpleAddressLine("");
    setStreetNumber("");
    setStreetNumberSuffix("");
    setStreetName("");
    setUnit("");
    setStreetDidYouMean(null);
    setStreetTypeahead([]);
    setStreetTypeaheadOpen(false);
    setAddressMatchStatus(null);
    setHits([{ pin: DEMO_DISPLAY_PIN, label: DEMO_ADDRESS_LABEL }]);
    setParcelPin(DEMO_DISPLAY_PIN);
    setLevyLoadBusy(true);
    try {
      const demo = loadDemoProperty();
      if (!isCurrentRequest()) return;
      setLevyLines(demo.levy.lines);
      setLevyAwaitingTemplateMills(demo.levy.awaitingTemplateMills);
      setLevyTemplateMillDrafts(demo.levy.templateMillDrafts);
      setLevyLoadedMeta({
        pin: DEMO_DISPLAY_PIN,
        tagId: demo.levy.tagId,
        tagShortDescr: demo.levy.tagShortDescr,
        levyAspxUrl: demo.levy.levyAspxUrl,
        parcelValues: demo.levy.parcelValues,
        parcelAssessmentYear: demo.levy.parcelAssessmentYear,
        parcelTaxYear: demo.levy.parcelTaxYear,
        ain: demo.levy.ain,
      });
      setParcelRecord(demo.parcelRecord);
      setParcelRecordBundledAsOf(demo.parcelRecordBundledAsOf);
      setParcelRecordLoading(false);
      setParcelRecordLoadFailed(false);
    } finally {
      if (isCurrentRequest()) {
        setLevyLoadBusy(false);
      }
    }
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

  /** Locked vs unlocked levy shells are mutually exclusive; share one ID, never both. */
  const showHomeLevyBreakdownRegion =
    addressSearchLocked && showHomeLevyMetroAndHub;
  const showHomeLevyBreakdownWorkbenchShell =
    !addressSearchLocked &&
    (showParcelPinSection || showHomeLevyMetroAndHub);

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

  /** Envelope rows for multi-match pick list (street + city, difference marks). */
  const multiHitEnvelopeRows = useMemo(() => {
    if (hits == null || hits.length < 2) return null;
    return buildSitusEnvelopeDisplayRows(hits.map((h) => h.label));
  }, [hits]);

  /** Same envelope layout for simple-line typeahead suggestions. */
  const streetTypeaheadEnvelopeRows = useMemo(
    () => buildSitusEnvelopeDisplayRows(streetTypeahead.map((s) => s.sampleLabel)),
    [streetTypeahead],
  );

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
  };

  const showPropertyDetailsColumn =
    levyLoadedMeta != null && levyLoadError == null;

  const propertyDetailsBundledLabel = useMemo(() => {
    if (!parcelRecordBundledAsOf) return null;
    return formatLevyBundledAsOf(parcelRecordBundledAsOf.slice(0, 10));
  }, [parcelRecordBundledAsOf]);

  const levyStackIntro = (
    <p id="home-levy-stack-intro" className={DASHBOARD_SECTION_META_CLASS}>
      Select a tile for more details.
    </p>
  );

  const levyStackBody = <LevyStackVisualization {...homeLevyStackProps} />;

  function scrollToFirstChangedLevyTile() {
    const tile = document.getElementById(FIRST_CHANGED_LEVY_TILE_DOM_ID);
    if (!tile) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    tile.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    const openBtn = tile.querySelector<HTMLButtonElement>(
      LEVY_TILE_OPEN_BTN_SELECTOR,
    );
    openBtn?.focus({ preventScroll: true });
  }

  const billImpactSurface = billImpactCallout
    ? levyStackRateChangeCalloutSurfaceClasses()
    : null;

  const billImpactCalloutBlock =
    billImpactCallout && billImpactSurface ? (
      <div>
        <p className="sr-only" role="status" aria-live="polite">
          {billImpactCallout.message}
        </p>
        <button
          type="button"
          onClick={scrollToFirstChangedLevyTile}
          className={`group w-full cursor-pointer rounded-lg border-2 ${billImpactSurface.box} px-3 py-3 text-left ${billImpactSurface.headline} sm:px-4 sm:py-3.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2`}
          aria-label={`${billImpactCallout.message} Details. Scroll to what changed on your bill.`}
        >
          <span
            aria-hidden
            className="text-base font-bold leading-snug tracking-tight text-balance sm:text-lg"
          >
            {billImpactCallout.message}
            <span
              className={`${TILE_DETAILS_CUE_ON_LIGHT_CLASS} ml-3 whitespace-nowrap sm:ml-4`}
            >
              Details ›
            </span>
          </span>
        </button>
      </div>
    ) : null;

  const levySectionLead = (
    <div className="space-y-3">
      <h3
        id="home-levy-stack-subheading"
        className={DASHBOARD_SECTION_HEADING_CLASS}
      >
        Where is your money going?
      </h3>
      {levyStackIntro}
    </div>
  );

  const levyBreakdownMain = showHomeMetroSection ? (
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
      sectionLead={showPropertyDetailsColumn ? undefined : levySectionLead}
    >
      <section
        className="space-y-3"
        aria-labelledby="home-levy-stack-subheading"
        aria-describedby="home-levy-stack-intro"
      >
        {levyStackBody}
      </section>
    </MetroTaxShareFlow>
  ) : (
    <section
      className="space-y-3"
      aria-labelledby="home-levy-stack-subheading"
      aria-describedby="home-levy-stack-intro"
    >
      {!showPropertyDetailsColumn ? levySectionLead : null}
      {levyStackBody}
    </section>
  );

  const propertyDetailsHeader = (
  <>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3
          id="parcel-record-heading"
          className={DASHBOARD_SECTION_HEADING_CLASS}
        >
          Property details
        </h3>
        <ParcelGlossaryPopoverTrigger
          termId="term-parcel-record"
          textTrigger="What is this?"
          textTriggerId="parcel-record-heading-help"
          variant="parcel-record"
          textTriggerClassName={`text-xs ${TERM_LINK_CLASS} sm:text-sm`}
          ariaLabel="What the property details panel shows."
        />
      </div>
      {propertyDetailsBundledLabel && parcelRecordBundledAsOf ? (
        <p className={DASHBOARD_SECTION_META_CLASS}>
          County data current as of{" "}
          <time dateTime={parcelRecordBundledAsOf.slice(0, 10)}>
            {propertyDetailsBundledLabel}
          </time>
        </p>
      ) : null}
  </>
  );

  const propertyClassificationLine =
    levyLoadedMeta?.parcelValues.propertyClassification ? (
      <p
        id="home-parcel-property-class"
        className={DASHBOARD_SECTION_META_CLASS}
      >
        <ParcelGlossaryPopoverTrigger
          termId="term-property-classification"
          textTrigger="Property classification"
          textTriggerId="property-classification-term-first"
          variant="parcel-record"
          textTriggerClassName={`text-inherit ${TERM_LINK_CLASS}`}
        />
        {": "}
        {levyLoadedMeta.parcelValues.propertyClassification}
      </p>
    ) : null;

  const propertyDetailsBelowPanel =
    levyLines.length > 0 && levyLoadedMeta ? (
      <>
        <LevyCountyCompareSection
          pin={levyLoadedMeta.pin}
          tagId={levyLoadedMeta.tagId}
          tagShortDescr={levyLoadedMeta.tagShortDescr}
          levyAspxUrl={levyLoadedMeta.levyAspxUrl}
          ain={levyLoadedMeta.ain}
          demoMode={isDemoMode}
        />
        <div className={TOOL_DISCLOSURE_ROW_ALIGN_CLASS}>
          <BackToTopButton />
        </div>
      </>
    ) : null;

  const showParcelRecordExtendedJump = shouldShowParcelRecordExtendedSection(
    parcelRecordLoading,
    parcelRecordLoadFailed,
    parcelRecord,
  );

  const showTaxYearSummaryTile =
    !!levyLoadedMeta &&
    parcelTaxAndAssessmentYearsDiffer(
      levyLoadedMeta.parcelTaxYear,
      levyLoadedMeta.parcelAssessmentYear,
    );

  const levyAndPropertyLayout = showPropertyDetailsColumn ? (
    <div className="space-y-3 sm:space-y-5">
      {/*
        Levy first in DOM so mobile visual/keyboard match. On lg, grid placement
        puts property in the left column (sidebar) without CSS order; tab order
        still follows DOM (levy, then property).
      */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-6 lg:gap-y-3">
        <div className="space-y-3 lg:col-span-2 lg:col-start-2 lg:row-start-1">
          {levySectionLead}
        </div>
        <div className="lg:col-span-2 lg:col-start-2 lg:row-start-2">
          {levyBreakdownMain}
        </div>
        <section
          id={HOME_PROPERTY_DETAILS_ID}
          className="flex flex-col gap-3 scroll-mt-6 sm:scroll-mt-8 lg:col-start-1 lg:row-start-1 lg:row-span-2"
          aria-labelledby="parcel-record-heading"
        >
          <div className="space-y-3">{propertyDetailsHeader}</div>
          {propertyClassificationLine}
          <ParcelRecordPanel
            loading={parcelRecordLoading}
            loadFailed={parcelRecordLoadFailed}
            record={parcelRecord}
            pin={trimmedParcelPin}
            demoMode={isDemoMode}
          />
          {showParcelRecordExtendedJump ? (
            <a
              href={`#${PARCEL_RECORD_EXTENDED_SECTION_ID}`}
              className={`${btnOutlineSecondaryMd} hidden w-full cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-sm lg:mt-auto lg:inline-flex`}
              aria-label="Jump to Property details cont."
            >
              More property details
              {PROPERTY_DETAILS_JUMP_CHEVRON}
            </a>
          ) : null}
        </section>
      </div>
      <ParcelRecordExtendedSection
        loading={parcelRecordLoading}
        loadFailed={parcelRecordLoadFailed}
        record={parcelRecord}
        pin={trimmedParcelPin}
        demoMode={isDemoMode}
      />
      {propertyDetailsBelowPanel}
    </div>
  ) : (
    levyBreakdownMain
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
      {addressMatchStatus ? (
        <p className="sr-only" role="status" aria-live="polite">
          {addressMatchStatus}
        </p>
      ) : null}
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
          {hits != null && hits.length > 1 ? (
            <div
              className={`${ADDRESS_LOOKUP_PANEL_CLASS} mb-4`}
              role="region"
              aria-live="polite"
              aria-label="Matching properties"
            >
              <p className="mb-2 text-sm font-semibold text-slate-900">
                {hits.length} properties matched. Pick the row that matches your
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
                {hits.map((h, hitIndex) => {
                  const envelope = multiHitEnvelopeRows?.[hitIndex];
                  return (
                    <li
                      key={h.pin}
                      className="rounded-md border border-slate-200 bg-white px-3 py-3"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900">
                            PIN:{" "}
                            <span className="font-mono">{h.pin}</span>
                          </span>
                          {envelope != null ? (
                            <SitusEnvelopeAddress
                              row={envelope}
                              className="mt-1"
                            />
                          ) : (
                            <span className="mt-1 block text-slate-700">
                              {h.label}
                            </span>
                          )}
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
                  );
                })}
              </ul>
            </div>
          ) : null}
          {streetDidYouMean != null && streetDidYouMean.length > 0 ? (
            <div
              id={HOME_ADDRESS_STREET_SUGGESTIONS_ID}
              className={`${ADDRESS_LOOKUP_PANEL_CLASS} mb-4`}
              role="region"
              aria-live="polite"
              aria-label="Suggested streets"
            >
              <p className="mb-2 text-sm font-semibold text-slate-900">
                No exact street match. Did you mean one of these?
              </p>
              <ul className="space-y-2 text-sm text-slate-800 sm:text-base">
                {streetDidYouMean.map((s) => (
                  <li key={s.streetNameKey}>
                    <button
                      type="button"
                      className={`${btnOutlinePrimaryMd} w-full cursor-pointer justify-start px-3 py-2.5 text-left`}
                      disabled={levyLoadBusy}
                      onClick={() => applyStreetSuggestion(s)}
                    >
                      <span className="font-semibold">{s.streetNameKey}</span>
                      <span className="mt-0.5 block text-xs font-normal text-slate-600 sm:text-sm">
                        {s.sampleLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {showAdvancedAddressFields ? (
            <div className="mb-3">
              <p className="text-sm font-medium text-slate-800">Refine address</p>
              {hits != null && hits.length > 1 ? (
                <p className="mt-1 text-sm text-slate-600">
                  If none of the matching rows is yours, adjust these fields and
                  search again. You can also use your PIN from the county site.
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
              [
                error ? HOME_ADDRESS_LOOKUP_ERROR_ID : null,
                streetDidYouMean != null && streetDidYouMean.length > 0
                  ? HOME_ADDRESS_STREET_SUGGESTIONS_ID
                  : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
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
                <div
                  ref={streetTypeaheadRootRef}
                  className="relative flex min-w-0 flex-col gap-y-1"
                >
                  <label
                    htmlFor="home-address-simple-line"
                    className={FIELD_LABEL_CLASS}
                  >
                    Street address
                  </label>
                  <input
                    ref={simpleAddressInputRef}
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
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={streetTypeaheadOpen}
                    aria-controls={streetTypeaheadListId}
                    aria-autocomplete="list"
                    aria-activedescendant={
                      streetTypeaheadOpen && streetTypeaheadActiveIndex >= 0
                        ? `${streetTypeaheadListId}-opt-${streetTypeaheadActiveIndex}`
                        : undefined
                    }
                    onChange={(e) => {
                      setSimpleAddressLine(e.target.value);
                      setStreetDidYouMean(null);
                    }}
                    onFocus={() => {
                      void fetchArapahoeSitusToPinsJson();
                    }}
                    onBlur={(e) => {
                      // Scroll / iOS Done: relatedTarget is null — keep list open.
                      // Tab or focus move to a control outside the combobox: close.
                      const next = e.relatedTarget;
                      if (!(next instanceof Node)) return;
                      const root = streetTypeaheadRootRef.current;
                      if (root != null && !root.contains(next)) {
                        setStreetTypeaheadOpen(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "ArrowDown" &&
                        !streetTypeaheadOpen &&
                        streetTypeahead.length > 0
                      ) {
                        e.preventDefault();
                        setStreetTypeaheadOpen(true);
                        setStreetTypeaheadActiveIndex(0);
                        return;
                      }
                      if (!streetTypeaheadOpen || streetTypeahead.length === 0) {
                        return;
                      }
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setStreetTypeaheadActiveIndex((i) =>
                          Math.min(
                            (i < 0 ? 0 : i) + 1,
                            streetTypeahead.length - 1,
                          ),
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setStreetTypeaheadActiveIndex((i) => Math.max(i - 1, 0));
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setStreetTypeaheadOpen(false);
                      } else if (
                        e.key === "Enter" &&
                        streetTypeaheadActiveIndex >= 0
                      ) {
                        e.preventDefault();
                        applyStreetSuggestion(
                          streetTypeahead[streetTypeaheadActiveIndex]!,
                        );
                      }
                    }}
                    disabled={busy}
                    placeholder="e.g. 1234 South Holly Street"
                  />
                  {streetTypeaheadOpen && streetTypeahead.length > 0 ? (
                    <ul
                      id={streetTypeaheadListId}
                      role="listbox"
                      aria-label="Address suggestions"
                      className="absolute top-full z-20 mt-1 max-h-[min(24rem,55vh)] w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-md divide-y divide-slate-200"
                      onScroll={() => {
                        const input = simpleAddressInputRef.current;
                        if (input != null && document.activeElement === input) {
                          input.blur();
                        }
                      }}
                    >
                      {streetTypeahead.map((s, idx) => {
                        const pin = s.hits[0]?.pin ?? s.streetNameKey;
                        const envelope = streetTypeaheadEnvelopeRows[idx]!;
                        return (
                          <li
                            key={`${pin}-${idx}`}
                            id={`${streetTypeaheadListId}-opt-${idx}`}
                            role="option"
                            aria-selected={idx === streetTypeaheadActiveIndex}
                            className={`flex min-h-[4.25rem] cursor-pointer items-center px-4 py-3.5 text-base ${
                              idx === streetTypeaheadActiveIndex
                                ? "bg-sky-50 text-slate-900"
                                : "bg-white text-slate-800 active:bg-slate-50 hover:bg-slate-50"
                            }`}
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              applyStreetSuggestion(s);
                            }}
                          >
                            <SitusEnvelopeAddress row={envelope} />
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
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
                      textTriggerClassName={`${FIELD_LABEL_CLASS} ${TOOL_LINK_UNDERLINE_CLASS}`}
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
                    onChange={(e) => {
                      setStreetName(e.target.value);
                      setStreetDidYouMean(null);
                    }}
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
          <p className="mt-3 text-center text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            We do not save your address. This uses publicly available data. We
            do not track you.
          </p>
        </div>
      ) : (
        <div className="min-w-0 space-y-3">
          {billImpactCalloutBlock}
          <div
            className={PARCEL_SUMMARY_ROW_CLASS}
            role="region"
            aria-label="Property search result summary"
          >
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
                    <ParcelGlossaryPopoverTrigger
                      termId="term-owner-list"
                      textTrigger="Owner of record"
                      textTriggerId="owner-list-term-first"
                    />
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
            levyLoadedMeta.parcelAssessmentYear != null ? (
              <div
                className={PARCEL_SUMMARY_TILE_CLASS_POPOVER}
                id="home-parcel-assessment-year"
              >
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                    <ParcelGlossaryPopoverTrigger
                      termId="term-assessment-year"
                      textTrigger="Assessment year"
                      textTriggerId="assessment-year-term-first"
                    />
                  </div>
                  <p className={PARCEL_SUMMARY_TILE_VALUE_CLASS}>
                    {levyLoadedMeta.parcelAssessmentYear}
                  </p>
                </div>
              </div>
            ) : null}
            {!busy &&
            levyReadyForSummary &&
            levyLoadedMeta &&
            showTaxYearSummaryTile &&
            levyLoadedMeta.parcelTaxYear ? (
              <div
                className={PARCEL_SUMMARY_TILE_CLASS_POPOVER}
                id="home-parcel-tax-year"
              >
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                    <ParcelGlossaryPopoverTrigger
                      termId="term-tax-year"
                      textTrigger="Tax year"
                      textTriggerId="tax-year-term-first"
                    />
                  </div>
                  <p className={PARCEL_SUMMARY_TILE_VALUE_CLASS}>
                    {levyLoadedMeta.parcelTaxYear.trim()}
                  </p>
                </div>
              </div>
            ) : null}
            {!busy &&
            levyReadyForSummary &&
            levyLoadedMeta &&
            (levyLoadedMeta.parcelValues.totalActual != null ||
              levyLoadedMeta.parcelValues.totalAssessed != null ||
              estimatedAnnualPropertyTaxDollars != null) ? (
                <div className={PARCEL_SUMMARY_VALUE_PAIR_ROW_CLASS}>
                  {levyLoadedMeta.parcelValues.totalActual != null ? (
                    <div className={PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER}>
                      <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                        <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                          <ParcelGlossaryPopoverTrigger
                            termId="term-actual-value"
                            textTrigger="Actual value"
                            textTriggerId="actual-value-term-first"
                          />
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
                          <ParcelGlossaryPopoverTrigger
                            termId="term-assessed-value"
                            textTrigger="Assessed value"
                            textTriggerId="assessed-value-term-first"
                          />
                        </div>
                        <p className={PARCEL_SUMMARY_TILE_VALUE_CLASS}>
                          {formatUsdWhole(levyLoadedMeta.parcelValues.totalAssessed)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {estimatedAnnualPropertyTaxDollars != null ? (
                    <div
                      className={PARCEL_SUMMARY_VALUE_TILE_CLASS_POPOVER}
                      id="home-parcel-property-tax"
                    >
                      <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                        <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                          <ParcelGlossaryPopoverTrigger
                            termId="term-property-tax"
                            textTrigger="Property tax"
                            textTriggerId="property-tax-term-first"
                          />
                        </div>
                        <p className={PARCEL_SUMMARY_TILE_VALUE_CLASS}>
                          {formatUsdWhole(estimatedAnnualPropertyTaxDollars)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
            ) : null}
            {!busy && levyReadyForSummary && levyLoadedMeta ? (
              <div
                className={
                  homeCompsGridPdfHref &&
                  ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE
                    ? PARCEL_SUMMARY_COMPS_UNAVAILABLE_TILE_CLASS
                    : PARCEL_SUMMARY_TILE_CLASS_POPOVER
                }
                id="home-parcel-comps-pdf"
              >
                <div
                  className={
                    homeCompsGridPdfHref &&
                    ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE
                      ? `${PARCEL_SUMMARY_TILE_BODY_CLASS} relative`
                      : PARCEL_SUMMARY_TILE_BODY_CLASS
                  }
                >
                  {homeCompsGridPdfHref &&
                  ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE ? (
                    // TODO(comps-pdf-hosted-unavailable): Remove unavailable branch and set ARAPAHOE_COMPS_PDF_HOSTED_FILES_TEMPORARILY_UNAVAILABLE to false once county-hosted comps PDFs work reliably again (assessor's office: expected after 2027 revaluation notices post).
                    <CountyCompsPdfHelpPopover
                      ariaLabel={COUNTY_COMPS_PDF_TILE_UNAVAILABLE_ARIA_LABEL}
                      icon={compsIcon}
                      tileTrigger={{
                        labelClassName: PARCEL_SUMMARY_TILE_LABEL_CLASS,
                        label: (
                          <ParcelGlossaryPopoverTrigger
                            termId="term-comps"
                            textTrigger="Comps PDF"
                            textTriggerId="comps-pdf-term-first"
                            ariaLabel="Brief definition of comps and the county PDF."
                          />
                        ),
                        status: (
                          <p className={PARCEL_SUMMARY_COMPS_UNAVAILABLE_STATUS_CLASS}>
                            {COUNTY_COMPS_PDF_TILE_UNAVAILABLE_STATUS}
                          </p>
                        ),
                      }}
                    >
                      <CountyCompsPdfUnavailablePopoverBody
                        countyHref={homeCompsGridPdfHref}
                      />
                    </CountyCompsPdfHelpPopover>
                  ) : (
                    <>
                      <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                        <ParcelGlossaryPopoverTrigger
                          termId="term-comps"
                          textTrigger="Comps PDF"
                          textTriggerId="comps-pdf-term-first"
                          ariaLabel="Brief definition of comps and the county PDF."
                        />
                      </div>
                      {homeCompsGridPdfHref ? (
                        <a
                          href={homeCompsGridPdfHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={COMPS_PDF_ICON_CONTROL_CLASS}
                          aria-label="Open county comps grid PDF for this property (opens in a new tab)"
                        >
                          {compsIcon}
                        </a>
                      ) : isDemoMode ? (
                        <div className="flex justify-center">
                          <CountyCompsPdfHelpPopover
                            ariaLabel="Comps PDF is unavailable for this property"
                            icon={compsIcon}
                          >
                            <>
                              Demo mode does not include a comps PDF. Select{" "}
                              <strong className="font-semibold text-slate-900">
                                Start over
                              </strong>
                              {", "}
                              then enter your address to open your county comps PDF.
                            </>
                          </CountyCompsPdfHelpPopover>
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
                            <CountyCompsPdfHelpPopover
                              ariaLabel="Why there is no comps PDF link for this property"
                              icon={compsIcon}
                            >
                              <>
                                <p className="text-sm leading-relaxed text-slate-800">
                                  We build the county link from your PIN&apos;s AIN in
                                  the bundled{" "}
                                  <span className="font-mono text-xs sm:text-sm">
                                    arapahoe-pin-to-tag.json
                                  </span>
                                  . If that field is empty, we
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
                                  <PreserveSessionDocLink href="/sources">
                                    Sources
                                  </PreserveSessionDocLink>
                                  .
                                </p>
                              </>
                            </CountyCompsPdfHelpPopover>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
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
          {showHomeLevyBreakdownRegion ? (
            <div
              id={HOME_LEVY_BREAKDOWN_ID}
              className="scroll-mt-6 sm:scroll-mt-8"
              role="region"
              aria-label={HOME_LEVY_BREAKDOWN_ARIA_LABEL}
            >
              {levyAndPropertyLayout}
            </div>
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
                Parcel PIN or AIN
              </h3>
              <p
                id="home-parcel-pin-hint"
                className="mb-3 text-sm text-slate-700"
              >
                {showCountyPinFallback
                  ? "Enter the PIN (or AIN) from your county parcel record (see help below if needed)."
                  : "Pick the row that matches your property below, or type a PIN or AIN here if you already know it. If you are unsure, verify on the county parcel record (see note under the list)."}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
                <div className="min-w-0 w-full sm:min-w-[12rem] sm:flex-1">
                  <label
                    htmlFor="home-parcel-pin-input"
                    className="sr-only"
                  >
                    Parcel PIN or AIN
                  </label>
                  <input
                    id="home-parcel-pin-input"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={32}
                    className={INPUT_PIN_ROW}
                    value={parcelPin}
                    onChange={(e) => setParcelPin(e.target.value)}
                    onFocus={() => prefetchParcelLevyJsonBundle()}
                    disabled={levyLoadBusy}
                    placeholder="9-digit PIN or AIN from county record"
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
                  {": "}
                  use{" "}
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
                Enter that PIN (or AIN) in the{" "}
                <strong>Parcel PIN or AIN</strong>
                {" "}
                section above.
              </p>
            </div>
          ) : null}
          {levyLoadError ? (
            <InlineErrorCallout liveRegion="polite">{levyLoadError}</InlineErrorCallout>
          ) : null}

      {showHomeLevyBreakdownWorkbenchShell ? (
        <div
          id={HOME_LEVY_BREAKDOWN_ID}
          className={`scroll-mt-6 space-y-5 sm:scroll-mt-8 ${!showHomeLevyMetroAndHub ? "min-h-px" : ""}`}
          role={showHomeLevyMetroAndHub ? "region" : undefined}
          aria-label={showHomeLevyMetroAndHub ? HOME_LEVY_BREAKDOWN_ARIA_LABEL : undefined}
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

          {levyAndPropertyLayout}

          </>
          ) : null}
        </div>
      ) : null}

      {levyReadyForSummary ? (
        <>
          {isDemoMode ? (
            <NovCompsGridPanel payload={novCompsGridDemoPayload} />
          ) : null}
          {showHomeAccuracyFeedbackAside ? (
            <aside aria-label="Accuracy and feedback">
              <MailContactCard
                href={REPORT_PROBLEM_MAILTO_HREF}
                kicker="Feedback"
                primaryLine={CONTACT_EMAIL}
                secondary="We aim for accuracy. If something looks wrong, let us know. This link opens your mail app with a short form ready to fill in."
                fullWidth
              />
            </aside>
          ) : null}
          <div className={TOOL_DISCLOSURE_ROW_ALIGN_CLASS}>
            <BackToTopButton />
          </div>
        </>
      ) : null}
    </section>
  );
}
