/** Single source for site contact email and mailto helpers. */

export const CONTACT_EMAIL = "metro.tax.lookup@pm.me";

export const CONTACT_MAILTO_HREF = `mailto:${CONTACT_EMAIL}`;

const REPORT_PROBLEM_SUBJECT = "Property tax lookup issue";

const REPORT_PROBLEM_BODY = `Hello, I found an issue with the property tax lookup tool.


1. What looks wrong (say it in your own words):


2. What I expected to see:


3. What I saw instead:


4. What I did before I noticed it (for example: the address I searched, the parcel I opened, and which part of the page):


Here is a screenshot of the issue (optional):


Thanks!`;

/** mailto: link with subject and body prefilled for incorrect or confusing information. */
export const REPORT_PROBLEM_MAILTO_HREF =
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(REPORT_PROBLEM_SUBJECT)}&body=${encodeURIComponent(REPORT_PROBLEM_BODY)}`;

const SOURCES_BROKEN_GITHUB_SUBJECT =
  "Broken GitHub source link on Sources page";

/** mailto: for the Sources page fallback when the repo URL is not configured. */
export const SOURCES_BROKEN_GITHUB_MAILTO_HREF =
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SOURCES_BROKEN_GITHUB_SUBJECT)}`;
