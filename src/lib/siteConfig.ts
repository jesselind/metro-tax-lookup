// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { safeGithubRepoUrl } from "@/lib/safeGithubRepoUrl";

export const SITE_CONFIG = {
  githubRepoUrl:
    safeGithubRepoUrl(process.env.NEXT_PUBLIC_GITHUB_REPO_URL) ?? "",
} as const;

