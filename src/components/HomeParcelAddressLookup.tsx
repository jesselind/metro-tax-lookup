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
import {
  CampaignSiteLink,
  hasCampaignSiteLink,
} from "@/components/CampaignSiteLink";
import { CountyServiceGapCallout } from "@/components/CountyServiceGapCallout";
import { CountyServiceGapHeader } from "@/components/CountyServiceGapHeader";
import { CountyDataMartRefreshAttemptNote } from "@/content/countyDataMartRefreshNote";
import { SITE_CONFIG } from "@/lib/siteConfig";
import { BackToTopButton } from "@/components/BackToTopButton";
import { CountyAssessorMillLevyFigures } from "@/components/CountyAssessorMillLevyFigures";
import { CountyCompsPdfUnavailablePopoverBody } from "@/components/CountyCompsPdfGuidance";
import {
  CountyCompsPdfHelpPopover,
  COMPS_PDF_ICON_CONTROL_CLASS,
} from "@/components/CountyCompsPdfHelpPopover";
import { CountyParcelPinLookupHelp } from "@/components/CountyParcelPinLookupHelp";
import {
  CountyScopeTopLine,
  showCountyScopeTopLine,
} from "@/components/CountyScopeTopLine";
import { InlineErrorCallout } from "@/components/InlineErrorCallout";
import { DataLoadErrorCallout } from "@/components/DataLoadErrorCallout";
import { MailContactCard } from "@/components/MailContactCard";
import { InfoHintPopover } from "@/components/InfoHintPopover";
import { LevyCountyCompareSection } from "@/components/LevyCountyCompareSection";
import {
  LevyStackVisualization,
  type LevyStackVisualizationProps,
} from "@/components/LevyStackVisualization";
import { ParcelRecordPanel } from "@/components/ParcelRecordPanel";
import { ParcelRecordExtendedSection, shouldShowParcelRecordExtendedSection } from "@/components/ParcelRecordExtendedSection";
import { AudienceModeSwitch } from "@/components/AudienceModeSwitch";
import { CountySearchScopeSwitch } from "@/components/CountySearchScopeSwitch";
import { RentTaxPressurePanel } from "@/components/RentTaxPressurePanel";
import { MetroTaxShareFlow } from "@/components/MetroTaxShareFlow";
import { NovCompsGridPanel } from "@/components/NovCompsGridPanel";
import { CountyPriorYearValuesGapPopover } from "@/components/CountyPriorYearValuesGapPopover";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import { SitusEnvelopeAddress } from "@/components/SitusEnvelopeAddress";
import { SitusMultiAccountChooserList, SitusRealVsBusinessPersonalHelp } from "@/components/SitusMultiAccountChooserList";
import { SitusMultiAccountSwitcherDialog } from "@/components/SitusMultiAccountSwitcherDialog";
import { MillLevySummaryTile } from "@/components/MillLevySummaryTile";
import {
  COUNTY_COMPS_PDF_TILE_UNAVAILABLE_ARIA_LABEL,
  COUNTY_COMPS_PDF_TILE_UNAVAILABLE_STATUS,
} from "@/content/countyCompsPdfGuidance";
import { MILL_LEVY_STACK_HEADING_ID } from "@/content/millLevySummaryCopy";
import { btnOutlinePrimaryMd } from "@/lib/buttonClasses";
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
  fetchArapahoeParcelRecordForPin,
  fetchArapahoePinToTagJson,
  type ArapahoeParcelRecordRow,
  type ArapahoePinToTagFile,
} from "@/lib/arapahoeParcelLevyData";
import {
  anyCountySitusSearchAvailable,
  normalizeStreetNameKey,
  parseSimpleAddressLineForSitusLookup,
  resolveSitusFieldsForLookup,
  situsUnitLooksLikeStreetAutofillDuplicate,
  SITUS_AUTOFILL_LINE1_MAX_LEN,
  SITUS_INPUT_MAX_LEN,
  SITUS_SIMPLE_ADDRESS_LINE_MAX_LEN,
  trySitusAutofillBlurSplit,
  type SitusStreetSuggestion,
} from "@/lib/arapahoeSitusLookup";
import {
  enrichSitusPinHitsForChooser,
  isBusinessPersonalPropertyAccount,
  situsShouldOfferAccountTypeSwitch,
} from "@/lib/situsMultiPinChooser";
import { metroFromLevyLines } from "@/lib/metroDistrictFromLevyLines";
import {
  COUNTY_MILLS_YOY_EPS,
  levyStackTotalMillsDelta,
} from "@/lib/metroLevyYearOverYear";
import { buildSitusEnvelopeDisplayRows, situsLabelForTypeaheadDisplay } from "@/lib/addressLabelDifference";
import { novCompsGridDemoPayload } from "@/lib/novCompsGridSamplePayload";
import { looksLikeParcelIdInputAnyCounty } from "@/lib/countyAccountLookup";
import {
  prefetchCountySearchIndexes,
  resolveSitusCountyLookup,
  SITUS_COUNTY_AMBIGUOUS_MESSAGE,
  suggestSitusStreetsMultiCounty,
  type SitusStreetSuggestionWithCounty,
} from "@/lib/countySitusLookup";
import {
  DEFAULT_COUNTY_SEARCH_SCOPE,
  formatCountyIndexLoadMessage,
  type CountyIndexLoadProgress,
  type CountySearchScope,
} from "@/lib/countySearchScope";
import {
  COUNTY_CONFIG,
  countyConfigById,
  countyFeatureAvailable,
  countyFeaturePresentation,
} from "@/lib/countyConfig";
import {
  safeCountyBppNoticeOfValuationPdfUrl,
  safeCountyCompsGridPdfUrl,
} from "@/lib/safeExternalHref";
import { formatUsdWhole } from "@/lib/formatUsd";
import {
  annualTaxDollarsFromAssessedMills,
  parcelAssessedForDollarEstimate,
} from "@/lib/annualTaxFromAssessedMills";
import {
  DEFAULT_AUDIENCE_MODE,
  type AudienceMode,
} from "@/lib/audienceMode";
import {
  equalSplitFromAnnualTax,
  monthlyFromAnnualTax,
  resolveDwellingCount,
} from "@/lib/resolveDwellingCount";
import { formatLevyBundledAsOf } from "@/lib/formatLevyBundledAsOf";
import {
  parcelTaxAndAssessmentYearsDiffer,
  summaryOwnerOfRecord,
} from "@/lib/parcelRecordDisplay";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
  DASHBOARD_SECTION_HEADING_SPACED_CLASS,
  DASHBOARD_SECTION_META_CLASS,
  DASHBOARD_TILE_RADIUS_CLASS,
  HOME_AUDIENCE_STACK_GAP_CLASS,
  HOME_ADDRESS_LOOKUP_DEMO_CLASS,
  HOME_ADDRESS_LOOKUP_INPUT_CLASS,
  HOME_ADDRESS_LOOKUP_LABEL_CLASS,
  HOME_ADDRESS_LOOKUP_SEARCH_CLASS,
  INPUT_CLASS,
  COUNTY_SERVICE_GAP_STACK_CLASS,
  COUNTY_SERVICE_GAP_SUMMARY_TILE_BODY_CLASS,
  COUNTY_SERVICE_GAP_SUMMARY_TILE_CLASS,
  COUNTY_SERVICE_GAP_SUMMARY_TILE_STATUS_ROW_CLASS,
  COUNTY_SERVICE_GAP_TILE_STATUS_CLASS,
  PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_CLASS,
  PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_TITLE_CLASS,
  PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_META_CLASS,
  PARCEL_SUMMARY_JUMP_PROPERTY_DETAILS_CLASS,
  PARCEL_SUMMARY_JUMP_PROPERTY_DETAILS_LABEL_CLASS,
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
  TOOL_DISCLOSURE_ROW_ALIGN_CLASS,
  TOOL_LINK_UNDERLINE_CLASS,
} from "@/lib/toolFlowStyles";

/**
 * Prefetch search indexes for the county search gate scope only (lazy on engage).
 * Adjacent counties load after an address miss inside resolveSitusCountyLookup.
 */

const INPUT_ROW = HOME_ADDRESS_LOOKUP_INPUT_CLASS;
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

const ADDRESS_FORM_ACTION_BTN_CLASS = HOME_ADDRESS_LOOKUP_SEARCH_CLASS;

/** Shared shell for county help, PIN fallback, and list callouts. */
const ADDRESS_TILE_SURFACE_CLASS = `${DASHBOARD_TILE_RADIUS_CLASS} border border-slate-200 bg-slate-50/80`;

const ADDRESS_LOOKUP_PANEL_CLASS = `${ADDRESS_TILE_SURFACE_CLASS} p-3 sm:p-4`;

/** Autocomplete section token paired with `address-line1` on the Number input (mobile autofill). */
const AC_SECTION = "section-arapahoe-situs";

const SITUS_SEARCH_ON = anyCountySitusSearchAvailable();

/** Same-page anchor for the manual levy / breakdown region (Parcel PIN card link). */
const HOME_LEVY_BREAKDOWN_ID = "home-levy-breakdown-heading";
const HOME_LEVY_BREAKDOWN_ARIA_LABEL = "Property tax breakdown";

/** Property details block (full width below the levy stack). */
const HOME_PROPERTY_DETAILS_ID = "home-property-details";

const HOME_ADDRESS_LOOKUP_ERROR_ID = "home-address-lookup-error";
const HOME_ADDRESS_STREET_SUGGESTIONS_ID = "home-address-street-suggestions";
const HOME_MATCHING_PROPERTIES_ID = "home-matching-properties";

export type HomeParcelAddressLookupProps = {
  /** Fires when the header should offer Start over (any active address / result / PIN path). */
  onViewingParcelChange?: (viewingParcel: boolean, reset: () => void) => void;
  /** Fires when Own | Rent changes (landing intro copy follows the lens). */
  onAudienceModeChange?: (mode: AudienceMode) => void;
};

export function HomeParcelAddressLookup({
  onViewingParcelChange,
  onAudienceModeChange,
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
  /** When set, show DataLoadErrorCallout with mailto instead of plain error text. */
  const [errorTechnicalDetail, setErrorTechnicalDetail] = useState<
    string | null
  >(null);
  const [hits, setHits] = useState<{ pin: string; label: string }[] | null>(
    null,
  );
  /** pin-to-tag for multi-match chooser enrichment (owner / Real vs BPP / values). */
  const [multiMatchPinToTag, setMultiMatchPinToTag] =
    useState<ArapahoePinToTagFile | null>(null);
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
    SitusStreetSuggestionWithCounty[]
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
  const [levyLoadErrorTechnicalDetail, setLevyLoadErrorTechnicalDetail] =
    useState<string | null>(null);
  /** Parcel PIN is edited in the lookup flow only; levy and metro use loaded data, not a second PIN field. */
  const [parcelPin, setParcelPin] = useState("");
  /** County resolved from account-id lookup (drives config + JSON paths). */
  const [resolvedCountyId, setResolvedCountyId] = useState<string | null>(null);

  /** Opens levy / metro / hub without a PIN load (user builds the stack with Add tile). */
  const [homeLevyWorkbenchOpen, setHomeLevyWorkbenchOpen] = useState(false);
  /** True after a single PIN match or after the user picks a row from multiple matches. */
  const [addressSearchLocked, setAddressSearchLocked] = useState(false);
  /**
   * Self-declared Own / Rent lens (default Own). Not inferred from the parcel.
   * Start over resets to Own; flip after lock re-curates without re-fetch.
   */
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(
    DEFAULT_AUDIENCE_MODE,
  );
  /** Prefetch / probe scope for address + account search (default Arapahoe). */
  const [countySearchScope, setCountySearchScope] = useState<CountySearchScope>(
    DEFAULT_COUNTY_SEARCH_SCOPE,
  );
  const [indexLoadProgress, setIndexLoadProgress] =
    useState<CountyIndexLoadProgress | null>(null);
  const indexLoadRequestRef = useRef(0);
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
  /** Dashboard Account type tile: in-place multi-PIN switcher modal. */
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
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

  const activeCountyConfig = useMemo(
    () =>
      (resolvedCountyId ? countyConfigById(resolvedCountyId) : null) ??
      COUNTY_CONFIG,
    [resolvedCountyId],
  );
  const activeBppOn = countyFeatureAvailable("bpp", activeCountyConfig);
  const activeCompsPresentation = countyFeaturePresentation(
    "compsPdf",
    activeCountyConfig,
  );
  const activeCompsGap = activeCompsPresentation === "gap";
  const activePriorYearValuesGap = countyFeatureAvailable(
    "priorYearValuesGap",
    activeCountyConfig,
  );
  const activeDataMartRefreshGap = countyFeatureAvailable(
    "dataMartRefreshGap",
    activeCountyConfig,
  );

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
    setLevyLoadErrorTechnicalDetail(null);
    setLevyLoadBusy(false);
    setParcelPin("");
    setHomeLevyWorkbenchOpen(false);
    setParcelRecord(null);
    setParcelRecordLoading(false);
    setParcelRecordLoadFailed(false);
    setParcelRecordBundledAsOf(null);
    setResolvedCountyId(null);
  }, []);

  const loadParcelRecord = useCallback(
    async (lookupPin: string, countyId: string) => {
      const config = countyConfigById(countyId);
      const requestId = ++parcelRecordRequestRef.current;
      const isCurrentRequest = () => requestId === parcelRecordRequestRef.current;
      setParcelRecordLoading(true);
      setParcelRecordLoadFailed(false);
      setParcelRecord(null);
      setParcelRecordBundledAsOf(null);
      if (!config?.features.parcelRecordShards) {
        if (isCurrentRequest()) {
          setParcelRecordLoading(false);
        }
        return;
      }
      try {
        const result = await fetchArapahoeParcelRecordForPin(
          lookupPin,
          undefined,
          config.id,
        );
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
    },
    [],
  );

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
    async (pin: string, countyId?: string): Promise<boolean> => {
    const requestId = ++levyLoadRequestRef.current;
    const isCurrentRequest = () => requestId === levyLoadRequestRef.current;
    parcelRecordRequestRef.current += 1;
    setLevyLoadError(null);
    setLevyLoadErrorTechnicalDetail(null);
    setLevyTemplateMillsError(null);
    setLevyLoadBusy(true);
    setIsDemoMode(false);
    setParcelRecord(null);
    setParcelRecordLoading(false);
    setParcelRecordLoadFailed(false);
    setParcelRecordBundledAsOf(null);
    try {
      const result = await loadLevyStackFromPin(
        pin,
        countyId
          ? { countyId }
          : { scope: countySearchScope },
      );
      if (!isCurrentRequest()) return false;
      if (!result.ok) {
        setLevyLoadError(result.error);
        setLevyLoadErrorTechnicalDetail(result.technicalDetail ?? null);
        if (result.technicalDetail) {
          console.error("[civic-lookup]", result.technicalDetail);
        }
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
      setResolvedCountyId(result.countyId);
      if (!isCurrentRequest()) return false;
      void loadParcelRecord(result.matchedPin, result.countyId);
      return true;
    } finally {
      if (isCurrentRequest()) {
        setLevyLoadBusy(false);
      }
    }
    },
    [loadParcelRecord, countySearchScope],
  );

  const reportIndexProgress = useCallback(
    (progress: CountyIndexLoadProgress) => {
      setIndexLoadProgress(progress);
    },
    [],
  );

  const clearIndexProgress = useCallback(() => {
    setIndexLoadProgress(null);
  }, []);

  const streetTypeaheadRequestRef = useRef(0);
  const refreshStreetTypeahead = useCallback(
    async (
      num: string,
      suffix: string,
      namePartial: string,
      open: boolean,
    ) => {
      if (!num.trim() || !/\d/.test(num) || !SITUS_SEARCH_ON) {
        streetTypeaheadRequestRef.current += 1;
        setStreetTypeahead([]);
        setStreetTypeaheadOpen(false);
        setStreetTypeaheadActiveIndex(-1);
        clearIndexProgress();
        return;
      }
      const requestId = ++streetTypeaheadRequestRef.current;
      const loadId = ++indexLoadRequestRef.current;
      try {
        await prefetchCountySearchIndexes(countySearchScope, {
          onProgress: (progress) => {
            if (loadId === indexLoadRequestRef.current) {
              reportIndexProgress(progress);
            }
          },
        });
        if (requestId !== streetTypeaheadRequestRef.current) return;
        const list = await suggestSitusStreetsMultiCounty(
          num,
          suffix,
          namePartial,
          {
            scope: countySearchScope,
            onProgress: (progress) => {
              if (loadId === indexLoadRequestRef.current) {
                reportIndexProgress(progress);
              }
            },
          },
        );
        if (requestId !== streetTypeaheadRequestRef.current) return;
        if (list.length === 0) {
          setStreetTypeahead([]);
          setStreetTypeaheadOpen(false);
          setStreetTypeaheadActiveIndex(-1);
          return;
        }
        setStreetTypeahead(list);
        setStreetTypeaheadActiveIndex(-1);
        setStreetTypeaheadOpen(open && list.length > 0);
      } finally {
        if (loadId === indexLoadRequestRef.current) {
          clearIndexProgress();
        }
      }
    },
    [countySearchScope, clearIndexProgress, reportIndexProgress],
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
        /* Invalidate in-flight suggest so a late response cannot reopen. */
        streetTypeaheadRequestRef.current += 1;
        setStreetTypeahead([]);
        setStreetTypeaheadOpen(false);
        setStreetTypeaheadActiveIndex(-1);
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
    countySearchScope,
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
    () =>
      activeCompsPresentation === "omit"
        ? null
        : safeCountyCompsGridPdfUrl(levyLoadedMeta?.ain, activeCountyConfig),
    [activeCompsPresentation, levyLoadedMeta?.ain, activeCountyConfig],
  );

  const homeBppNovPdfHref = useMemo(
    () =>
      activeBppOn
        ? safeCountyBppNoticeOfValuationPdfUrl(
            levyLoadedMeta?.ain,
            activeCountyConfig,
          )
        : null,
    [activeBppOn, levyLoadedMeta?.ain, activeCountyConfig],
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

  const millLevyTotalDelta = useMemo(() => {
    const delta = levyStackTotalMillsDelta(levyLines);
    if (delta == null || Math.abs(delta) <= COUNTY_MILLS_YOY_EPS) return null;
    return delta;
  }, [levyLines]);

  function clearParcelTemplateExtended() {
    clearLevyStackOnly();
    setLevyLoadError(null);
    setLevyLoadErrorTechnicalDetail(null);
    setHomeLevyWorkbenchOpen(true);
  }

  /** Open the in-dashboard multi-account switcher (does not unlock search). */
  function openAccountSwitcher() {
    if (hits == null || hits.length < 2) return;
    setAccountSwitcherOpen(true);
  }

  function closeAccountSwitcher() {
    setAccountSwitcherOpen(false);
  }

  /** Switch PIN while staying on the locked dashboard (reload levy stack in place). */
  function switchDashboardAccount(pin: string) {
    setAccountSwitcherOpen(false);
    if (pin === parcelPin.trim()) return;
    setLevyLoadError(null);
    setLevyLoadErrorTechnicalDetail(null);
    clearLevyStackOnly();
    setParcelPin(pin);
    void loadLevyStack(pin);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.getElementById("page-top")?.focus({ preventScroll: true });
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
    setAccountSwitcherOpen(false);
    clearAllLevyState();
    setError(null);
    setErrorTechnicalDetail(null);
    setHits(null);
    setMultiMatchPinToTag(null);
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
      if (looksLikeParcelIdInputAnyCounty(rawSimple)) {
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

    if (!SITUS_SEARCH_ON) {
      setShowCountyPinFallback(true);
      setError(activeCountyConfig.situsSearchOffMessage);
      return;
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
    const loadId = ++indexLoadRequestRef.current;
    try {
      await prefetchCountySearchIndexes(countySearchScope, {
        onProgress: (progress) => {
          if (loadId === indexLoadRequestRef.current) {
            reportIndexProgress(progress);
          }
        },
      });
      const lookup = await resolveSitusCountyLookup(
        num,
        suffix,
        nameRaw,
        unitTrim,
        {
          scope: countySearchScope,
          onProgress: (progress) => {
            if (loadId === indexLoadRequestRef.current) {
              reportIndexProgress(progress);
            }
          },
        },
      );
      if (lookup.status === "data_error") {
        console.error("[civic-lookup]", lookup.detail);
        setError(
          "We could not load address lookup data. Please try searching again in a moment.",
        );
        setErrorTechnicalDetail(lookup.detail);
        return;
      }
      if (lookup.status === "ambiguous") {
        setShowCountyPinFallback(true);
        setError(SITUS_COUNTY_AMBIGUOUS_MESSAGE);
        return;
      }
      if (lookup.status === "not_found") {
        if (!useAdvanced) {
          setShowAdvancedAddressFields(true);
          setError(
            "No property matched that address. Use the fields in this form to fix the street name, unit, or spelling, then search again.",
          );
          return;
        }
        setShowCountyPinFallback(true);
        setError(
          "Still no match. Use your account number from the county site (see the help section), or double-check spelling and unit.",
        );
        return;
      }

      const { match } = lookup;
      setResolvedCountyId(match.countyId);
      const fuzzy = match.fuzzy;
      if (fuzzy.kind === "none") {
        if (!useAdvanced) {
          setShowAdvancedAddressFields(true);
          setError(
            "No property matched that address. Use the fields in this form to fix the street name, unit, or spelling, then search again.",
          );
          return;
        }
        setShowCountyPinFallback(true);
        setError(
          "Still no match. Use your account number from the county site (see the help section), or double-check spelling and unit.",
        );
        return;
      }
      if (fuzzy.kind === "suggest") {
        setMultiMatchPinToTag(match.pinToTag);
        setShowAdvancedAddressFields(true);
        setStreetDidYouMean(fuzzy.suggestions);
        return;
      }
      if (fuzzy.approximateStreet) {
        setStreetName(fuzzy.matchedStreetNameKey);
        setAddressMatchStatus(
          `Showing results for ${fuzzy.matchedStreetNameKey}. No exact match for ${nameNorm}.`,
        );
        if (!useAdvanced) {
          setSimpleAddressLine(
            [num, suffix, fuzzy.matchedStreetNameKey, unitTrim]
              .filter(Boolean)
              .join(" "),
          );
        }
      }
      const list = fuzzy.hits;
      setMultiMatchPinToTag(match.pinToTag);
      setHits(list);
      if (list.length === 1) {
        setAddressSearchLocked(true);
        setParcelPin(list[0].pin);
        void loadLevyStack(list[0].pin, match.countyId);
      } else {
        setShowAdvancedAddressFields(true);
      }
    } finally {
      if (loadId === indexLoadRequestRef.current) {
        clearIndexProgress();
      }
      setBusy(false);
    }
  }

  function applyStreetSuggestion(
    suggestion: SitusStreetSuggestion,
    countyId?: string,
  ) {
    setStreetDidYouMean(null);
    setAddressMatchStatus(null);
    setStreetTypeaheadOpen(false);
    setError(null);
    setErrorTechnicalDetail(null);
    setStreetName(suggestion.streetNameKey);
    setShowAdvancedAddressFields(true);
    const resolvedId = countyId ?? resolvedCountyId ?? undefined;
    if (resolvedId) {
      setResolvedCountyId(resolvedId);
    }
    const list = suggestion.hits;
    setHits(list);
    if (list.length === 1) {
      setAddressSearchLocked(true);
      setParcelPin(list[0].pin);
      void loadLevyStack(list[0].pin, resolvedId);
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
    setErrorTechnicalDetail(null);
    setHits(null);
    setMultiMatchPinToTag(null);
    setStreetDidYouMean(null);
    setAddressMatchStatus(null);
    setStreetTypeahead([]);
    setStreetTypeaheadOpen(false);
    setShowCountyPinFallback(false);
    setAddressSearchLocked(false);
    setAudienceMode(DEFAULT_AUDIENCE_MODE);
    setIsDemoMode(false);
    setAccountSwitcherOpen(false);
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
    setErrorTechnicalDetail(null);
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
      setResolvedCountyId("arapahoe");
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

  useEffect(() => {
    onAudienceModeChange?.(audienceMode);
  }, [audienceMode, onAudienceModeChange]);

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

  /**
   * PIN entry + workbench shortcut: unlocked multi-match chooser path, or county
   * fallback when address search finds nothing. Also when a levy load failed so
   * retry stays available (including locked single-match). Never on a successful
   * locked property report (multi-PIN switching is Switch account type only).
   */
  const showParcelPinSection =
    levyLoadError != null ||
    (!addressSearchLocked &&
      (showCountyPinFallback || (hits != null && hits.length > 1)));

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

  /**
   * Multi-match list: join pin-to-tag for owner / Real vs business personal
   * property / values, sorted so primary Real accounts surface first.
   */
  const enrichedMultiHits = useMemo(() => {
    if (hits == null || hits.length < 2) return null;
    return enrichSitusPinHitsForChooser(hits, multiMatchPinToTag);
  }, [hits, multiMatchPinToTag]);

  /** Pin-to-tag class for the locked PIN when multi-account enrichment is ready. */
  const lockedMultiHitPropertyClass = useMemo(() => {
    if (!trimmedParcelPin || enrichedMultiHits == null) return null;
    return (
      enrichedMultiHits.find((h) => h.pin === trimmedParcelPin)
        ?.propertyClassDescr ?? null
    );
  }, [trimmedParcelPin, enrichedMultiHits]);

  /**
   * Business personal property (equipment) accounts: Rent lens does not apply.
   * Prefer parcel-record tax roll; fall back to levy / pin-to-tag class so the
   * Own|Rent control can hide before the shard arrives.
   */
  const isBusinessPersonalAccount = isBusinessPersonalPropertyAccount({
    taxRollDescr: parcelRecord?.taxRollDescr,
    propertyClassDescr:
      parcelRecord?.propertyClassDescr ??
      levyLoadedMeta?.parcelValues.propertyClassification ??
      lockedMultiHitPropertyClass,
  });

  /**
   * Rent mode is self-declared Own|Rent, but never for BPP: dwelling split and
   * landlord framing do not fit equipment accounts.
   */
  const isRentMode = audienceMode === "rent" && !isBusinessPersonalAccount;

  /** Rent equal-split N from parcel-record land lines / improvement type / single dwelling. */
  const rentDwellingCount = useMemo(
    () => (isRentMode ? resolveDwellingCount(parcelRecord) : null),
    [isRentMode, parcelRecord],
  );

  const rentEqualSplit = useMemo(() => {
    if (
      !isRentMode ||
      estimatedAnnualPropertyTaxDollars == null ||
      rentDwellingCount == null
    ) {
      return null;
    }
    return equalSplitFromAnnualTax(
      estimatedAnnualPropertyTaxDollars,
      rentDwellingCount.n,
    );
  }, [isRentMode, estimatedAnnualPropertyTaxDollars, rentDwellingCount]);

  const rentWholePropertyMonthly = useMemo(() => {
    if (!isRentMode || estimatedAnnualPropertyTaxDollars == null) return null;
    return monthlyFromAnnualTax(estimatedAnnualPropertyTaxDollars);
  }, [isRentMode, estimatedAnnualPropertyTaxDollars]);

  /** Envelope rows for multi-match pick list (street + city, difference marks). */
  const multiHitEnvelopeRows = useMemo(() => {
    if (enrichedMultiHits == null) return null;
    return buildSitusEnvelopeDisplayRows(
      enrichedMultiHits.map((h) => h.label),
    );
  }, [enrichedMultiHits]);

  /** Shared rows for post-search chooser and dashboard account-switcher modal. */
  const multiAccountChooserItems = useMemo(() => {
    if (hits == null || hits.length < 2 || enrichedMultiHits == null) {
      return null;
    }
    const enrichmentReady = multiMatchPinToTag != null;
    return enrichedMultiHits.map((h, hitIndex) => ({
      pin: h.pin,
      label: h.label,
      enriched: enrichmentReady ? h : null,
      envelope: multiHitEnvelopeRows?.[hitIndex] ?? null,
      countyId: resolvedCountyId,
    }));
  }, [
    hits,
    enrichedMultiHits,
    multiMatchPinToTag,
    multiHitEnvelopeRows,
    resolvedCountyId,
  ]);

  /** Load pin-to-tag for multi-match enrichment (post-search chooser + dashboard switcher). */
  useEffect(() => {
    if (hits == null || hits.length < 2) {
      return;
    }
    let cancelled = false;
    void fetchArapahoePinToTagJson(undefined, resolvedCountyId ?? COUNTY_CONFIG.id).then((data) => {
      if (!cancelled) setMultiMatchPinToTag(data);
    });
    return () => {
      cancelled = true;
    };
  }, [hits, resolvedCountyId]);

  /** Same envelope layout for simple-line typeahead suggestions (+4 stripped). */
  const streetTypeaheadEnvelopeRows = useMemo(
    () =>
      buildSitusEnvelopeDisplayRows(
        streetTypeahead.map((s) =>
          situsLabelForTypeaheadDisplay(s.sampleLabel),
        ),
      ),
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
    allowLineEdit: !isRentMode,
    levyDollarUnitCount: isRentMode ? (rentDwellingCount?.n ?? null) : null,
    rentMode: isRentMode,
    countyConfig: activeCountyConfig,
  };

  const showPropertyDetailsColumn =
    levyLoadedMeta != null && levyLoadError == null;

  const propertyDetailsBundledLabel = useMemo(() => {
    if (!parcelRecordBundledAsOf) return null;
    return formatLevyBundledAsOf(parcelRecordBundledAsOf.slice(0, 10));
  }, [parcelRecordBundledAsOf]);

  const levyStackIntro = (
    <p id="home-levy-stack-intro" className={DASHBOARD_SECTION_META_CLASS}>
      Select a mill levy tile for more details.
    </p>
  );

  const levyStackBody = <LevyStackVisualization {...homeLevyStackProps} />;

  const levySectionLead = (
    <div className="space-y-3">
      <h3
        id={MILL_LEVY_STACK_HEADING_ID}
        tabIndex={-1}
        className={`${DASHBOARD_SECTION_HEADING_CLASS} scroll-mt-6 outline-none sm:scroll-mt-8`}
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
      rentMode={isRentMode}
      totalAssessedForEstimate={
        levyLoadedMeta &&
        typeof levyLoadedMeta.parcelValues.totalAssessed === "number" &&
        levyLoadedMeta.parcelValues.totalAssessed > 0
          ? isRentMode &&
            rentDwellingCount != null &&
            rentDwellingCount.n >= 1
            ? levyLoadedMeta.parcelValues.totalAssessed / rentDwellingCount.n
            : levyLoadedMeta.parcelValues.totalAssessed
          : null
      }
      sectionLead={undefined}
    >
      <section
        className="space-y-3"
        aria-labelledby={MILL_LEVY_STACK_HEADING_ID}
        aria-describedby="home-levy-stack-intro"
      >
        {levyStackBody}
      </section>
    </MetroTaxShareFlow>
  ) : (
    <section
      className="space-y-3"
      aria-labelledby={MILL_LEVY_STACK_HEADING_ID}
      aria-describedby="home-levy-stack-intro"
    >
      {levyStackBody}
    </section>
  );

  const propertyDetailsHeader = (
  <>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3
          id="parcel-record-heading"
          className={DASHBOARD_SECTION_HEADING_SPACED_CLASS}
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
        <>
          <p className={DASHBOARD_SECTION_META_CLASS}>
            County data current as of{" "}
            <time dateTime={parcelRecordBundledAsOf.slice(0, 10)}>
              {propertyDetailsBundledLabel}
            </time>
            .
          </p>
          {activeDataMartRefreshGap ? (
            <CountyServiceGapCallout density="compact" className="mt-1">
              <CountyDataMartRefreshAttemptNote
                bundledAsOfIso={parcelRecordBundledAsOf}
              />
            </CountyServiceGapCallout>
          ) : null}
        </>
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
          textTriggerId="property-classification-term-after-panel"
          variant="parcel-record"
          textTriggerClassName={`text-inherit ${TERM_LINK_CLASS}`}
        />
        {": "}
        {levyLoadedMeta.parcelValues.propertyClassification}
      </p>
    ) : null;

  /** Real+BPP (or other non-BPP + BPP) only — not all-Real condo multi-unit. */
  const canSwitchSitusAccounts =
    multiMatchPinToTag != null &&
    situsShouldOfferAccountTypeSwitch(enrichedMultiHits);
  const accountKindLabel = isBusinessPersonalAccount
    ? "Business personal property"
    : "Real property";

  const propertyDetailsBelowPanel =
    levyLines.length > 0 && levyLoadedMeta ? (
      <>
        <LevyCountyCompareSection
          countyConfig={activeCountyConfig}
          pin={levyLoadedMeta.pin}
          tagId={levyLoadedMeta.tagId}
          tagShortDescr={levyLoadedMeta.tagShortDescr}
          levyAspxUrl={levyLoadedMeta.levyAspxUrl}
          ain={levyLoadedMeta.ain}
          demoMode={isDemoMode}
          businessPersonal={isBusinessPersonalAccount}
        />
        <div className={TOOL_DISCLOSURE_ROW_ALIGN_CLASS}>
          <BackToTopButton />
        </div>
      </>
    ) : null;

  const showParcelRecordExtended =
    shouldShowParcelRecordExtendedSection(
      parcelRecordLoading,
      parcelRecordLoadFailed,
      parcelRecord,
    );

  const parcelRecordExtended = showParcelRecordExtended ? (
    <ParcelRecordExtendedSection
      loading={parcelRecordLoading}
      loadFailed={parcelRecordLoadFailed}
      record={parcelRecord}
      pin={trimmedParcelPin}
      demoMode={isDemoMode}
      businessPersonal={isBusinessPersonalAccount}
      omitContinuationHeading
      rentMode={isRentMode}
      countyConfig={activeCountyConfig}
    />
  ) : null;

  const showTaxYearSummaryTile =
    !!levyLoadedMeta &&
    parcelTaxAndAssessmentYearsDiffer(
      levyLoadedMeta.parcelTaxYear,
      levyLoadedMeta.parcelAssessmentYear,
    );

  const summaryOwnerList = summaryOwnerOfRecord(
    levyLoadedMeta?.parcelValues.ownerList,
    parcelRecord?.ownerList,
  );

  const propertyDetailsSection = showPropertyDetailsColumn ? (
    <section
      id={HOME_PROPERTY_DETAILS_ID}
      className="scroll-mt-6 space-y-3 sm:scroll-mt-8"
      aria-labelledby="parcel-record-heading"
    >
      <div className="space-y-3">{propertyDetailsHeader}</div>
      <ParcelRecordPanel
        loading={parcelRecordLoading}
        loadFailed={parcelRecordLoadFailed}
        record={parcelRecord}
        pin={trimmedParcelPin}
        demoMode={isDemoMode}
        rentMode={isRentMode}
        countyConfig={activeCountyConfig}
      />
      {propertyClassificationLine}
      {parcelRecordExtended}
    </section>
  ) : null;

  /** Unlocked workbench (PIN fallback / Add tile): levy then full-width property details. */
  const levyAndPropertyLayout = (
    <div className="space-y-3 sm:space-y-5">
      <div className="space-y-3">
        {levySectionLead}
        {levyBreakdownMain}
      </div>
      {propertyDetailsSection}
      {propertyDetailsBelowPanel}
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
      className={`w-full min-w-0 ${HOME_AUDIENCE_STACK_GAP_CLASS}`}
      aria-labelledby="home-tool-heading"
    >
      <h2 id="home-tool-heading" className="sr-only">
        Property tax lookup and breakdown
      </h2>
      {/* Own | Rent stays mounted across search ↔ locked Real so the lens flip stays familiar. Hidden on BPP (Rent does not apply). */}
      {!isBusinessPersonalAccount ? (
        <AudienceModeSwitch
          value={audienceMode}
          onChange={setAudienceMode}
          idPrefix={
            addressSearchLocked ? "audience-mode-report" : "audience-mode-search"
          }
        />
      ) : null}
      {!addressSearchLocked && indexLoadProgress ? (
        <div
          className="w-full min-w-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <p className="text-sm font-medium text-slate-800">
            {formatCountyIndexLoadMessage(indexLoadProgress)}
          </p>
          {indexLoadProgress.total > 0 ? (
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-slate-700 transition-[width] duration-300 ease-out"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (100 * indexLoadProgress.completed) /
                        Math.max(1, indexLoadProgress.total),
                    ),
                  )}%`,
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {addressMatchStatus ? (
        <p className="sr-only" role="status" aria-live="polite">
          {addressMatchStatus}
        </p>
      ) : null}
      {!addressSearchLocked ? (
        <div className="w-full min-w-0">
          {error ? (
            errorTechnicalDetail ? (
              <DataLoadErrorCallout
                id={HOME_ADDRESS_LOOKUP_ERROR_ID}
                className="mb-3"
                liveRegion="polite"
                message={error}
                technicalDetail={errorTechnicalDetail}
              />
            ) : (
              <InlineErrorCallout
                id={HOME_ADDRESS_LOOKUP_ERROR_ID}
                className="mb-3"
                liveRegion="polite"
              >
                {error}
              </InlineErrorCallout>
            )
          ) : null}
          {hits != null && hits.length > 1 ? (
            <div
              id={HOME_MATCHING_PROPERTIES_ID}
              tabIndex={-1}
              className={`${ADDRESS_LOOKUP_PANEL_CLASS} mb-4 scroll-mt-6 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:scroll-mt-8`}
              role="region"
              aria-live="polite"
              aria-label="Matching properties"
            >
              <p className="mb-2 text-sm font-semibold text-slate-900">
                {hits.length} accounts matched at this address. Pick the row that
                matches your unit, owner, or account type
              </p>
              <p className="mb-3 text-sm text-slate-700">
                One street can have several tax accounts (for example a building
                plus business personal property). Not sure which PIN is yours?
                Compare the PIN, owner, or legal description on the{" "}
                <a
                  href={activeCountyConfig.residentLinks.propertySearch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={COUNTY_EXTERNAL_LINK_CLASS}
                >
                  county property search<span className="sr-only"> (opens in a new tab)</span>
                </a>
                {" "}
                for buildings and land, or the{" "}
                <a
                  href={
                    activeCountyConfig.residentLinks.bppSearch ??
                    activeCountyConfig.residentLinks.propertySearch
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={COUNTY_EXTERNAL_LINK_CLASS}
                >
                  county business personal property search<span className="sr-only"> (opens in a new tab)</span>
                </a>
                {" "}
                for equipment accounts.
              </p>
              <div className="mb-3">
                <SitusRealVsBusinessPersonalHelp idPrefix="multi-match" />
              </div>
              {multiAccountChooserItems != null ? (
                <SitusMultiAccountChooserList
                  items={multiAccountChooserItems}
                  selectDisabled={levyLoadBusy}
                  selectMode="choose"
                  onSelectPin={(pin) => {
                    setAddressSearchLocked(true);
                    setParcelPin(pin);
                    void loadLevyStack(pin, resolvedCountyId ?? undefined);
                  }}
                />
              ) : null}
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
                      onClick={() =>
                        applyStreetSuggestion(s, resolvedCountyId ?? undefined)
                      }
                    >
                      <CountyScopeTopLine
                        countyId={resolvedCountyId}
                        className="mb-0.5"
                      />
                      <span className="font-semibold">{s.streetNameKey}</span>
                      <span className="mt-0.5 block text-xs font-normal text-slate-600 sm:text-sm">
                        {situsLabelForTypeaheadDisplay(s.sampleLabel)}
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
          <div
            className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:gap-3"
          >
            <CountySearchScopeSwitch
              value={countySearchScope}
              onChange={(scope) => {
                setCountySearchScope(scope);
                streetTypeaheadRequestRef.current += 1;
                setStreetTypeahead([]);
                setStreetTypeaheadOpen(false);
                setStreetTypeaheadActiveIndex(-1);
                clearIndexProgress();
              }}
              className="lg:shrink-0"
            />
            <form
              className={`min-w-0 flex-1 ${
                showAdvancedAddressFields
                  ? ADDRESS_LOOKUP_FORM_CLASS
                  : SIMPLE_ADDRESS_FORM_CLASS
              }`}
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
                  className="relative flex min-w-0 flex-col"
                >
                  <label
                    htmlFor="home-address-simple-line"
                    className={HOME_ADDRESS_LOOKUP_LABEL_CLASS}
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
                      if (!SITUS_SEARCH_ON) return;
                      const loadId = ++indexLoadRequestRef.current;
                      void prefetchCountySearchIndexes(countySearchScope, {
                        onProgress: (progress) => {
                          if (loadId === indexLoadRequestRef.current) {
                            reportIndexProgress(progress);
                          }
                        },
                      }).finally(() => {
                        if (loadId === indexLoadRequestRef.current) {
                          clearIndexProgress();
                        }
                      });
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
                          streetTypeahead[streetTypeaheadActiveIndex]!.countyId,
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
                              applyStreetSuggestion(s, s.countyId);
                            }}
                          >
                            <div className="min-w-0">
                              <CountyScopeTopLine
                                countyId={s.countyId}
                                className="mb-0.5"
                              />
                              <SitusEnvelopeAddress row={envelope} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
                <div className="flex w-full min-w-0 flex-col md:w-auto md:flex-none md:justify-end">
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
            <div className="flex w-full min-w-0 flex-col lg:w-auto lg:flex-none lg:shrink-0 lg:justify-end">
              <button
                type="button"
                className={HOME_ADDRESS_LOOKUP_DEMO_CLASS}
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
          {hasCampaignSiteLink() ? (
            <div className="mt-3 text-center">
              {/* FORK REQUIRED: SITE_CONFIG.campaignHomeDisclosureLabel + campaignSiteUrl */}
              <CampaignSiteLink variant="outline">
                {SITE_CONFIG.campaignHomeDisclosureLabel}
              </CampaignSiteLink>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="min-w-0 space-y-3">
          {error ? (
            errorTechnicalDetail ? (
              <DataLoadErrorCallout
                className="mt-1"
                liveRegion="polite"
                message={error}
                technicalDetail={errorTechnicalDetail}
              />
            ) : (
              <InlineErrorCallout className="mt-1" liveRegion="polite">
                {error}
              </InlineErrorCallout>
            )
          ) : null}
          {levyLoadError ? (
            levyLoadErrorTechnicalDetail ? (
              <DataLoadErrorCallout
                className="mt-1"
                liveRegion="polite"
                message={levyLoadError}
                technicalDetail={levyLoadErrorTechnicalDetail}
              />
            ) : (
              <InlineErrorCallout className="mt-1" liveRegion="polite">
                {levyLoadError}
              </InlineErrorCallout>
            )
          ) : null}
          {isRentMode &&
          estimatedAnnualPropertyTaxDollars != null &&
          rentWholePropertyMonthly != null ? (
            <>
              <RentTaxPressurePanel
                estimatedAnnualDollars={estimatedAnnualPropertyTaxDollars}
                estimatedMonthlyDollars={rentWholePropertyMonthly}
                dwelling={rentDwellingCount}
                equalSplit={rentEqualSplit}
                dwellingPending={parcelRecordLoading}
              />
              {/* Separate rent payoff from owner-style summary / levy stack below. */}
              <div className="py-2 sm:py-3" aria-hidden>
                <hr className="border-0 border-t border-slate-300" />
              </div>
            </>
          ) : null}
          <div className="grid grid-cols-1 gap-x-3 gap-y-6 sm:gap-y-8 lg:grid-cols-3 lg:items-start lg:gap-x-6 lg:gap-y-3">
            <div
              className="min-w-0"
              role="region"
              aria-label="Property search result summary"
            >
              <div className={PARCEL_SUMMARY_ROW_CLASS}>
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
            {/* Keep Switch available after levy load failure so another PIN can be tried. */}
            {!busy &&
            canSwitchSitusAccounts &&
            (levyReadyForSummary || levyLoadError != null) ? (
              <button
                type="button"
                id="home-parcel-account-type"
                className={PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_CLASS}
                onClick={openAccountSwitcher}
                aria-haspopup="dialog"
                aria-expanded={accountSwitcherOpen}
                aria-label={`Switch account type. Currently ${accountKindLabel}.`}
              >
                <span className={PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_TITLE_CLASS}>
                  Switch account type ›
                </span>
                <span className={PARCEL_SUMMARY_ACCOUNT_SWITCH_BUTTON_META_CLASS}>
                  {accountKindLabel}
                </span>
              </button>
            ) : null}
            {!busy &&
            lockedAddressHeadline &&
            (!levyReadyForSummary || levyLoadedMeta) ? (
              <div className={PARCEL_SUMMARY_TILE_CLASS}>
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <p className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>Address</p>
                  <p className={PARCEL_SUMMARY_TILE_ADDRESS_CLASS}>
                    <span className="inline">{lockedAddressHeadline}</span>
                    {showCountyScopeTopLine() ? (
                      <>
                        <span
                          className="px-1.5 text-slate-400"
                          aria-hidden
                        >
                          ·
                        </span>
                        <span className="font-semibold text-indigo-800">
                          {activeCountyConfig.displayName}
                        </span>
                      </>
                    ) : null}
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
            summaryOwnerList != null ? (
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
                    {summaryOwnerList}
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
              estimatedAnnualPropertyTaxDollars != null ||
              sumMills > 0) ? (
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
                        {activePriorYearValuesGap ? (
                          <CountyPriorYearValuesGapPopover
                            hasSaleHistory={
                              !isBusinessPersonalAccount && parcelRecord != null
                            }
                          />
                        ) : null}
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
                  {sumMills > 0 ? (
                    <MillLevySummaryTile
                      mills={sumMills}
                      millsDelta={millLevyTotalDelta}
                      assessed={levyLoadedMeta.parcelValues.totalAssessed}
                    />
                  ) : null}
                </div>
            ) : null}
            {!busy &&
            levyReadyForSummary &&
            levyLoadedMeta &&
            !isRentMode &&
            isBusinessPersonalAccount &&
            activeBppOn ? (
              <div
                className={PARCEL_SUMMARY_TILE_CLASS_POPOVER}
                id="home-parcel-notice-of-valuation"
              >
                <div className={PARCEL_SUMMARY_TILE_BODY_CLASS}>
                  <div className={PARCEL_SUMMARY_TILE_LABEL_CLASS}>
                    <ParcelGlossaryPopoverTrigger
                      termId="term-notice-of-valuation"
                      textTrigger="Notice of Valuation"
                      textTriggerId="notice-of-valuation-term-first"
                      ariaLabel="Brief definition of Notice of Valuation."
                    />
                  </div>
                  {homeBppNovPdfHref ? (
                    <a
                      href={homeBppNovPdfHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={COMPS_PDF_ICON_CONTROL_CLASS}
                      aria-label="Open county Notice of Valuation PDF for this account (opens in a new tab)"
                    >
                      {compsIcon}
                    </a>
                  ) : (
                    <div
                      className="space-y-2"
                      role="status"
                      aria-live="polite"
                    >
                      <p className="text-center text-sm leading-snug text-slate-600 sm:text-left">
                        No Notice of Valuation PDF from here: this PIN is missing
                        an assessor id (AIN) in the bundled parcel index.
                      </p>
                      <div className="flex justify-center sm:justify-start">
                        <CountyCompsPdfHelpPopover
                          ariaLabel="Why there is no Notice of Valuation link for this account"
                          icon={compsIcon}
                        >
                          <>
                            <p className="text-sm leading-relaxed text-slate-800">
                              We build the county link from your account&apos;s
                              assessor id (AIN) in the bundled parcel index. If
                              that field is empty, we cannot form{" "}
                              <span className="whitespace-nowrap">
                                FileDownload.ashx?AIN=…
                              </span>{" "}
                              on the business personal property site safely.
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-slate-800">
                              Open{" "}
                              <a
                                href={
                                  activeCountyConfig.residentLinks.bppSearch ??
                                  activeCountyConfig.residentLinks.propertySearch
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className={COUNTY_EXTERNAL_LINK_CLASS}
                              >
                                {activeCountyConfig.displayName} business personal
                                property search<span className="sr-only"> (opens in a new tab)</span>
                              </a>
                              {" "}
                              to reach your account from the county. For how the
                              bundle is built, see{" "}
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
                </div>
              </div>
            ) : null}
            {!busy &&
            levyReadyForSummary &&
            levyLoadedMeta &&
            !isRentMode &&
            !isBusinessPersonalAccount &&
            activeCompsPresentation !== "omit" ? (
              <div
                className={
                  homeCompsGridPdfHref &&
                  activeCompsGap
                    ? COUNTY_SERVICE_GAP_SUMMARY_TILE_CLASS
                    : homeCompsGridPdfHref
                      ? `${PARCEL_SUMMARY_TILE_CLASS_POPOVER} has-[a:hover]:bg-slate-100 has-[a:focus-visible]:bg-slate-100`
                      : PARCEL_SUMMARY_TILE_CLASS_POPOVER
                }
                id="home-parcel-comps-pdf"
              >
                <div
                  className={
                    homeCompsGridPdfHref &&
                    activeCompsGap
                      ? `${COUNTY_SERVICE_GAP_SUMMARY_TILE_BODY_CLASS} relative`
                      : PARCEL_SUMMARY_TILE_BODY_CLASS
                  }
                >
                  {homeCompsGridPdfHref &&
                  activeCompsGap ? (
                    // TODO(comps-pdf-hosted-unavailable): Flip activeCountyConfig.knownFailures.compsPdfHostedFiles to false once county-hosted comps PDFs work reliably again (assessor's office: expected after 2027 revaluation notices post).
                    <CountyCompsPdfHelpPopover
                      ariaLabel={COUNTY_COMPS_PDF_TILE_UNAVAILABLE_ARIA_LABEL}
                      icon={compsIcon}
                      tileTrigger={{
                        labelClassName: PARCEL_SUMMARY_TILE_LABEL_CLASS,
                        statusRowClassName:
                          COUNTY_SERVICE_GAP_SUMMARY_TILE_STATUS_ROW_CLASS,
                        label: (
                          <ParcelGlossaryPopoverTrigger
                            termId="term-comps"
                            textTrigger="Comparable properties"
                            textTriggerId="comps-pdf-term-first"
                            ariaLabel="Brief definition of comparable properties and the county PDF."
                          />
                        ),
                        status: (
                          <div className={`${COUNTY_SERVICE_GAP_STACK_CLASS} min-w-0 flex-1`}>
                            <CountyServiceGapHeader density="compact" />
                            <p className={COUNTY_SERVICE_GAP_TILE_STATUS_CLASS}>
                              {COUNTY_COMPS_PDF_TILE_UNAVAILABLE_STATUS}
                            </p>
                          </div>
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
                          textTrigger="Comparable properties"
                          textTriggerId="comps-pdf-term-first"
                          ariaLabel="Brief definition of comparable properties and the county PDF."
                        />
                      </div>
                      {homeCompsGridPdfHref ? (
                        <a
                          href={homeCompsGridPdfHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${COMPS_PDF_ICON_CONTROL_CLASS} mt-0.5`}
                          aria-label="Open county comparable properties PDF for this property (opens in a new tab)"
                        >
                          {compsIcon}
                        </a>
                      ) : isDemoMode ? (
                        <div className="flex justify-center">
                          <CountyCompsPdfHelpPopover
                            ariaLabel="Comparable properties PDF is unavailable for this property"
                            icon={compsIcon}
                          >
                            <>
                              Demo mode does not include a comparable properties
                              PDF. Select{" "}
                              <strong className="font-semibold text-slate-900">
                                Start over
                              </strong>
                              {", "}
                              then enter your address to open your county
                              comparable properties PDF.
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
                            No county comparable properties PDF from here: this
                            PIN is missing an assessor parcel id (AIN) in the
                            bundled parcel index.
                          </p>
                          <div className="flex justify-center sm:justify-start">
                            <CountyCompsPdfHelpPopover
                              ariaLabel="Why there is no comparable properties PDF link for this property"
                              icon={compsIcon}
                            >
                              <>
                                <p className="text-sm leading-relaxed text-slate-800">
                                  We build the county link from your account&apos;s
                                  assessor parcel id (AIN) in the bundled parcel
                                  index. If that field is empty, we cannot form{" "}
                                  <span className="whitespace-nowrap">
                                    FileDownload.ashx?AIN=…
                                  </span>{" "}
                                  safely.
                                </p>
                                <p className="mt-3 text-sm leading-relaxed text-slate-800">
                                  Open{" "}
                                  <a
                                    href={activeCountyConfig.residentLinks.propertySearch}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={COUNTY_EXTERNAL_LINK_CLASS}
                                  >
                                    {activeCountyConfig.displayName} property search<span className="sr-only"> (opens in a new tab)</span>
                                  </a>
                                  {" "}
                                  to reach your parcel and comparable properties
                                  from the county. For how the bundle is built,
                                  see{" "}
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
            {!busy &&
            levyReadyForSummary &&
            levyLoadedMeta &&
            showPropertyDetailsColumn ? (
              <a
                href={`#${HOME_PROPERTY_DETAILS_ID}`}
                className={PARCEL_SUMMARY_JUMP_PROPERTY_DETAILS_CLASS}
                aria-label="Jump to property details"
              >
                <span className={PARCEL_SUMMARY_JUMP_PROPERTY_DETAILS_LABEL_CLASS}>
                  Property details
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-4 shrink-0 text-slate-700"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
                  />
                </svg>
              </a>
            ) : null}
              </div>
            </div>
            {showHomeLevyBreakdownRegion ? (
              <div
                id={HOME_LEVY_BREAKDOWN_ID}
                className="min-w-0 space-y-3 scroll-mt-6 sm:scroll-mt-8 lg:col-span-2"
                role="region"
                aria-label={HOME_LEVY_BREAKDOWN_ARIA_LABEL}
              >
                {levySectionLead}
                {levyBreakdownMain}
              </div>
            ) : null}
          </div>
          {propertyDetailsSection}
          {propertyDetailsBelowPanel}
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
                    onFocus={() => {
                      const loadId = ++indexLoadRequestRef.current;
                      void prefetchCountySearchIndexes(countySearchScope, {
                        onProgress: (progress) => {
                          if (loadId === indexLoadRequestRef.current) {
                            reportIndexProgress(progress);
                          }
                        },
                      }).finally(() => {
                        if (loadId === indexLoadRequestRef.current) {
                          clearIndexProgress();
                        }
                      });
                    }}
                    disabled={levyLoadBusy}
                    placeholder="Account number, PIN, or AIN from your county record"
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
                  </strong>.
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
          {/* Unlocked path only; locked report shows levyLoadError above the summary grid. */}
          {!addressSearchLocked && levyLoadError ? (
            levyLoadErrorTechnicalDetail ? (
              <DataLoadErrorCallout
                liveRegion="polite"
                message={levyLoadError}
                technicalDetail={levyLoadErrorTechnicalDetail}
              />
            ) : (
              <InlineErrorCallout liveRegion="polite">
                {levyLoadError}
              </InlineErrorCallout>
            )
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
                    href={activeCountyConfig.residentLinks.propertySearch}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={COUNTY_EXTERNAL_LINK_CLASS}
                  >
                    county property search<span className="sr-only"> (opens in a new tab)</span>
                  </a>. On the parcel record, use{" "}
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
          {isDemoMode && !isRentMode ? (
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

      {accountSwitcherOpen &&
      multiAccountChooserItems != null &&
      canSwitchSitusAccounts ? (
        <SitusMultiAccountSwitcherDialog
          items={multiAccountChooserItems}
          currentPin={trimmedParcelPin || null}
          selectDisabled={levyLoadBusy}
          onSelectPin={switchDashboardAccount}
          onClose={closeAccountSwitcher}
        />
      ) : null}
    </section>
  );
}
