// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

"use client";

import type { ReactNode } from "react";
import { CountyCompsPdfUnavailablePopoverBody } from "@/components/CountyCompsPdfGuidance";
import {
  CountyCompsPdfHelpPopover,
  COMPS_PDF_ICON_CONTROL_CLASS,
} from "@/components/CountyCompsPdfHelpPopover";
import { CountyCompsPdfInProgressPopover } from "@/components/CountyCompsPdfInProgressPopover";
import { CountyServiceGapCallout } from "@/components/CountyServiceGapCallout";
import { NovCompsGridPanel } from "@/components/NovCompsGridPanel";
import { ParcelGlossaryPopoverTrigger } from "@/components/ParcelGlossaryPopoverTrigger";
import { PreserveSessionDocLink } from "@/components/PreserveSessionDocLink";
import {
  COUNTY_COMPS_PDF_TILE_UNAVAILABLE_ARIA_LABEL,
  COUNTY_COMPS_PDF_TILE_UNAVAILABLE_STATUS,
} from "@/content/countyCompsPdfGuidance";
import type { CountyConfig } from "@/lib/countyConfig";
import {
  HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS,
  HOME_NOV_COMPS_HEADING_ID,
  HOME_NOV_COMPS_SECTION_ID,
} from "@/lib/homeDashboardJumps";
import type { NovCompsGridPayload } from "@/lib/novCompsGridTypes";
import { sourcesPageHref } from "@/lib/sourcesPageHref";
import {
  COUNTY_EXTERNAL_LINK_CLASS,
  DASHBOARD_SECTION_ARRIVE_TARGET_CLASS,
  DASHBOARD_SECTION_HEADING_CLASS,
  TERM_LINK_CLASS,
} from "@/lib/toolFlowStyles";

export type ComparablePropertiesSectionProps = {
  countyConfig: CountyConfig;
  /** County comps PDF when AIN resolves; null when missing or omitted. */
  compsPdfHref: string | null;
  compsGap: boolean;
  compsPdfInProgress: boolean;
  compsPresentationOmit: boolean;
  demoMode: boolean;
  /** Demo-only in-app grid payload; omit when not in demo. */
  demoGridPayload?: NovCompsGridPayload | null;
  propertySearchHref: string;
  compsIcon: ReactNode;
};

/**
 * Own Real comparable-properties section (always mounted when the jump shows).
 * Same section chrome as Property details (plain h3 + "What is this?"). Coming
 * soon / COUNTY DATA GAP / PDF link sit under that title (no summary tile).
 * Prefer honest empty + gap UI over hiding the section.
 */
export function ComparablePropertiesSection({
  countyConfig,
  compsPdfHref,
  compsGap,
  compsPdfInProgress,
  compsPresentationOmit,
  demoMode,
  demoGridPayload = null,
  propertySearchHref,
  compsIcon,
}: ComparablePropertiesSectionProps) {
  const showPdfChrome = compsPdfInProgress || !compsPresentationOmit;

  /** Demo grid owns {@link HOME_NOV_COMPS_HEADING_ID}; omit the id when that panel mounts. */
  const sectionHeading = (headingId: string | null) => (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <h3
        id={headingId ?? undefined}
        className={DASHBOARD_SECTION_HEADING_CLASS}
      >
        Comparable properties
      </h3>
      <ParcelGlossaryPopoverTrigger
        termId="term-comps"
        textTrigger="What is this?"
        textTriggerId="comps-section-heading-help"
        variant="parcel-record"
        textTriggerClassName={`text-xs ${TERM_LINK_CLASS} sm:text-sm`}
        ariaLabel="What comparable properties means."
      />
    </div>
  );

  let pdfBody: ReactNode = null;
  if (!showPdfChrome) {
    pdfBody = (
      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
        This county does not publish a comparable properties PDF link here yet.
      </p>
    );
  } else if (compsPdfInProgress) {
    pdfBody = (
      <CountyCompsPdfInProgressPopover countyId={countyConfig.id} />
    );
  } else if (compsPdfHref && compsGap) {
    pdfBody = (
      <CountyServiceGapCallout density="compact">
        <div className="flex min-w-0 items-start gap-2.5">
          <p className="min-w-0 flex-1">
            {COUNTY_COMPS_PDF_TILE_UNAVAILABLE_STATUS}
          </p>
          <CountyCompsPdfHelpPopover
            ariaLabel={COUNTY_COMPS_PDF_TILE_UNAVAILABLE_ARIA_LABEL}
            icon={compsIcon}
          >
            <CountyCompsPdfUnavailablePopoverBody countyHref={compsPdfHref} />
          </CountyCompsPdfHelpPopover>
        </div>
      </CountyServiceGapCallout>
    );
  } else if (compsPdfHref) {
    pdfBody = (
      <a
        href={compsPdfHref}
        target="_blank"
        rel="noopener noreferrer"
        className={COMPS_PDF_ICON_CONTROL_CLASS}
        aria-label="Open county comparable properties PDF for this property (opens in a new tab)"
      >
        {compsIcon}
      </a>
    );
  } else if (demoMode) {
    pdfBody = (
      <div className="flex justify-start">
        <CountyCompsPdfHelpPopover
          ariaLabel="Comparable properties PDF is unavailable for this property"
          icon={compsIcon}
        >
          <>
            Demo mode does not include a comparable properties PDF. Select{" "}
            <strong className="font-semibold text-slate-900">Start over</strong>
            {", "}
            then enter your address to open your county comparable properties
            PDF.
          </>
        </CountyCompsPdfHelpPopover>
      </div>
    );
  } else {
    pdfBody = (
      <div className="space-y-2" role="status" aria-live="polite">
        <p className="text-sm leading-snug text-slate-600">
          No county comparable properties PDF from here: this PIN is missing an
          assessor parcel id (AIN) in the bundled parcel index.
        </p>
        <div className="flex justify-start">
          <CountyCompsPdfHelpPopover
            ariaLabel="Why there is no comparable properties PDF link for this property"
            icon={compsIcon}
          >
            <>
              <p className="text-sm leading-relaxed text-slate-800">
                We build the county link from your account&apos;s assessor parcel
                id (AIN) in the bundled parcel index. If that field is empty, we
                cannot form{" "}
                <span className="whitespace-nowrap">FileDownload.ashx?AIN=…</span>{" "}
                safely.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-800">
                Open{" "}
                <a
                  href={propertySearchHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={COUNTY_EXTERNAL_LINK_CLASS}
                >
                  {countyConfig.displayName} property search
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>{" "}
                to reach your parcel and comparable properties from the county.
                For how the bundle is built, see{" "}
                <PreserveSessionDocLink
                  href={sourcesPageHref({
                    countyId: countyConfig.id,
                  })}
                >
                  Sources
                </PreserveSessionDocLink>
                .
              </p>
            </>
          </CountyCompsPdfHelpPopover>
        </div>
      </div>
    );
  }

  /**
   * Demo grid owns {@link HOME_NOV_COMPS_SECTION_ID}; PDF chrome sits above it.
   * Without the grid, this section is the jump target.
   */
  if (demoMode && demoGridPayload != null) {
    return (
      <div className="space-y-3">
        {sectionHeading(null)}
        {pdfBody}
        <NovCompsGridPanel payload={demoGridPayload} />
      </div>
    );
  }

  return (
    <section
      id={HOME_NOV_COMPS_SECTION_ID}
      tabIndex={-1}
      className={`${HOME_DASHBOARD_JUMP_SCROLL_MT_CLASS} ${DASHBOARD_SECTION_ARRIVE_TARGET_CLASS} space-y-3 outline-none`}
      aria-labelledby={HOME_NOV_COMPS_HEADING_ID}
    >
      {sectionHeading(HOME_NOV_COMPS_HEADING_ID)}
      {pdfBody}
    </section>
  );
}
