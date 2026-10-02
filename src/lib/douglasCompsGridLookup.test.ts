// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  normalizeDouglasAccountIdForDocumentsApi,
  pickDouglasCompsGridFromDocumentsTree,
} from "@/lib/douglasCompsGridLookup";

const COMP_HREF_2023 =
  "https://apps.douglas.co.us/realware/DOCUMENTS/R0399058/Appeal%20Summaries/R0399058_COMP_GRID_2023.PDF";

describe("normalizeDouglasAccountIdForDocumentsApi", () => {
  it("uppercases and accepts 8-character alphanumeric ids", () => {
    expect(normalizeDouglasAccountIdForDocumentsApi("r0399058")).toBe(
      "R0399058",
    );
    expect(normalizeDouglasAccountIdForDocumentsApi(" R0399058 ")).toBe(
      "R0399058",
    );
  });

  it("rejects empty, wrong length, or punctuation", () => {
    expect(normalizeDouglasAccountIdForDocumentsApi("")).toBeNull();
    expect(normalizeDouglasAccountIdForDocumentsApi("R039905")).toBeNull();
    expect(normalizeDouglasAccountIdForDocumentsApi("R0399058X")).toBeNull();
    expect(normalizeDouglasAccountIdForDocumentsApi("R039-058")).toBeNull();
  });
});

describe("pickDouglasCompsGridFromDocumentsTree", () => {
  it("returns null when no COMP_GRID file is present", () => {
    expect(
      pickDouglasCompsGridFromDocumentsTree({
        name: "R0399059",
        directories: [
          {
            name: "Notices of Value",
            type: "directory",
            files: [
              {
                name: "R0399059_NOV_2026.pdf",
                downloadUrl:
                  "https://apps.douglas.co.us/realware/DOCUMENTS/R0399059/Notices of Value/R0399059_NOV_2026.pdf",
                type: "file",
              },
            ],
            directories: [],
          },
        ],
      }),
    ).toBeNull();
  });

  it("picks the newest COMP_GRID year and allows spaces in downloadUrl", () => {
    const match = pickDouglasCompsGridFromDocumentsTree({
      name: "R0399058",
      directories: [
        {
          name: "Appeal Summaries",
          type: "directory",
          files: [
            {
              name: "R0399058_COMP_GRID_2021.PDF",
              downloadUrl:
                "https://apps.douglas.co.us/realware/DOCUMENTS/R0399058/Appeal Summaries/R0399058_COMP_GRID_2021.PDF",
              type: "file",
            },
            {
              name: "R0399058_COMP_GRID_2023.PDF",
              downloadUrl:
                "https://apps.douglas.co.us/realware/DOCUMENTS/R0399058/Appeal Summaries/R0399058_COMP_GRID_2023.PDF",
              type: "file",
            },
            {
              name: "R0399058_AppealSummary_2023.pdf",
              downloadUrl:
                "https://apps.douglas.co.us/realware/DOCUMENTS/R0399058/Appeal Summaries/R0399058_AppealSummary_2023.pdf",
              type: "file",
            },
          ],
          directories: [],
        },
      ],
    });
    expect(match).toEqual({
      href: COMP_HREF_2023,
      fileName: "R0399058_COMP_GRID_2023.PDF",
      taxYear: 2023,
    });
  });

  it("rejects download URLs off the Douglas host allowlist", () => {
    expect(
      pickDouglasCompsGridFromDocumentsTree({
        directories: [
          {
            name: "Appeal Summaries",
            files: [
              {
                name: "R0399058_COMP_GRID_2023.PDF",
                downloadUrl:
                  "https://evil.example/R0399058_COMP_GRID_2023.PDF",
                type: "file",
              },
            ],
          },
        ],
      }),
    ).toBeNull();
  });
});
