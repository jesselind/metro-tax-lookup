// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { HEAVY_DATA_LIMIT } from "@/lib/dataRequestGuard";
import { sharedMemoryRateLimit } from "@/lib/memoryRateLimit";
import { proxy } from "@/proxy";

const HEAVY_PATH = "/data/arapahoe-pin-to-tag.json";
const SHARD_PATH = "/data/arapahoe-parcel-record-by-pin/035662.json";

function dataRequest(
  path: string,
  init?: {
    method?: string;
    realIp?: string;
    vercelForwardedFor?: string;
  },
): NextRequest {
  const headers = new Headers();
  if (init?.vercelForwardedFor) {
    headers.set("x-vercel-forwarded-for", init.vercelForwardedFor);
  }
  if (init?.realIp) {
    headers.set("x-real-ip", init.realIp);
  }
  return new NextRequest(`http://127.0.0.1:3000${path}`, {
    method: init?.method ?? "GET",
    headers,
  });
}

describe("proxy `/data` rate limiting", () => {
  const previousDisabled = process.env.RATE_LIMIT_DISABLED;

  beforeEach(() => {
    delete process.env.RATE_LIMIT_DISABLED;
    sharedMemoryRateLimit.clear();
  });

  afterEach(() => {
    if (previousDisabled === undefined) {
      delete process.env.RATE_LIMIT_DISABLED;
    } else {
      process.env.RATE_LIMIT_DISABLED = previousDisabled;
    }
    sharedMemoryRateLimit.clear();
  });

  it("passes through non-/data paths without rate-limit headers", async () => {
    const res = await proxy(
      new NextRequest("http://127.0.0.1:3000/", { method: "GET" }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
  });

  it("rejects non-GET/HEAD on /data with 405", async () => {
    const res = await proxy(
      dataRequest(HEAVY_PATH, { method: "POST", realIp: "203.0.113.1" }),
    );
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("GET, HEAD");
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("skips limiting for loopback clients", async () => {
    for (let i = 0; i < HEAVY_DATA_LIMIT + 3; i += 1) {
      const res = await proxy(
        dataRequest(HEAVY_PATH, { realIp: "127.0.0.1" }),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
    }
  });

  it("allows requests under the heavy limit and sets rate-limit headers", async () => {
    const res = await proxy(
      dataRequest(HEAVY_PATH, { realIp: "203.0.113.20" }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe(String(HEAVY_DATA_LIMIT));
    expect(res.headers.get("X-RateLimit-Remaining")).toBe(
      String(HEAVY_DATA_LIMIT - 1),
    );
    expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it("returns 429 after the heavy limit is exceeded", async () => {
    const ip = "203.0.113.30";
    for (let i = 0; i < HEAVY_DATA_LIMIT; i += 1) {
      const ok = await proxy(dataRequest(HEAVY_PATH, { realIp: ip }));
      expect(ok.status).toBe(200);
    }
    const blocked = await proxy(dataRequest(HEAVY_PATH, { realIp: ip }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(blocked.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("does not count shard traffic against the heavy bucket", async () => {
    const ip = "203.0.113.40";
    for (let i = 0; i < HEAVY_DATA_LIMIT; i += 1) {
      expect(
        (await proxy(dataRequest(HEAVY_PATH, { realIp: ip }))).status,
      ).toBe(200);
    }
    expect(
      (await proxy(dataRequest(SHARD_PATH, { realIp: ip }))).status,
    ).toBe(200);
  });

  it("bypasses limiting when RATE_LIMIT_DISABLED=1", async () => {
    process.env.RATE_LIMIT_DISABLED = "1";
    const ip = "203.0.113.50";
    for (let i = 0; i < HEAVY_DATA_LIMIT + 2; i += 1) {
      const res = await proxy(dataRequest(HEAVY_PATH, { realIp: ip }));
      expect(res.status).toBe(200);
      expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
      expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    }
    const disallowed = await proxy(
      dataRequest(HEAVY_PATH, { method: "POST", realIp: ip }),
    );
    expect(disallowed.status).toBe(405);
  });
});
