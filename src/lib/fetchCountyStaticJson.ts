// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Fetch static `/data/*.json` with one retry. Used by county index loaders so a
 * transient miss (dev reload, brief 5xx) does not stick as a permanent failure.
 */

const RETRY_DELAY_MS = 400;

export type CountyStaticJsonFetchResult =
  | { ok: true; json: unknown }
  | { ok: false; detail: string };

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * GET JSON from a same-origin URL. Retries once after a short delay on network
 * failure, non-OK status, or invalid JSON.
 */
export async function fetchCountyStaticJson(
  url: string,
  init?: RequestInit,
): Promise<CountyStaticJsonFetchResult> {
  let lastDetail = `${url}: unknown failure`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        lastDetail = `${url}: HTTP ${res.status}`;
        if (attempt === 0) {
          await wait(RETRY_DELAY_MS);
          continue;
        }
        return { ok: false, detail: lastDetail };
      }
      try {
        const json: unknown = await res.json();
        return { ok: true, json };
      } catch {
        lastDetail = `${url}: response was not valid JSON`;
        if (attempt === 0) {
          await wait(RETRY_DELAY_MS);
          continue;
        }
        return { ok: false, detail: lastDetail };
      }
    } catch (err) {
      const reason =
        err instanceof Error && err.message.trim()
          ? err.message.trim()
          : "network error";
      lastDetail = `${url}: ${reason}`;
      if (attempt === 0) {
        await wait(RETRY_DELAY_MS);
        continue;
      }
      return { ok: false, detail: lastDetail };
    }
  }

  return { ok: false, detail: lastDetail };
}
