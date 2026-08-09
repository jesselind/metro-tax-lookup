// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCountyStaticJson } from "@/lib/fetchCountyStaticJson";

describe("fetchCountyStaticJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns json on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ byKey: {} }),
      }),
    );
    const result = await fetchCountyStaticJson("/data/example.json");
    expect(result).toEqual({ ok: true, json: { byKey: {} } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries once after a non-OK response then succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchCountyStaticJson("/data/example.json");
    await vi.advanceTimersByTimeAsync(500);
    const result = await pending;
    expect(result).toEqual({ ok: true, json: { ok: true } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a detail string after two failures", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    const pending = fetchCountyStaticJson("/data/missing.json");
    await vi.advanceTimersByTimeAsync(500);
    const result = await pending;
    expect(result).toEqual({
      ok: false,
      detail: "/data/missing.json: HTTP 404",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
