// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `/glossary` must read A-Z by the title a resident sees. Component names and
 * `term-*` ids sort differently from titles (for example TermNovComps... renders
 * "Improvement style"), so this checks rendered titles in render order.
 * Source check (same style as glossary.fullEntries) because vitest runs in node.
 */
describe("AllTermDefinitionAsides", () => {
  const src = readFileSync(
    join(process.cwd(), "src/content/termDefinitions.tsx"),
    "utf8",
  );

  /** Rendered heading per aside component: `TermAside` prop, else the custom `<p>`. */
  function titlesByComponent(): Map<string, string> {
    const titles = new Map<string, string>();
    for (const [, name, body] of src.matchAll(
      /export function (Term\w+Aside)\(\) \{([\s\S]*?)\n\}/g,
    )) {
      const title =
        body!.match(/title="([^"]+)"/)?.[1] ??
        body!.match(/id="[a-z-]+-term-title">\s*([^<]+?)\s*<\/p>/)?.[1];
      expect(title, `no title found for ${name}`).toBeDefined();
      titles.set(name!, title!);
    }
    return titles;
  }

  function renderedTitles(): string[] {
    const list = src.match(
      /export function AllTermDefinitionAsides\(\) \{([\s\S]*?)\n\}/,
    );
    expect(list).not.toBeNull();
    const titles = titlesByComponent();
    return [...list![1]!.matchAll(/<(Term\w+Aside) \/>/g)].map(([, name]) => {
      const title = titles.get(name!);
      expect(title, `${name} is rendered but not defined here`).toBeDefined();
      return title!;
    });
  }

  it("renders every glossary aside in alphabetical title order", () => {
    const titles = renderedTitles();
    expect(titles.length).toBeGreaterThan(1);

    const sorted = [...titles].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );
    expect(titles).toEqual(sorted);
  });

  it("renders each defined aside exactly once", () => {
    const titles = renderedTitles();
    expect(new Set(titles).size).toBe(titles.length);
    expect(titles.length).toBe(titlesByComponent().size);
  });
});
