// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { clientIpFromHeaders, isLoopbackIp } from "@/lib/clientIp";
import {
  douglasPropertyDocumentsApiUrl,
  isDouglasPropertyDocumentsTree,
  normalizeDouglasAccountIdForDocumentsApi,
  pickDouglasCompsGridFromDocumentsTree,
  type DouglasCompsGridLookupResponse,
} from "@/lib/douglasCompsGridLookup";
import { sharedMemoryRateLimit } from "@/lib/memoryRateLimit";

export const runtime = "nodejs";

/** Light per-IP cap so this route cannot become a free proxy for bulk scrapes. */
const LOOKUP_LIMIT = 60;
const LOOKUP_WINDOW_MS = 60_000;
const COUNTY_FETCH_TIMEOUT_MS = 12_000;

function json(
  body: DouglasCompsGridLookupResponse,
  init?: { status?: number },
): NextResponse {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

/**
 * Same-origin lookup: ask Douglas documents API whether a COMP_GRID PDF exists
 * for this account, then return the county download URL (or missing).
 */
export async function GET(request: NextRequest) {
  if (process.env.RATE_LIMIT_DISABLED !== "1") {
    const ip = clientIpFromHeaders(request.headers);
    if (!isLoopbackIp(ip)) {
      const result = sharedMemoryRateLimit.take(
        `douglas-comps-grid:${ip}`,
        LOOKUP_LIMIT,
        LOOKUP_WINDOW_MS,
      );
      if (!result.success) {
        const retryAfterSec = Math.max(
          1,
          Math.ceil((result.resetAt - Date.now()) / 1000),
        );
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex, nofollow",
          },
        });
      }
    }
  }

  const account = normalizeDouglasAccountIdForDocumentsApi(
    request.nextUrl.searchParams.get("account"),
  );
  if (!account) {
    return json(
      {
        status: "error",
        message: "Enter a valid Douglas County account number.",
      },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COUNTY_FETCH_TIMEOUT_MS);
  try {
    const countyRes = await fetch(douglasPropertyDocumentsApiUrl(account), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "CivicLookup/1.0 (douglas-comps-grid presence check)",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (countyRes.status === 404) {
      return json({ status: "missing" });
    }
    if (!countyRes.ok) {
      return json(
        {
          status: "error",
          message: "The county documents list did not respond successfully.",
        },
        { status: 502 },
      );
    }

    const body: unknown = await countyRes.json();
    if (!isDouglasPropertyDocumentsTree(body)) {
      return json(
        {
          status: "error",
          message: "The county documents list returned an unexpected response.",
        },
        { status: 502 },
      );
    }
    const match = pickDouglasCompsGridFromDocumentsTree(body);
    if (!match) {
      return json({ status: "missing" });
    }
    return json({
      status: "found",
      href: match.href,
      fileName: match.fileName,
      taxYear: match.taxYear,
    });
  } catch {
    return json(
      {
        status: "error",
        message: "We could not reach the county documents list right now.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
