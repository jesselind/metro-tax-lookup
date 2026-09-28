// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Node-only filesystem checks for sourced-records cites.
 * Do not import from client components (pulls `node:fs` into the browser bundle
 * and panics Turbopack). Client URL helpers live in `sourcedRecords.ts`.
 */

import { existsSync } from "node:fs";
import path from "node:path";

import { sourcedRecordsPublicRelativePath } from "@/lib/sourcedRecords";

/**
 * Absolute filesystem path under the repo `public/` directory, or null.
 */
export function sourcedRecordsFilesystemPath(
  url: string,
  repoRoot: string = process.cwd(),
): string | null {
  const relative = sourcedRecordsPublicRelativePath(url);
  if (!relative) return null;
  const full = path.resolve(repoRoot, "public", relative);
  const publicRoot = path.resolve(repoRoot, "public");
  if (!full.startsWith(publicRoot + path.sep) && full !== publicRoot) {
    return null;
  }
  return full;
}

/** True when the cite maps to an existing file under `public/sourced-records/`. */
export function sourcedRecordsFileExists(
  url: string,
  repoRoot: string = process.cwd(),
): boolean {
  const full = sourcedRecordsFilesystemPath(url, repoRoot);
  return full != null && existsSync(full);
}
