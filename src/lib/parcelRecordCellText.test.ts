// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parcelRecordCellText } from "./parcelRecordCellText";

describe("parcelRecordCellText", () => {
  it("returns plain text when no slash is present", () => {
    expect(parcelRecordCellText("Traditional")).toBe("Traditional");
  });

  it("inserts a break opportunity after slashes", () => {
    const html = renderToStaticMarkup(
      createElement("span", null, parcelRecordCellText("Asphalt/Composition Shingle Roof")),
    );
    expect(html).toContain("Asphalt");
    expect(html).toContain("/<wbr");
    expect(html).toContain("Composition Shingle Roof");
  });
});
