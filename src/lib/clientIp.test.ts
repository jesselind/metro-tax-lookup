// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";

import { clientIpFromHeaders, isLoopbackIp } from "./clientIp";

describe("clientIpFromHeaders", () => {
  it("prefers x-vercel-forwarded-for over other client IP headers", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.10, 10.0.0.1",
      "x-real-ip": "198.51.100.1",
      "x-forwarded-for": "1.2.3.4",
    });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("prefers x-real-ip over spoofable x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 203.0.113.10",
      "x-real-ip": "203.0.113.10",
    });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("ignores standalone x-forwarded-for when platform headers are absent", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.2, 10.0.0.1",
    });
    expect(clientIpFromHeaders(headers)).toBe("unknown");
  });

  it("falls back to the default when no client headers are present", () => {
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});

describe("isLoopbackIp", () => {
  it("recognizes common loopback forms", () => {
    expect(isLoopbackIp("127.0.0.1")).toBe(true);
    expect(isLoopbackIp("::1")).toBe(true);
    expect(isLoopbackIp("::ffff:127.0.0.1")).toBe(true);
    expect(isLoopbackIp("203.0.113.1")).toBe(false);
  });
});
