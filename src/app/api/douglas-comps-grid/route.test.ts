// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/douglas-comps-grid/route";

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
          name: "R0399058",
          directories: [
            {
              name: "Appeal Summaries",
              files: [
                {
                  name: "R0399058_COMP_GRID_2023.PDF",
                  downloadUrl:
                    "https://apps.douglas.co.us/realware/DOCUMENTS/R0399058/Appeal Summaries/R0399058_COMP_GRID_2023.PDF",
                  type: "file",
                },
              ],
              directories: [],
            },
          ],
        }),
      ),
    );

    const res = await GET(requestForAccount("R0399058"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "found",
      href: "https://apps.douglas.co.us/realware/DOCUMENTS/R0399058/Appeal%20Summaries/R0399058_COMP_GRID_2023.PDF",
      fileName: "R0399058_COMP_GRID_2023.PDF",
      taxYear: 2023,
    });
  });

  it("returns missing when no COMP_GRID is listed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          name: "R0399059",
          directories: [
            {
              name: "Notices of Value",
              files: [
                {
                  name: "R0399059_NOV_2026.pdf",
                  downloadUrl:
                    "https://apps.douglas.co.us/realware/DOCUMENTS/R0399059/Notices of Value/R0399059_NOV_2026.pdf",
                },
              ],
              directories: [],
            },
          ],
        }),
      ),
    );

    const res = await GET(requestForAccount("r0399059"));
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
    const res = await GET(requestForAccount("R0399059"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "missing" });
  });

  it("returns 502 when the county documents API returns a non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 })),
    );
    const res = await GET(requestForAccount("R0399058"));
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      status: "error",
      message: "The county documents list did not respond successfully.",
    });
  });

  it("returns 502 when the county fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const res = await GET(requestForAccount("R0399058"));
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      status: "error",
      message: "We could not reach the county documents list right now.",
    });
  });
});
