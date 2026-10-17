// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

/**
 * Home teaching walkthrough (vertical): assessment rates → appraised → two
 * assessed values → mills → school mill math → local mill math → bill total.
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
import { COLORADO_DPT_ASSESSED_VALUE_SECTION_URL } from "@/lib/arapahoeCountyUrls";
import { formatUsdWhole } from "@/lib/formatUsd";
import {
  computePropertyTaxMathStack,
  localStackLines,
  PROPERTY_TAX_MATH_APPRAISED_PLAIN,
  PROPERTY_TAX_MATH_APPRAISED_STEP_TITLE,
  PROPERTY_TAX_MATH_ASSESSED_STEP_PLAIN,
  PROPERTY_TAX_MATH_ASSESSED_STEP_TITLE,
  PROPERTY_TAX_MATH_DPT_LINK_LABEL,
  PROPERTY_TAX_MATH_LOCAL_MATH_STEP_TITLE,
  PROPERTY_TAX_MATH_MILLS_SAMPLE_LEAD,
  PROPERTY_TAX_MATH_MILLS_STEP_TITLE,
  PROPERTY_TAX_MATH_RATES_STEP_PLAIN,
  PROPERTY_TAX_MATH_RATES_STEP_TITLE,
  PROPERTY_TAX_MATH_SCHOOL_MATH_STEP_TITLE,
  PROPERTY_TAX_MATH_SCHOOL_RESIDENTIAL_NOTE,
  PROPERTY_TAX_MATH_TEACHING_HEADING,
  PROPERTY_TAX_MATH_TEACHING_SAMPLE_NOTE,
  PROPERTY_TAX_MATH_TOTAL_STEP_TITLE,
  schoolStackLines,
  totalMillsFromMathValues,
  totalTaxDollarsFromMathValues,
  type PropertyTaxMathStackLineComputed,
  type PropertyTaxMathTeachingValues,
} from "@/lib/propertyTaxMathTeaching";
import { COUNTY_EXTERNAL_LINK_CLASS } from "@/lib/toolFlowStyles";

type StackIcon = ComponentType<SVGProps<SVGSVGElement>>;

const STACK_ICONS: Record<string, StackIcon> = {
  school: AcademicCapIcon,
  county: BuildingOffice2Icon,
  fire: FireIcon,
  metro: Square3Stack3DIcon,
};

const LOCAL = "#0f766e"; // teal-700
const SCHOOL = "#0369a1"; // sky-700 — school; not indigo badges or fire red

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
    <div className="pt-8 first:pt-6 sm:pt-10 sm:first:pt-7">
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
}: {
  ariaLabel: string;
  title: ReactNode;
  leftFace: string;
  leftCaption: string;
  midFace: string;
  midCaption: ReactNode;
  rightFace: string;
  accent: string;
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
        <p className={EQ_OP_CLASS}>×</p>
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
}: {
  lines: readonly PropertyTaxMathStackLineComputed[];
  totalMills: number;
}) {
  const leadId = useId();
  return (
    <div className="mt-4">
      <p
        id={leadId}
        className="text-base font-bold text-slate-800 sm:text-lg"
      >
        {PROPERTY_TAX_MATH_MILLS_SAMPLE_LEAD}
      </p>
      <div className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/90">
        <ul aria-labelledby={leadId}>
          {lines.map((line) => {
            const Icon = STACK_ICONS[line.key] ?? Square3Stack3DIcon;
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
                  {line.mills}{" "}
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
              {totalMills}{" "}
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
  const dollarsPerThousandFace = formatUsdWhole(line.mills);
  const srSummary =
    `${dollarsPerThousandFace} for every $1,000. ` +
    `Apply that rate to ${assessedLabel} ${assessedFace}: ${taxFace}. ` +
    `See the math: ${assessedFace} / 1,000 × ${line.mills} mills = ${taxFace}.`;

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
            - {line.mills} mills
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
            {line.mills} mills
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
 * legend). Taller capsule so narrow shares still fit on phone width.
 */
function ShareCapsule({
  lines,
}: {
  lines: readonly PropertyTaxMathStackLineComputed[];
}) {
  return (
    <div
      className="flex h-24 w-full overflow-hidden rounded-2xl shadow-inner ring-1 ring-slate-200/80 sm:h-28"
      role="img"
      aria-label={lines
        .map((l) => `${l.label} ${formatUsdWhole(l.taxDollars)}`)
        .join(". ")}
    >
      <div className="flex h-full w-full" aria-hidden="true">
        {lines.map((line) => {
          const Icon = STACK_ICONS[line.key] ?? Square3Stack3DIcon;
          return (
            <div
              key={line.key}
              className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-white sm:gap-1 sm:px-1"
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

export function PropertyTaxMathTeaching({
  idPrefix,
  values,
  className = "mt-8",
  showSampleNote = true,
}: {
  idPrefix: string;
  values: PropertyTaxMathTeachingValues;
  className?: string;
  showSampleNote?: boolean;
}) {
  const headingId = `${idPrefix}-heading`;
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

  return (
    <div className={className}>
      <h3
        id={headingId}
        className="text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
      >
        {PROPERTY_TAX_MATH_TEACHING_HEADING}
      </h3>
      {showSampleNote ? (
        <p className="mt-1.5 text-center text-base font-medium text-slate-600 sm:text-lg">
          {PROPERTY_TAX_MATH_TEACHING_SAMPLE_NOTE}
        </p>
      ) : null}

      <div className="mx-auto mt-2 w-full max-w-xl text-left">
        <TeachingStep
          step={1}
          title={PROPERTY_TAX_MATH_RATES_STEP_TITLE}
        >
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
              href={COLORADO_DPT_ASSESSED_VALUE_SECTION_URL}
              className={COUNTY_EXTERNAL_LINK_CLASS}
              target="_blank"
              rel="noopener noreferrer"
            >
              {PROPERTY_TAX_MATH_DPT_LINK_LABEL}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </TeachingStep>

        <TeachingStep step={2} title={PROPERTY_TAX_MATH_APPRAISED_STEP_TITLE}>
          <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
            {PROPERTY_TAX_MATH_APPRAISED_PLAIN} It is the starting number.
          </p>
          <div
            className="mt-4 flex flex-col items-center rounded-2xl bg-indigo-800 px-4 py-6 text-white sm:py-7"
            role="group"
            aria-label={`Sample appraised value ${appraisedFace}`}
          >
            <HomeModernIcon
              className="h-10 w-10 text-white/85"
              aria-hidden="true"
            />
            <p
              className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white/75"
              aria-hidden="true"
            >
              Sample appraised value
            </p>
            <p
              className="mt-1 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl"
              aria-hidden="true"
            >
              {appraisedFace}
            </p>
          </div>
        </TeachingStep>

        <TeachingStep step={3} title={PROPERTY_TAX_MATH_ASSESSED_STEP_TITLE}>
          <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
            {PROPERTY_TAX_MATH_ASSESSED_STEP_PLAIN}
          </p>
          <div className="mt-4 space-y-3">
            <EquationCard
              ariaLabel={`${appraisedFace} times ${values.localAssessmentRateLabel} equals local assessed ${localAssessedFace}`}
              accent={LOCAL}
              title="Find local assessed value"
              leftFace={appraisedFace}
              leftCaption="Sample appraised value"
              midFace={values.localAssessmentRateLabel}
              midCaption="local assessment rate"
              rightFace={localAssessedFace}
            />
            <EquationCard
              ariaLabel={`${appraisedFace} times ${values.schoolAssessmentRateLabel} equals school assessed ${schoolAssessedFace}`}
              accent={SCHOOL}
              title="Find school assessed value"
              leftFace={appraisedFace}
              leftCaption="Sample appraised value"
              midFace={values.schoolAssessmentRateLabel}
              midCaption="school assessment rate"
              rightFace={schoolAssessedFace}
            />
          </div>
        </TeachingStep>

        <TeachingStep step={4} title={PROPERTY_TAX_MATH_MILLS_STEP_TITLE}>
          <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200/90 sm:px-5">
            <p className="text-base font-semibold leading-snug text-slate-700 sm:text-lg">
              A mill is $1 of tax for every $1,000 of assessed value. Each
              district sets its own mills. Add every district together and you
              get the mill levy: the combined rate on your bill.
            </p>
            <SampleMillLevyPreview lines={lines} totalMills={totalMills} />
          </div>
        </TeachingStep>

        <TeachingStep step={5} title={PROPERTY_TAX_MATH_SCHOOL_MATH_STEP_TITLE}>
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

        <TeachingStep step={6} title={PROPERTY_TAX_MATH_LOCAL_MATH_STEP_TITLE}>
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

        <TeachingStep step={7} title={PROPERTY_TAX_MATH_TOTAL_STEP_TITLE}>
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
            <div className="mt-3">
              <ShareCapsule lines={lines} />
            </div>
            <p className="mt-4 text-center text-lg font-bold tabular-nums text-slate-900 sm:text-xl">
              {lines.map((l) => formatUsdWhole(l.taxDollars)).join(" + ")}
              {" = "}
              {totalTaxFace}
            </p>
          </div>
        </TeachingStep>
      </div>
    </div>
  );
}
