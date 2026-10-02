// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  isDouglasPropertyDocumentsTree,
  normalizeDouglasAccountIdForDocumentsApi,
  pickDouglasCompsGridFromDocumentsTree,
} from "@/lib/douglasCompsGridLookup";
import {
  SYNTHETIC_DOUGLAS_PIN,
  SYNTHETIC_DOUGLAS_PIN_B,
} from "@/lib/syntheticTestIds";

const COMP_HREF_2023 =
  `https://apps.douglas.co.us/realware/DOCUMENTS/${SYNTHETIC_DOUGLAS_PIN}/Appeal%20Summaries/${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`;

describe("normalizeDouglasAccountIdForDocumentsApi", () => {
  it("uppercases and accepts 8-character alphanumeric ids", () => {
    expect(normalizeDouglasAccountIdForDocumentsApi("r0100001")).toBe(
      SYNTHETIC_DOUGLAS_PIN,
    );
    expect(
      normalizeDouglasAccountIdForDocumentsApi(` ${SYNTHETIC_DOUGLAS_PIN} `),
    ).toBe(SYNTHETIC_DOUGLAS_PIN);
  });

  it("rejects empty, wrong length, or punctuation", () => {
    expect(normalizeDouglasAccountIdForDocumentsApi("")).toBeNull();
    expect(normalizeDouglasAccountIdForDocumentsApi("R010000")).toBeNull();
    expect(normalizeDouglasAccountIdForDocumentsApi("R0100001X")).toBeNull();
    expect(normalizeDouglasAccountIdForDocumentsApi("R010-001")).toBeNull();
  });
});

describe("isDouglasPropertyDocumentsTree", () => {
  it("accepts bodies with directories and/or files arrays", () => {
    expect(isDouglasPropertyDocumentsTree({ directories: [] })).toBe(true);
    expect(isDouglasPropertyDocumentsTree({ files: [] })).toBe(true);
    expect(
      isDouglasPropertyDocumentsTree({
        name: SYNTHETIC_DOUGLAS_PIN,
        directories: [],
        files: [],
      }),
    ).toBe(true);
  });

  it("rejects non-objects, arrays, and bodies without list keys", () => {
    expect(isDouglasPropertyDocumentsTree(null)).toBe(false);
    expect(isDouglasPropertyDocumentsTree([])).toBe(false);
    expect(isDouglasPropertyDocumentsTree("nope")).toBe(false);
    expect(isDouglasPropertyDocumentsTree({ name: SYNTHETIC_DOUGLAS_PIN })).toBe(
      false,
    );
    expect(
      isDouglasPropertyDocumentsTree({ error: "not found", message: "fail" }),
    ).toBe(false);
    expect(
      isDouglasPropertyDocumentsTree({ directories: "not-an-array" }),
    ).toBe(false);
  });
});

describe("pickDouglasCompsGridFromDocumentsTree", () => {
  it("returns null when no COMP_GRID file is present", () => {
    expect(
      pickDouglasCompsGridFromDocumentsTree({
        name: SYNTHETIC_DOUGLAS_PIN_B,
        directories: [
          {
            name: "Notices of Value",
            type: "directory",
            files: [
              {
                name: `${SYNTHETIC_DOUGLAS_PIN_B}_NOV_2026.pdf`,
                downloadUrl: `https://apps.douglas.co.us/realware/DOCUMENTS/${SYNTHETIC_DOUGLAS_PIN_B}/Notices of Value/${SYNTHETIC_DOUGLAS_PIN_B}_NOV_2026.pdf`,
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
      name: SYNTHETIC_DOUGLAS_PIN,
      directories: [
        {
          name: "Appeal Summaries",
          type: "directory",
          files: [
            {
              name: `${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2021.PDF`,
              downloadUrl: `https://apps.douglas.co.us/realware/DOCUMENTS/${SYNTHETIC_DOUGLAS_PIN}/Appeal Summaries/${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2021.PDF`,
              type: "file",
            },
            {
              name: `${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`,
              downloadUrl: `https://apps.douglas.co.us/realware/DOCUMENTS/${SYNTHETIC_DOUGLAS_PIN}/Appeal Summaries/${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`,
              type: "file",
            },
            {
              name: `${SYNTHETIC_DOUGLAS_PIN}_AppealSummary_2023.pdf`,
              downloadUrl: `https://apps.douglas.co.us/realware/DOCUMENTS/${SYNTHETIC_DOUGLAS_PIN}/Appeal Summaries/${SYNTHETIC_DOUGLAS_PIN}_AppealSummary_2023.pdf`,
              type: "file",
            },
          ],
          directories: [],
        },
      ],
    });
    expect(match).toEqual({
      href: COMP_HREF_2023,
      fileName: `${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`,
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
                name: `${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`,
                downloadUrl: `https://evil.example/${SYNTHETIC_DOUGLAS_PIN}_COMP_GRID_2023.PDF`,
                type: "file",
              },
            ],
          },
        ],
      }),
    ).toBeNull();
  });
});
