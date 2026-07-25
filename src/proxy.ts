// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { clientIpFromHeaders, isLoopbackIp } from "@/lib/clientIp";
import {
  dataRateTierForPath,
  isAllowedDataMethod,
} from "@/lib/dataRequestGuard";
import {
  sharedMemoryRateLimit,
  type RateLimitResult,
} from "@/lib/memoryRateLimit";

/**
 * Request boundary for static `/data` assets (bandwidth is the main Hobby-plan
 * risk). In-memory limits are per isolate; set RATE_LIMIT_DISABLED=1 to bypass.
 * Matcher is `/data` only so HTML and `_next` assets are untouched.
 */
export function proxy(request: NextRequest) {
  if (process.env.RATE_LIMIT_DISABLED === "1") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/data/")) {
    return NextResponse.next();
  }

  if (!isAllowedDataMethod(request.method)) {
    return withDataHeaders(
      new NextResponse("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD", "Cache-Control": "no-store" },
      }),
    );
  }

  const ip = clientIpFromHeaders(request.headers);
  if (isLoopbackIp(ip)) {
    return withDataHeaders(NextResponse.next());
  }

  const tier = dataRateTierForPath(pathname);
  const result = sharedMemoryRateLimit.take(
    `${tier.bucket}:${ip}`,
    tier.limit,
    tier.windowMs,
  );

  if (!result.success) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((result.resetAt - Date.now()) / 1000),
    );
    const response = new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    });
    return withRateLimitHeaders(withDataHeaders(response), result);
  }

  return withRateLimitHeaders(withDataHeaders(NextResponse.next()), result);
}

/** Static county data is not for indexing regardless of status. */
function withDataHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

/** Standard rate-limit response headers for clients and debugging. */
function withRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(result.resetAt / 1000)),
  );
  return response;
}

export const config = {
  matcher: ["/data/:path*"],
};
