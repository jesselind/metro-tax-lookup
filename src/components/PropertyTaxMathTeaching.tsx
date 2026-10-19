// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Teaching walkthrough (vertical): assessment rates → appraised → assessed →
 * mills → mill math → bill total. Home sample uses default props (always open,
 * sample note, fake stack). Locked property: collapsed disclosure, this-parcel
 * numbers, optional residential local haircut, shortened mill buckets.
 */
import {
  useId,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  FireIcon,
  HomeModernIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import { DisclosureChevron } from "@/components/DisclosureChevron";
import {
  COLORADO_DPT_2026_ASSESSMENT_RATES_SECTION_URL,
  COLORADO_DPT_ASSESSED_VALUE_SECTION_URL,
  COLORADO_DPT_BUSINESS_AND_INDUSTRY_ASSESSED_VALUE_SECTION_URL,
  COLORADO_DPT_RESIDENTIAL_LOCAL_ASSESSMENT_RATE_URL,
} from "@/lib/arapahoeCountyUrls";
import { formatUsdCents, formatUsdWhole } from "@/lib/formatUsd";
import {
  assessmentPathFromValues,
  computePropertyTaxMathStack,
  formatTeachingMills,
  localStackLines,
  PROPERTY_TAX_MATH_APPRAISED_PLAIN,
  PROPERTY_TAX_MATH_APPRAISED_STEP_TITLE,
  PROPERTY_TAX_MATH_ASSESSED_AFTER_HAIRCUT_PLAIN,
  PROPERTY_TAX_MATH_ASSESSED_SINGLE_STEP_PLAIN,
  PROPERTY_TAX_MATH_ASSESSED_SINGLE_STEP_TITLE,
  PROPERTY_TAX_MATH_ASSESSED_STEP_PLAIN,
  PROPERTY_TAX_MATH_ASSESSED_STEP_TITLE,
  PROPERTY_TAX_MATH_DPT_BUSINESS_LINK_LABEL,
  PROPERTY_TAX_MATH_DPT_HAIRCUT_LINK_LABEL,
  PROPERTY_TAX_MATH_DPT_LINK_LABEL,
  PROPERTY_TAX_MATH_DPT_RATES_CHART_LINK_LABEL,
  PROPERTY_TAX_MATH_HAIRCUT_STEP_PLAIN,
  PROPERTY_TAX_MATH_HAIRCUT_STEP_TITLE,
  PROPERTY_TAX_MATH_LEVY_STACK_POINTER,
  PROPERTY_TAX_MATH_LOCAL_COLOR,
  PROPERTY_TAX_MATH_LOCAL_MATH_STEP_TITLE,
  PROPERTY_TAX_MATH_MILLS_PROPERTY_LEAD,
  PROPERTY_TAX_MATH_MILLS_PROPERTY_SINGLE_LEAD,
  PROPERTY_TAX_MATH_MILLS_SAMPLE_LEAD,
  PROPERTY_TAX_MATH_MILLS_STEP_TITLE,
  PROPERTY_TAX_MATH_RATES_SINGLE_STEP_PLAIN,
  PROPERTY_TAX_MATH_RATES_SINGLE_STEP_TITLE,
  PROPERTY_TAX_MATH_RATES_STEP_PLAIN,
  PROPERTY_TAX_MATH_RATES_STEP_TITLE,
  PROPERTY_TAX_MATH_SCHOOL_COLOR,
  PROPERTY_TAX_MATH_SCHOOL_MATH_STEP_TITLE,
  PROPERTY_TAX_MATH_SCHOOL_RESIDENTIAL_NOTE,
  PROPERTY_TAX_MATH_SINGLE_MATH_STEP_TITLE,
  PROPERTY_TAX_MATH_TEACHING_DISCLOSURE_TEASER,
  PROPERTY_TAX_MATH_TEACHING_HEADING,
  PROPERTY_TAX_MATH_TEACHING_SAMPLE_NOTE,
  PROPERTY_TAX_MATH_TOTAL_STEP_TITLE,
  PROPERTY_TAX_MATH_TOTAL_STEP_TITLE_SINGLE,
  ratesCiteFromValues,
  schoolStackLines,
  totalMillsFromMathValues,
  totalTaxDollarsFromMathValues,
  type PropertyTaxMathStackLineComputed,
  type PropertyTaxMathTeachingValues,
} from "@/lib/propertyTaxMathTeaching";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";

function dptRatesCite(values: PropertyTaxMathTeachingValues): {
  href: string;
  label: string;
} {
  switch (ratesCiteFromValues(values)) {
    case "nonresidential_assessment_rates":
      return {
        href: COLORADO_DPT_2026_ASSESSMENT_RATES_SECTION_URL,
        label: PROPERTY_TAX_MATH_DPT_RATES_CHART_LINK_LABEL,
      };
    case "business_and_industry":
      return {
        href: COLORADO_DPT_BUSINESS_AND_INDUSTRY_ASSESSED_VALUE_SECTION_URL,
        label: PROPERTY_TAX_MATH_DPT_BUSINESS_LINK_LABEL,
      };
    case "residential_assessed_value":
    default:
      return {
        href: COLORADO_DPT_ASSESSED_VALUE_SECTION_URL,
        label: PROPERTY_TAX_MATH_DPT_LINK_LABEL,
      };
  }
}

type StackIcon = ComponentType<SVGProps<SVGSVGElement>>;

const STACK_ICONS: Record<string, StackIcon> = {
  school: AcademicCapIcon,
  county: BuildingOffice2Icon,
  fire: FireIcon,
  metro: Square3Stack3DIcon,
  local: BuildingOffice2Icon,
  all: Square3Stack3DIcon,
};

const LOCAL = PROPERTY_TAX_MATH_LOCAL_COLOR;
const SCHOOL = PROPERTY_TAX_MATH_SCHOOL_COLOR;

function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-sm font-bold text-white shadow-sm sm:h-9 sm:w-9 sm:text-base"
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

function TeachingStep({
  step,
  title,
  children,
}: {
  step: number;
  title: ReactNode;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <div className="pt-8 first:pt-3 sm:pt-10 sm:first:pt-4">
      <div className="flex items-center gap-3">
        <StepBadge n={step} />
        <h4
          id={headingId}
          className="min-w-0 flex-1 text-lg font-bold leading-snug text-slate-900 sm:text-xl"
        >
          <span className="sr-only">{`Step ${step}. `}</span>
          {title}
        </h4>
      </div>
      {/* Full-bleed on phone; indent under badge+title from sm up. */}
      <div className="mt-3 pl-0 sm:pl-12">{children}</div>
    </div>
  );
}

function RateCard({
  title,
  rateLabel,
  plain,
  color,
  footnote,
}: {
  title: ReactNode;
  rateLabel: string;
  plain: ReactNode;
  color: string;
  footnote?: ReactNode;
}) {
  const titleId = useId();
  const rateId = useId();
  return (
    <div
      className="rounded-2xl px-4 py-4 ring-1 ring-slate-200/90 sm:px-5 sm:py-5"
      style={{ backgroundColor: `${color}12` }}
      role="group"
      aria-labelledby={`${titleId} ${rateId}`}
    >
      <h5
        id={titleId}
        className="text-base font-bold sm:text-lg"
        style={{ color }}
      >
        {title}
      </h5>
      <p
        id={rateId}
        className="mt-1 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl"
        style={{ color }}
      >
        {rateLabel}
      </p>
      <p className="mt-2 text-base font-semibold leading-snug text-slate-700 sm:text-lg">
        {plain}
      </p>
      {footnote ? (
        <p className="mt-2 text-base font-medium leading-snug text-slate-600 sm:text-lg">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}

const EQ_FACE_CLASS =
  "text-3xl font-bold tabular-nums tracking-tight sm:text-4xl md:text-5xl";
const EQ_OP_CLASS =
  "text-2xl font-bold leading-none text-slate-700 sm:text-3xl";
const EQ_CAPTION_CLASS = "mt-1 text-base font-semibold leading-snug sm:text-lg";

function EquationCard({
  ariaLabel,
  title,
  leftFace,
  leftCaption,
  midFace,
  midCaption,
  rightFace,
  accent,
  operator = "×",
}: {
  ariaLabel: string;
  title: ReactNode;
  leftFace: string;
  leftCaption: string;
  midFace: string;
  midCaption: ReactNode;
  rightFace: string;
  accent: string;
  operator?: "×" | "−";
}) {
  const titleId = useId();
  const summaryId = useId();
  return (
    <div
      className="rounded-2xl px-3 py-5 ring-1 ring-slate-200/90 sm:px-5 sm:py-6"
      style={{ backgroundColor: `${accent}12` }}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={summaryId}
    >
      <h5
        id={titleId}
        className="text-center text-xl font-bold leading-snug sm:text-2xl"
        style={{ color: accent }}
      >
        {title}
      </h5>
      <p id={summaryId} className="sr-only">
        {ariaLabel}
      </p>
      <div
        className="mt-4 flex flex-col items-center gap-2 text-center sm:gap-3"
        aria-hidden="true"
      >
        <div>
          <p className={`${EQ_FACE_CLASS} text-slate-900`}>{leftFace}</p>
          <p className={`${EQ_CAPTION_CLASS} text-slate-600`}>{leftCaption}</p>
        </div>
        <p className={EQ_OP_CLASS}>{operator}</p>
        <div>
          <p className={`${EQ_FACE_CLASS} text-slate-900`}>{midFace}</p>
          <p className={`${EQ_CAPTION_CLASS} text-slate-600`}>{midCaption}</p>
        </div>
        <p className={EQ_OP_CLASS}>=</p>
        <p className={EQ_FACE_CLASS} style={{ color: accent }}>
          {rightFace}
        </p>
      </div>
    </div>
  );
}

/**
 * Sample mill levy as a bill-style list of tax entities (mills only; no
 * assessed × tax dollars yet). Matches how residents read a tax statement.
 */
function SampleMillLevyPreview({
  lines,
  totalMills,
  lead,
}: {
  lines: readonly PropertyTaxMathStackLineComputed[];
  totalMills: number;
  lead: string;
}) {
  const leadId = useId();
  return (
    <div className="mt-4">
      <p
        id={leadId}
        className="text-base font-bold text-slate-800 sm:text-lg"
      >
        {lead}
      </p>
      <div className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/90">
        <ul aria-labelledby={leadId}>
          {lines.map((line) => {
            const Icon = STACK_ICONS[line.key] ?? Square3Stack3DIcon;
            const millsFace = formatTeachingMills(line.mills);
            return (
              <li
                key={line.key}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 last:border-b-0 sm:px-4"
              >
                <span className="inline-flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: line.chartColor }}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-base font-bold text-slate-900 sm:text-lg">
                    {line.label}
                  </span>
                </span>
                <span className="shrink-0 text-base font-bold tabular-nums text-slate-900 sm:text-lg">
                  {millsFace}{" "}
                  <span className="font-semibold text-slate-600">mills</span>
                </span>
              </li>
            );
          })}
          <li className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
            <span className="text-base font-bold text-slate-800 sm:text-lg">
              Mill levy total
            </span>
            <span className="text-base font-bold tabular-nums text-slate-900 sm:text-lg">
              {formatTeachingMills(totalMills)}{" "}
              <span className="font-semibold text-slate-600">mills</span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StoryNumber({
  children,
  color,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex min-w-[3.5rem] items-center justify-center rounded-xl bg-white px-2.5 py-1.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900 ring-1 ring-slate-200/90 sm:min-w-[4rem] sm:text-3xl"
      style={color ? { color, borderColor: `${color}55` } : undefined}
    >
      {children}
    </span>
  );
}

/**
 * Steps 5–6: dollars-per-$1,000 story first; assessed ÷ 1,000 × mills at the
 * bottom.
 */
function MillLineCard({
  line,
  baseColor,
  assessedLabel,
}: {
  line: PropertyTaxMathStackLineComputed;
  baseColor: string;
  /** e.g. "school assessed value" / "local assessed value" */
  assessedLabel: string;
}) {
  const titleId = useId();
  const summaryId = useId();
  const Icon = STACK_ICONS[line.key] ?? Square3Stack3DIcon;
  const assessedFace = formatUsdWhole(line.assessedDollars);
  const taxFace = formatUsdWhole(line.taxDollars);
  const millsFace = formatTeachingMills(line.mills);
  // Integer mills keep "$40" (home sample); fractional use cents ("$25.38").
  const dollarsPerThousandFace =
    Math.abs(line.mills - Math.round(line.mills)) < 1e-9
      ? formatUsdWhole(line.mills)
      : formatUsdCents(line.mills);
  const srSummary =
    `${dollarsPerThousandFace} for every $1,000. ` +
    `Apply that rate to ${assessedLabel} ${assessedFace}: ${taxFace}. ` +
    `See the math: ${assessedFace} / 1,000 × ${millsFace} mills = ${taxFace}.`;

  return (
    <div
      className="rounded-2xl px-3 py-4 ring-1 ring-slate-200/90 sm:px-4 sm:py-5"
      style={{ backgroundColor: `${baseColor}0f` }}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={summaryId}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          aria-hidden="true"
          style={{ backgroundColor: line.chartColor }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h5
          id={titleId}
          className="min-w-0 text-lg font-bold text-slate-900 sm:text-xl"
        >
          {line.label}
          {" "}
          <span className="font-semibold text-slate-600">
            - {millsFace} mills
          </span>
        </h5>
      </div>

      <p id={summaryId} className="sr-only">
        {srSummary}
      </p>

      <div aria-hidden="true">
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <StoryNumber color={line.chartColor}>
            {dollarsPerThousandFace}
          </StoryNumber>
          <span className="text-xl font-bold text-slate-600 sm:text-2xl">
            for every
          </span>
          <StoryNumber>$1,000</StoryNumber>
        </div>

        <p className="mt-5 text-center text-lg font-bold leading-snug text-slate-800 sm:text-xl">
          Apply that rate to {assessedLabel}{" "}
          <span className="tabular-nums" style={{ color: baseColor }}>
            {assessedFace}
          </span>:
        </p>

        <p className="mt-3 text-center text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl">
          {taxFace}
        </p>

        <p className="mt-5 border-t border-slate-200/90 pt-3 text-center text-base font-bold leading-snug text-slate-800 sm:text-lg">
          See the math:{" "}
          <span className="tabular-nums" style={{ color: baseColor }}>
            {assessedFace}
          </span>
          {" / 1,000 × "}
          <span className="tabular-nums text-slate-900">
            {millsFace} mills
          </span>
          {" = "}
          <span className="tabular-nums text-slate-900">{taxFace}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Stacked sample bill: every segment shows icon + short label + dollars (no
 * legend). Phone: min-width floor so narrow shares stay readable (not strict
 * scale). `sm+`: true share widths. Horizontal scroll only if mins overflow.
 */
function ShareCapsule({
  lines,
}: {
  lines: readonly PropertyTaxMathStackLineComputed[];
}) {
  return (
    <div
      className="flex h-24 w-full overflow-x-auto overflow-y-hidden rounded-2xl shadow-inner ring-1 ring-slate-200/80 sm:h-28 sm:overflow-hidden"
      role="img"
      aria-label={lines
        .map((l) => `${l.label} ${formatUsdWhole(l.taxDollars)}`)
        .join(". ")}
    >
      <div className="flex h-full w-full min-w-full" aria-hidden="true">
        {lines.map((line) => {
          const Icon = STACK_ICONS[line.key] ?? Square3Stack3DIcon;
          return (
            <div
              key={line.key}
              className="flex min-w-[4.75rem] flex-col items-center justify-center gap-0.5 px-0.5 text-center text-white sm:min-w-0 sm:gap-1 sm:px-1"
              style={{
                flex: `${line.taxDollars} 1 0%`,
                backgroundColor: line.chartColor,
              }}
            >
              <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
              <span className="max-w-full truncate text-xs font-bold leading-tight sm:text-sm">
                {line.shortLabel}
              </span>
              <span className="max-w-full truncate text-sm font-bold tabular-nums leading-tight sm:text-base">
                {formatUsdWhole(line.taxDollars)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeachingStepsBody({
  values,
  idPrefix,
  context,
  onJumpToLevyStack,
}: {
  values: PropertyTaxMathTeachingValues;
  idPrefix: string;
  context: "sample" | "property";
  onJumpToLevyStack?: () => void;
}) {
  const billId = `${idPrefix}-bill-shares`;
  const lines = computePropertyTaxMathStack(values);
  const schoolLines = schoolStackLines(values);
  const localLines = localStackLines(values);
  const totalMills = totalMillsFromMathValues(values);
  const totalTax = totalTaxDollarsFromMathValues(values);
  const appraisedFace = formatUsdWhole(values.appraisedDollars);
  const localAssessedFace = formatUsdWhole(values.localAssessedDollars);
  const schoolAssessedFace = formatUsdWhole(values.schoolAssessedDollars);
  const totalTaxFace = formatUsdWhole(totalTax);
  const path = assessmentPathFromValues(values);
  const haircut = values.residentialLocalHaircut ?? null;
  const isSample = context === "sample";
  const ratesCite = dptRatesCite(values);
  const appraisedCaption = isSample
    ? "Sample appraised value"
    : "Your appraised value";
  const appraisedAriaLabel = isSample
    ? `Sample appraised value ${appraisedFace}`
    : `Appraised value ${appraisedFace}`;

  const millsLead = isSample
    ? PROPERTY_TAX_MATH_MILLS_SAMPLE_LEAD
    : path === "single_rate" || lines.length === 1
      ? PROPERTY_TAX_MATH_MILLS_PROPERTY_SINGLE_LEAD
      : PROPERTY_TAX_MATH_MILLS_PROPERTY_LEAD;

  const showDualRates = path === "residential_dual";
  const showSeparateSchoolLocalMath =
    showDualRates && schoolLines.length > 0 && localLines.length > 0;
  const showHaircut = haircut != null;
  /** Share bar + sum equation only when there are pieces to add. */
  const showBillPieces = lines.length > 1;

  const ratesStep = 1;
  const appraisedStep = 2;
  const haircutStep = showHaircut ? 3 : null;
  const assessedStep = showHaircut ? 4 : 3;
  const millsStep = showHaircut ? 5 : 4;
  const schoolMathStep = showSeparateSchoolLocalMath
    ? showHaircut
      ? 6
      : 5
    : null;
  const localOrSingleMathStep = showSeparateSchoolLocalMath
    ? showHaircut
      ? 7
      : 6
    : showHaircut
      ? 6
      : 5;
  const totalStep = showSeparateSchoolLocalMath
    ? showHaircut
      ? 8
      : 7
    : showHaircut
      ? 7
      : 6;

  return (
    <div className="mx-auto mt-0 w-full max-w-xl text-left">
      {showDualRates ? (
        <TeachingStep step={ratesStep} title={PROPERTY_TAX_MATH_RATES_STEP_TITLE}>
          <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
            {PROPERTY_TAX_MATH_RATES_STEP_PLAIN}
          </p>
          <div className="mt-4 space-y-3">
            <RateCard
              color={LOCAL}
              title="Local-government assessment rate"
              rateLabel={values.localAssessmentRateLabel}
              plain="Used for county, city, fire, metro, and other non-school bill entries."
            />
            <RateCard
              color={SCHOOL}
              title="School assessment rate"
              rateLabel={values.schoolAssessmentRateLabel}
              plain="Used only for school tax on the bill."
              footnote={PROPERTY_TAX_MATH_SCHOOL_RESIDENTIAL_NOTE}
            />
          </div>
          <p className="mt-4 text-base font-medium leading-snug text-slate-600 sm:text-lg">
            <a
              href={ratesCite.href}
              className={COUNTY_EXTERNAL_LINK_CLASS}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ratesCite.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </TeachingStep>
      ) : (
        <TeachingStep
          step={ratesStep}
          title={PROPERTY_TAX_MATH_RATES_SINGLE_STEP_TITLE}
        >
          <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
            {PROPERTY_TAX_MATH_RATES_SINGLE_STEP_PLAIN}
          </p>
          <div className="mt-4">
            <RateCard
              color={LOCAL}
              title="Assessment rate"
              rateLabel={values.localAssessmentRateLabel}
              plain="Used for the districts on your bill."
            />
          </div>
          <p className="mt-4 text-base font-medium leading-snug text-slate-600 sm:text-lg">
            <a
              href={ratesCite.href}
              className={COUNTY_EXTERNAL_LINK_CLASS}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ratesCite.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </TeachingStep>
      )}

      <TeachingStep step={appraisedStep} title={PROPERTY_TAX_MATH_APPRAISED_STEP_TITLE}>
        <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
          {PROPERTY_TAX_MATH_APPRAISED_PLAIN} It is the starting number.
        </p>
        <div
          className="mt-4 flex flex-col items-center rounded-2xl bg-indigo-800 px-4 py-6 text-white sm:py-7"
          role="group"
          aria-label={appraisedAriaLabel}
        >
          <HomeModernIcon
            className="h-10 w-10 text-white/85"
            aria-hidden="true"
          />
          <p
            className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white/75"
            aria-hidden="true"
          >
            {appraisedCaption}
          </p>
          <p
            className="mt-1 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl"
            aria-hidden="true"
          >
            {appraisedFace}
          </p>
        </div>
      </TeachingStep>

      {showHaircut && haircut != null && haircutStep != null ? (
        <TeachingStep
          step={haircutStep}
          title={PROPERTY_TAX_MATH_HAIRCUT_STEP_TITLE}
        >
          <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
            {PROPERTY_TAX_MATH_HAIRCUT_STEP_PLAIN}
          </p>
          <div className="mt-4">
            <EquationCard
              ariaLabel={`${appraisedFace} minus ${formatUsdWhole(haircut.reductionDollars)} equals adjusted appraised ${formatUsdWhole(haircut.adjustedActualDollars)}`}
              accent={LOCAL}
              title="Find adjusted appraised value for local taxes"
              leftFace={appraisedFace}
              leftCaption={appraisedCaption}
              midFace={formatUsdWhole(haircut.reductionDollars)}
              midCaption="10% of the first $700,000"
              rightFace={formatUsdWhole(haircut.adjustedActualDollars)}
              operator="−"
            />
          </div>
          <p className="mt-4 text-base font-medium leading-snug text-slate-600 sm:text-lg">
            <a
              href={COLORADO_DPT_RESIDENTIAL_LOCAL_ASSESSMENT_RATE_URL}
              className={COUNTY_EXTERNAL_LINK_CLASS}
              target="_blank"
              rel="noopener noreferrer"
            >
              {PROPERTY_TAX_MATH_DPT_HAIRCUT_LINK_LABEL}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </TeachingStep>
      ) : null}

      {showDualRates ? (
        <TeachingStep
          step={assessedStep}
          title={PROPERTY_TAX_MATH_ASSESSED_STEP_TITLE}
        >
          <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
            {haircut != null
              ? PROPERTY_TAX_MATH_ASSESSED_AFTER_HAIRCUT_PLAIN
              : PROPERTY_TAX_MATH_ASSESSED_STEP_PLAIN}
          </p>
          <div className="mt-4 space-y-3">
            <EquationCard
              ariaLabel={`${haircut != null ? formatUsdWhole(haircut.adjustedActualDollars) : appraisedFace} times ${values.localAssessmentRateLabel} equals local assessed ${localAssessedFace}`}
              accent={LOCAL}
              title="Find local assessed value"
              leftFace={
                haircut != null
                  ? formatUsdWhole(haircut.adjustedActualDollars)
                  : appraisedFace
              }
              leftCaption={
                haircut != null
                  ? "Adjusted appraised value"
                  : appraisedCaption
              }
              midFace={values.localAssessmentRateLabel}
              midCaption="local assessment rate"
              rightFace={localAssessedFace}
            />
            <EquationCard
              ariaLabel={`${appraisedFace} times ${values.schoolAssessmentRateLabel} equals school assessed ${schoolAssessedFace}`}
              accent={SCHOOL}
              title="Find school assessed value"
              leftFace={appraisedFace}
              leftCaption={appraisedCaption}
              midFace={values.schoolAssessmentRateLabel}
              midCaption="school assessment rate"
              rightFace={schoolAssessedFace}
            />
          </div>
        </TeachingStep>
      ) : (
        <TeachingStep
          step={assessedStep}
          title={PROPERTY_TAX_MATH_ASSESSED_SINGLE_STEP_TITLE}
        >
          <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
            {PROPERTY_TAX_MATH_ASSESSED_SINGLE_STEP_PLAIN}
          </p>
          <div className="mt-4">
            <EquationCard
              ariaLabel={`${appraisedFace} times ${values.localAssessmentRateLabel} equals assessed ${localAssessedFace}`}
              accent={LOCAL}
              title="Find assessed value"
              leftFace={appraisedFace}
              leftCaption={appraisedCaption}
              midFace={values.localAssessmentRateLabel}
              midCaption="assessment rate"
              rightFace={localAssessedFace}
            />
          </div>
        </TeachingStep>
      )}

      <TeachingStep step={millsStep} title={PROPERTY_TAX_MATH_MILLS_STEP_TITLE}>
        <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200/90 sm:px-5">
          <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
            A mill is $1 of tax for every $1,000 of assessed value. Each
            district sets its own mills. Add every district together and you
            get the mill levy: the combined rate on your bill.
          </p>
          <SampleMillLevyPreview
            lines={lines}
            totalMills={totalMills}
            lead={millsLead}
          />
          {!isSample && onJumpToLevyStack != null ? (
            <p className="mt-4 text-base font-medium leading-snug text-slate-600 sm:text-lg">
              {PROPERTY_TAX_MATH_LEVY_STACK_POINTER}{" "}
              <button
                type="button"
                className={TERM_LINK_CLASS}
                onClick={onJumpToLevyStack}
              >
                Where is your money going?
              </button>
            </p>
          ) : !isSample ? (
            <p className="mt-4 text-base font-medium leading-snug text-slate-600 sm:text-lg">
              {PROPERTY_TAX_MATH_LEVY_STACK_POINTER}
            </p>
          ) : null}
        </div>
      </TeachingStep>

      {showSeparateSchoolLocalMath && schoolMathStep != null ? (
        <>
          <TeachingStep
            step={schoolMathStep}
            title={PROPERTY_TAX_MATH_SCHOOL_MATH_STEP_TITLE}
          >
            <div className="space-y-3">
              {schoolLines.map((line) => (
                <MillLineCard
                  key={line.key}
                  line={line}
                  baseColor={SCHOOL}
                  assessedLabel="school assessed value"
                />
              ))}
            </div>
          </TeachingStep>

          <TeachingStep
            step={localOrSingleMathStep}
            title={PROPERTY_TAX_MATH_LOCAL_MATH_STEP_TITLE}
          >
            <div className="space-y-3">
              {localLines.map((line) => (
                <MillLineCard
                  key={line.key}
                  line={line}
                  baseColor={LOCAL}
                  assessedLabel="local assessed value"
                />
              ))}
            </div>
          </TeachingStep>
        </>
      ) : (
        <TeachingStep
          step={localOrSingleMathStep}
          title={PROPERTY_TAX_MATH_SINGLE_MATH_STEP_TITLE}
        >
          <div className="space-y-3">
            {lines.map((line) => (
              <MillLineCard
                key={line.key}
                line={line}
                baseColor={LOCAL}
                assessedLabel="assessed value"
              />
            ))}
          </div>
        </TeachingStep>
      )}

      <TeachingStep
        step={totalStep}
        title={
          showBillPieces
            ? PROPERTY_TAX_MATH_TOTAL_STEP_TITLE
            : PROPERTY_TAX_MATH_TOTAL_STEP_TITLE_SINGLE
        }
      >
        <div id={billId}>
          <p
            className="text-center text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl"
            aria-label={`${totalTaxFace} estimated total`}
          >
            <span aria-hidden="true">
              {totalTaxFace}
              <span className="ml-2 text-base font-semibold text-slate-700 sm:text-lg">
                est. total
              </span>
            </span>
          </p>
          {showBillPieces ? (
            <>
              <div className="mt-3">
                <ShareCapsule lines={lines} />
              </div>
              <p className="mt-4 text-center text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
                {lines.map((l) => formatUsdWhole(l.taxDollars)).join(" + ")}
                {" = "}
                {totalTaxFace}
              </p>
            </>
          ) : null}
        </div>
      </TeachingStep>
    </div>
  );
}

export function PropertyTaxMathTeaching({
  idPrefix,
  values,
  className = "mt-8",
  showSampleNote = true,
  /**
   * `sample` = unlocked home (always open, sample captions + optional sample note).
   * `property` = locked report (optional collapse; no sample note).
   */
  context = "sample",
  /** When true (locked), wrap steps in a collapsed `<details>` disclosure. */
  collapsedByDefault = false,
  /**
   * Flush under the Two numbers bar (no top radius / separate ring). Parent
   * should clip with shared `rounded-lg overflow-hidden`.
   */
  attachBelowBar = false,
  onJumpToLevyStack,
}: {
  idPrefix: string;
  values: PropertyTaxMathTeachingValues;
  className?: string;
  showSampleNote?: boolean;
  context?: "sample" | "property";
  collapsedByDefault?: boolean;
  attachBelowBar?: boolean;
  onJumpToLevyStack?: () => void;
}) {
  const headingId = `${idPrefix}-heading`;
  const showNote = context === "sample" && showSampleNote;

  const steps = (
    <TeachingStepsBody
      values={values}
      idPrefix={idPrefix}
      context={context}
      onJumpToLevyStack={onJumpToLevyStack}
    />
  );

  if (!collapsedByDefault) {
    return (
      <div className={className}>
        <h3
          id={headingId}
          className="text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
        >
          {PROPERTY_TAX_MATH_TEACHING_HEADING}
        </h3>
        {showNote ? (
          <p className="mt-1.5 text-center text-base font-medium text-slate-600 sm:text-lg">
            {PROPERTY_TAX_MATH_TEACHING_SAMPLE_NOTE}
          </p>
        ) : null}
        {steps}
      </div>
    );
  }

  const detailsClass = attachBelowBar
    ? `group ${className} overflow-hidden rounded-none border-0 bg-white ring-0 open:bg-slate-50`
    : `group ${className} overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/90 open:ring-indigo-300/80`;

  return (
    <details className={detailsClass}>
      <summary
        className="cursor-pointer list-none px-4 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/40 focus-visible:ring-offset-2 sm:px-5 sm:py-5 [&::-webkit-details-marker]:hidden"
        aria-labelledby={headingId}
      >
        <span className="flex items-start gap-3 sm:gap-4">
          <span className="min-w-0 flex-1 text-left">
            <h3
              id={headingId}
              className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
            >
              {PROPERTY_TAX_MATH_TEACHING_HEADING}
            </h3>
            <span className="mt-1 block text-base font-medium text-slate-600 sm:text-lg">
              {PROPERTY_TAX_MATH_TEACHING_DISCLOSURE_TEASER}
            </span>
          </span>
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-white shadow-sm transition-colors group-open:bg-indigo-800"
            aria-hidden="true"
          >
            <DisclosureChevron className="h-6 w-6 text-white transition-transform duration-150 group-open:rotate-180" />
          </span>
        </span>
      </summary>
      <div className="border-t border-slate-200/90 px-4 pb-6 pt-2 sm:px-5 sm:pb-8 sm:pt-3">
        {steps}
      </div>
    </details>
  );
}
