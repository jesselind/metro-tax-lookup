// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TermCompsBriefBody } from "@/content/termDefinitionBodies";

describe("TermCompsBriefBody", () => {
  it("defines comps grid as a side-by-side table without PDF or county-only framing", () => {
    const html = renderToStaticMarkup(createElement(TermCompsBriefBody));
    expect(html).toMatch(/comps grid/i);
    expect(html).toMatch(/side-by-side table/i);
    expect(html).not.toMatch(/PDF/i);
    expect(html).not.toMatch(/often a PDF/i);
  });
});
