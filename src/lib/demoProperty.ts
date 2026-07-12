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

/**
 * Fictional Book+Page tokens in county shape (letter+digits, space, 4-digit page).
 * Stable per sale-row index so the demo does not expose real clerk document ids.
 */
export function demoBookPageForTransferIndex(index: number): string {
  const page = String(9001 + index).padStart(4, "0");
  return `D000 ${page}`;
}

/**
 * Fictional permit numbers in county shape (PREFIX-YEAR-#####).
 * Keeps the original letter prefix when present so type cues stay realistic.
 */
export function demoPermitNumForIndex(
  original: string | null | undefined,
  index: number,
): string {
  const match = /^([A-Za-z]{2,4})-/.exec((original ?? "").trim());
  const prefix = (match?.[1] ?? "BLD").toUpperCase();
  const seq = String(90001 + index).padStart(5, "0");
  return `${prefix}-0000-${seq}`;
}

/**
 * Replace resident-identifying parcel-record fields for Try demo property.
 * Dollar amounts, classification, ownership type, sale/permit dates and amounts,
 * and other non-PII county fields pass through from the hidden source PIN so
 * the demo stays realistic. Sale Book Page and permit numbers are replaced with
 * fictional tokens (same format as county rows). Clerk links are also disabled
 * in the UI for demo mode so recorded-document searches cannot unmask that
 * source PIN.
 */
export function obfuscateParcelRecordRow(
  record: ArapahoeParcelRecordRow,
): ArapahoeParcelRecordRow {
  const transfers = record.transfers?.map((sale, index) => ({
    ...sale,
    bookPage: demoBookPageForTransferIndex(index),
  }));
  const permits = record.permits?.map((permit, index) => ({
    ...permit,
    permitNum: demoPermitNumForIndex(permit.permitNum, index),
  }));

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
    ...(transfers ? { transfers } : {}),
    ...(permits ? { permits } : {}),
  };
}
