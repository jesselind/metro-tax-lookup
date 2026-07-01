// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { ArapahoeParcelRecordRow } from "@/lib/arapahoeParcelLevyData";

/** Real PIN loaded for levy stack data; never shown in demo UI. */
export const DEMO_SOURCE_PIN = "035457397";

export const DEMO_DISPLAY_PIN = "000000000";

export const DEMO_ADDRESS_LABEL = "1234 Example Lane, Watkins";

export const DEMO_SITUS_ADDRESS = "1234 EXAMPLE LANE";

export const DEMO_SITUS_CITY = "WATKINS";

export const DEMO_OWNER_LIST = "John Doe, Jane Doe";

export const DEMO_MAILING_LINE1 = "1234 Example Lane";

export const DEMO_MAILING_LINE2 = "Watkins CO 80137";

export const DEMO_LEGAL = "LOT 1 EXAMPLE SUBDIVISION";

export const DEMO_PROPERTY_CLASSIFICATION = "Residential";

/** Sample AIN matching county hyphenation (####-##-#-##-###); not a real parcel. */
export const DEMO_AIN = "1000-00-0-00-001";

/** Round placeholder dollars for demo property details (not tied to any parcel). */
export const DEMO_TOTAL_ACTUAL = 450_000;

export const DEMO_IMPROVEMENT_ACTUAL = 380_000;

export const DEMO_LAND_ACTUAL = 70_000;

export const DEMO_TOTAL_ASSESSED = 31_500;

/** Assessment year on summary tile and property details labels in demo mode. */
export function demoAssessmentYear(): string {
  return String(new Date().getFullYear());
}

export function obfuscateParcelRecordRow(
  record: ArapahoeParcelRecordRow,
): ArapahoeParcelRecordRow {
  return {
    ...record,
    ain: DEMO_AIN,
    situsAddress: DEMO_SITUS_ADDRESS,
    situsCity: DEMO_SITUS_CITY,
    ownerList: DEMO_OWNER_LIST,
    ownerDeliveryAddress: DEMO_MAILING_LINE1,
    ownerCityStateZip: DEMO_MAILING_LINE2,
    legalDescrDisplay: DEMO_LEGAL,
    legalDescrFull: DEMO_LEGAL,
    assessmentYear: demoAssessmentYear(),
    totalActual: DEMO_TOTAL_ACTUAL,
    improvementActual: DEMO_IMPROVEMENT_ACTUAL,
    landActual: DEMO_LAND_ACTUAL,
    totalAssessed: DEMO_TOTAL_ASSESSED,
  };
}
