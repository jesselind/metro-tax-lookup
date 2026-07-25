// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * Best-effort client IP for rate limiting behind Vercel / reverse proxies.
 *
 * Prefer platform-set headers (`x-vercel-forwarded-for`, then `x-real-ip`).
 * Do not use client-controlled `x-forwarded-for`: a client can prepend spoofed
 * hops, so its leftmost value is untrusted as a limiter identity. When trusted
 * headers are absent, return the fallback (shared bucket).
 */

/** First hop from a comma-separated forwarding header, or null if empty. */
function firstHop(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const first = headerValue.split(",")[0]?.trim();
  return first || null;
}

export function clientIpFromHeaders(
  headers: Headers,
  fallback = "unknown",
): string {
  const fromVercel = firstHop(headers.get("x-vercel-forwarded-for"));
  if (fromVercel) return fromVercel;

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return fallback;
}

/** True for loopback used by local `next start` / Playwright. */
export function isLoopbackIp(ip: string): boolean {
  const trimmed = ip.trim().toLowerCase();
  return (
    trimmed === "127.0.0.1" ||
    trimmed === "::1" ||
    trimmed === "::ffff:127.0.0.1" ||
    trimmed === "localhost"
  );
}
