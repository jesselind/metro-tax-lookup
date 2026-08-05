// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { safeGithubRepoUrl } from "@/lib/safeGithubRepoUrl";
import { safeSiteOrigin } from "@/lib/safeSiteOrigin";

/**
 * Deployment-specific site chrome (repo link, optional campaign disclosure,
 * canonical origin for Open Graph absolute URLs).
 * Prefer changing values here over scattering URLs through components.
 *
 * ---------------------------------------------------------------------------
 * FORK REQUIRED - campaign / candidate deployment chrome
 * ---------------------------------------------------------------------------
 * Search the repo for `FORK REQUIRED` and `campaign` under this file.
 * Before you ship a fork, you MUST review and either replace or null out every
 * `campaign*` field below. Leaving another candidate's campaign URL, disclosure
 * copy, or "Paid for by" line on a redeployed fork is incorrect and misleading.
 * Home/footer/privacy UI reads these values; do not hardcode a different
 * campaign elsewhere. Ephemeral multi-county notes can go in `docs/_working/`
 * (gitignored).
 * ---------------------------------------------------------------------------
 */
export const SITE_CONFIG = {
  githubRepoUrl:
    safeGithubRepoUrl(process.env.NEXT_PUBLIC_GITHUB_REPO_URL) ?? "",

  /**
   * Canonical site origin (no trailing slash) for `metadataBase` / Open Graph.
   * Override with `NEXT_PUBLIC_SITE_URL` when needed (preview deploys, forks).
   * Only a bare HTTPS origin is accepted; invalid values fall back to the
   * default (see {@link safeSiteOrigin}).
   *
   * **Forkers:** Set to your production HTTPS origin so share previews resolve
   * `og:image` to an absolute URL.
   */
  siteOrigin: safeSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL),

  // --- FORK REQUIRED: campaign site link (null = hide campaign link chrome) ---

  /**
   * FORK REQUIRED. Public campaign / candidate site.
   * Set to `null` to hide home/footer/privacy campaign links.
   */
  campaignSiteUrl: "https://jesselindforassessor.com/" as string | null,

  /**
   * FORK REQUIRED with {@link SITE_CONFIG.campaignSiteUrl}.
   * Default link label when callers do not pass children.
   */
  campaignSiteLabel: "Jesse Lind for Assessor",

  /**
   * FORK REQUIRED with {@link SITE_CONFIG.campaignSiteUrl}.
   * Full label for the home landing outline control (entire control is the link).
   */
  campaignHomeDisclosureLabel:
    "Built by Jesse Lind for his Arapahoe County Assessor campaign.",

  /**
   * FORK REQUIRED with {@link SITE_CONFIG.campaignSiteUrl}.
   * Footer sentence split so the linked phrase stays configurable.
   */
  campaignFooterDisclosureBeforeLink: "Built by Jesse Lind for his",
  campaignFooterDisclosureLinkText: "Arapahoe County Assessor campaign",

  /**
   * FORK REQUIRED. Colorado-style "Paid for by..." line at the very bottom of
   * the footer (below nav links). Set to `null` to hide.
   */
  campaignPaidForByDisclaimer:
    "Paid for by Jesse Lind for Assessor. Registered agent: Jesse Lind." as
      string | null,
};
