// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Try demo property: loads committed `src/data/demo-property.json` (PIN-less).
 * Non-PII dollars / building / levy structure came from a public county sample;
 * identity fields are fictional. See README — "Tests, fixtures, and PII".
 */

import type {
  ArapahoeLevyStackLine,
  ArapahoeParcelRecordRow,
} from "@/lib/arapahoeParcelLevyData";
import {
  committedLevyLinesFromStackLines,
  type ParcelValuesFromExport,
} from "@/lib/committedLevyLine";
import { safeArapahoeLevyAspxUrl } from "@/lib/safeExternalHref";
import demoPropertyData from "../data/demo-property.json";

type DemoPropertyFixture = {
  snapshot: {
    bundledAsOf: string;
    source: string;
    taxYear?: string | null;
  };
  display: {
    pin: string;
    addressLabel: string;
    ain: string;
    ownerList: string;
    propertyClassification: string;
  };
  levy: {
    tagId: string;
    tagShortDescr: string;
    levyAspxUrl: string;
    lines: ArapahoeLevyStackLine[];
  };
  parcelValues: ParcelValuesFromExport;
  parcelAssessmentYear: string | null;
  parcelRecord: ArapahoeParcelRecordRow;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`demo-property.json: ${field} required`);
  }
  return value;
}

function assertDemoPropertyFixture(data: unknown): DemoPropertyFixture {
  if (!isPlainObject(data)) {
    throw new Error("demo-property.json: expected an object");
  }
  const display = data.display;
  const levy = data.levy;
  const parcelRecord = data.parcelRecord;
  const parcelValues = data.parcelValues;
  const snapshot = data.snapshot;

  if (!isPlainObject(display)) {
    throw new Error("demo-property.json: display required");
  }
  requireNonEmptyString(display.pin, "display.pin");
  requireNonEmptyString(display.addressLabel, "display.addressLabel");
  requireNonEmptyString(display.ain, "display.ain");
  requireNonEmptyString(display.ownerList, "display.ownerList");

  if (!isPlainObject(levy)) {
    throw new Error("demo-property.json: levy required");
  }
  requireNonEmptyString(levy.tagId, "levy.tagId");
  requireNonEmptyString(levy.tagShortDescr, "levy.tagShortDescr");
  if (!Array.isArray(levy.lines) || levy.lines.length === 0) {
    throw new Error("demo-property.json: non-empty levy.lines required");
  }
  if (typeof levy.levyAspxUrl !== "string" || !safeArapahoeLevyAspxUrl(levy.levyAspxUrl)) {
    throw new Error("demo-property.json: levy.levyAspxUrl must be a safe Arapahoe Levy.aspx URL");
  }
  for (let i = 0; i < levy.lines.length; i++) {
    const entry = levy.lines[i];
    if (!isPlainObject(entry)) {
      throw new Error(`demo-property.json: levy.lines[${i}] must be an object`);
    }
    requireNonEmptyString(entry.code, `levy.lines[${i}].code`);
    requireNonEmptyString(entry.authorityName, `levy.lines[${i}].authorityName`);
    if (!isPlainObject(entry.dolaMatch)) {
      throw new Error(`demo-property.json: levy.lines[${i}].dolaMatch required`);
    }
  }
  if (!isPlainObject(parcelRecord)) {
    throw new Error("demo-property.json: parcelRecord required");
  }
  if (
    !isPlainObject(parcelValues) ||
    typeof parcelValues.totalActual !== "number" ||
    typeof parcelValues.totalAssessed !== "number"
  ) {
    throw new Error("demo-property.json: parcelValues.totalActual/totalAssessed required");
  }
  if (!("parcelAssessmentYear" in data)) {
    throw new Error("demo-property.json: parcelAssessmentYear required (string or null)");
  }
  const parcelAssessmentYear = data.parcelAssessmentYear;
  if (
    parcelAssessmentYear !== null &&
    typeof parcelAssessmentYear !== "string"
  ) {
    throw new Error(
      "demo-property.json: parcelAssessmentYear must be a string or null",
    );
  }
  if (!isPlainObject(snapshot) || typeof snapshot.bundledAsOf !== "string") {
    throw new Error("demo-property.json: snapshot.bundledAsOf required");
  }

  return data as DemoPropertyFixture;
}

const fixture = assertDemoPropertyFixture(demoPropertyData);

export const DEMO_DISPLAY_PIN = fixture.display.pin;

export const DEMO_ADDRESS_LABEL = fixture.display.addressLabel;

export const DEMO_OWNER_LIST = fixture.display.ownerList;

export const DEMO_PROPERTY_CLASSIFICATION =
  fixture.display.propertyClassification;

export const DEMO_AIN = fixture.display.ain;

/** From committed fixture parcel record (single source with JSON). */
export const DEMO_SITUS_ADDRESS = String(fixture.parcelRecord.situsAddress ?? "");

export const DEMO_SITUS_CITY = String(fixture.parcelRecord.situsCity ?? "");

export const DEMO_MAILING_LINE1 = String(
  fixture.parcelRecord.ownerDeliveryAddress ?? "",
);

export const DEMO_MAILING_LINE2 = String(
  fixture.parcelRecord.ownerCityStateZip ?? "",
);

export const DEMO_LEGAL = String(fixture.parcelRecord.legalDescrDisplay ?? "");

/**
 * Fictional Book+Page tokens in county shape (letter+digits, space, 4-digit page).
 * Defense-in-depth if a raw record is ever passed through demo mode.
 */
export function demoBookPageForTransferIndex(index: number): string {
  const page = String(9001 + index).padStart(4, "0");
  return `D000 ${page}`;
}

/**
 * Fictional permit numbers in county shape (PREFIX-YEAR-#####).
 * Defense-in-depth if a raw record is ever passed through demo mode.
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
 * Committed fixture is already fictional; `useDisplayParcelRecord` still runs this
 * when demoMode is on.
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

export type DemoPropertyLoad = {
  levy: {
    lines: ReturnType<typeof committedLevyLinesFromStackLines>["lines"];
    matchedPin: string;
    tagId: string;
    tagShortDescr: string;
    levyAspxUrl: string;
    awaitingTemplateMills: boolean;
    templateMillDrafts: Record<string, string>;
    parcelValues: ParcelValuesFromExport;
    parcelAssessmentYear: string | null;
    ain: string;
  };
  parcelRecord: ArapahoeParcelRecordRow;
  parcelRecordBundledAsOf: string;
};

/** Build UI state for Try demo property from the committed PIN-less fixture. */
export function loadDemoProperty(): DemoPropertyLoad {
  const built = committedLevyLinesFromStackLines(
    fixture.levy.lines,
    fixture.levy.tagId,
  );
  return {
    levy: {
      lines: built.lines,
      matchedPin: DEMO_DISPLAY_PIN,
      tagId: fixture.levy.tagId,
      tagShortDescr: fixture.levy.tagShortDescr,
      // Validated at module load via safeArapahoeLevyAspxUrl.
      levyAspxUrl: fixture.levy.levyAspxUrl,
      awaitingTemplateMills: built.awaitingTemplateMills,
      templateMillDrafts: built.templateMillDrafts,
      parcelValues: {
        totalActual: fixture.parcelValues.totalActual,
        totalAssessed: fixture.parcelValues.totalAssessed,
        propertyClassification:
          fixture.parcelValues.propertyClassification ??
          DEMO_PROPERTY_CLASSIFICATION,
        ownerList: DEMO_OWNER_LIST,
      },
      parcelAssessmentYear: fixture.parcelAssessmentYear,
      ain: DEMO_AIN,
    },
    // Fixture is already fictional; demoMode still runs obfuscateParcelRecordRow in the hook.
    parcelRecord: fixture.parcelRecord,
    parcelRecordBundledAsOf: fixture.snapshot.bundledAsOf,
  };
}
