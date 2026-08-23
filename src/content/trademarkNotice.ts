// Civic Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/** Visible brand name (metadata titles omit the trademark symbol). */
export const SITE_BRAND_NAME = "Civic Lookup";

/** Tagline under the brand name in the site header (home PageHero). */
export const SITE_BRAND_TAGLINE = "FOR THE PEOPLE";

/** Brand with trademark symbol for on-page / notice copy. */
export const SITE_BRAND_MARK = `${SITE_BRAND_NAME}\u2122`;

export const TRADEMARK_OWNER = "Jesse Lind";

/**
 * Full trademark notice: code is AGPL; the brand is not licensed with it.
 * Keep in sync with the README License section.
 */
export const TRADEMARK_NOTICE = `${SITE_BRAND_MARK} is a trademark of ${TRADEMARK_OWNER}. This site and repository are licensed under the GNU Affero General Public License v3.0. The AGPL does not grant permission to use the ${SITE_BRAND_NAME} name or logo for modified versions or derivative services in a manner that suggests endorsement or affiliation.`;
