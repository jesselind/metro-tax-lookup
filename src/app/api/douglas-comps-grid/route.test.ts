// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/douglas-comps-grid/route";
import {
  SYNTHETIC_DOUGLAS_PIN,
  SYNTHETIC_DOUGLAS_PIN_B,
} from "@/lib/syntheticTestIds";

function requestForAccount(account: string): NextRequest {
  return new NextRequest(
    `http://localhost/api/douglas-comps-grid?account=${encodeURIComponent(account)}`,
  );
}

describe("GET /api/douglas-comps-grid", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns found when the county documents tree includes COMP_GRID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          name: SYNTHETIC_DOUGLAS_PIN,
          directories: [
            {
              name: "Appeal Summaries",
              files: [
                {
                  name: `${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`,
                  downloadUrl: `https://apps.douglas.co.us/realware/DOCUMENTS/${SYNTHETIC_DOUGLAS_PIN}/Appeal Summaries/${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`,
                  type: "file",
                },
              ],
              directories: [],
            },
          ],
        }),
      ),
    );

    const res = await GET(requestForAccount(SYNTHETIC_DOUGLAS_PIN));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "found",
      href: `https://apps.douglas.co.us/realware/DOCUMENTS/${SYNTHETIC_DOUGLAS_PIN}/Appeal%20Summaries/${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`,
      fileName: `${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`,
      taxYear: 2023,
    });
  });

  it("returns missing when no COMP_GRID is listed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          name: SYNTHETIC_DOUGLAS_PIN_B,
          directories: [
            {
              name: "Notices of Value",
              files: [
                {
                  name: `${SYNTHETIC_DOUGLAS_PIN_B}_NOV_2026.pdf`,
                  downloadUrl: `https://apps.douglas.co.us/realware/DOCUMENTS/${SYNTHETIC_DOUGLAS_PIN_B}/Notices of Value/${SYNTHETIC_DOUGLAS_PIN_B}_NOV_2026.pdf`,
                },
              ],
              directories: [],
            },
          ],
        }),
      ),
    );

    const res = await GET(requestForAccount("r0100002"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "missing" });
  });

  it("returns 400 for an invalid account id", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await GET(requestForAccount("bad"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ status: "error" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns missing when the county documents API returns 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 404 })),
    );
    const res = await GET(requestForAccount(SYNTHETIC_DOUGLAS_PIN_B));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "missing" });
  });

  it("returns 502 when the county documents API returns a non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 })),
    );
    const res = await GET(requestForAccount(SYNTHETIC_DOUGLAS_PIN));
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      status: "error",
      message: "The county documents list did not respond successfully.",
    });
  });

  it("returns 502 when the county body is not a documents list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "unexpected", message: "fail" }),
      ),
    );
    const res = await GET(requestForAccount(SYNTHETIC_DOUGLAS_PIN));
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      status: "error",
      message: "The county documents list returned an unexpected response.",
    });
  });

  it("returns 502 when the county fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const res = await GET(requestForAccount(SYNTHETIC_DOUGLAS_PIN));
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      status: "error",
      message: "We could not reach the county documents list right now.",
    });
  });
});
