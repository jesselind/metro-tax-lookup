// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Single source for site contact email and mailto helpers. */

export const CONTACT_EMAIL = "metro.tax.lookup@pm.me";

export const CONTACT_MAILTO_HREF = `mailto:${CONTACT_EMAIL}`;

function buildMailtoHref(subject: string, body?: string): string {
  let href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  if (body != null && body.length > 0) {
    href += `&body=${encodeURIComponent(body)}`;
  }
  return href;
}

const REPORT_PROBLEM_SUBJECT = "Property tax lookup issue";

const REPORT_PROBLEM_BODY = `Hello, I found an issue with the property tax lookup tool.


1. What looks wrong (say it in your own words):


2. What I expected to see:


3. What I saw instead:


4. What I did before I noticed it (for example: the address I searched, the parcel I opened, and which part of the page):


Here is a screenshot of the issue (optional):


Thanks!`;

/** mailto: link with subject and body prefilled for incorrect or confusing information. */
export const REPORT_PROBLEM_MAILTO_HREF = buildMailtoHref(
  REPORT_PROBLEM_SUBJECT,
  REPORT_PROBLEM_BODY,
);

const SOURCES_BROKEN_GITHUB_SUBJECT =
  "Broken GitHub source link on Sources page";

/** mailto: for the Sources page fallback when the repo URL is not configured. */
export const SOURCES_BROKEN_GITHUB_MAILTO_HREF = buildMailtoHref(
  SOURCES_BROKEN_GITHUB_SUBJECT,
);

const MAX_MAILTO_FIELD_LABEL_LEN = 120;
const MAX_MAILTO_PARCEL_ID_LEN = 48;

/** Keep mailto bodies free of control chars / oversized paste; allow AIN dashes. */
function sanitizeMailtoFieldLabel(raw: string): string {
  return raw
    .replace(/[\r\n\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, MAX_MAILTO_FIELD_LABEL_LEN);
}

function sanitizeMailtoParcelId(raw: string | null | undefined): string {
  const cleaned = (raw ?? "")
    .replace(/[^\dA-Za-z.\-\s/]/g, "")
    .trim()
    .slice(0, MAX_MAILTO_PARCEL_ID_LEN);
  return cleaned || "(not available)";
}

export type MissingParcelDataMailtoParams = {
  /** County UI field label (e.g. Neighborhood, Fireplaces). */
  fieldLabel: string;
  pin?: string | null;
  ain?: string | null;
};

/**
 * Prefills a report when a property-details field shows "No data found".
 * Includes field label, PIN, and AIN so maintainers can reproduce the gap.
 */
export function buildMissingParcelDataMailtoHref({
  fieldLabel,
  pin,
  ain,
}: MissingParcelDataMailtoParams): string {
  const label = sanitizeMailtoFieldLabel(fieldLabel) || "Unknown field";
  const pinLine = sanitizeMailtoParcelId(pin);
  const ainLine = sanitizeMailtoParcelId(ain);
  const subject = `Missing parcel data: ${label}`;
  const body = `Hello, a property details field shows "No data found" in the lookup tool.

Field: ${label}
PIN: ${pinLine}
AIN: ${ainLine}

Notes (optional):


Thanks!`;
  return buildMailtoHref(subject, body);
}
