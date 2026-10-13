// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import {
  HOME_LANDING_LOOKUP_ID,
  HOME_LANDING_MENU_BUTTON_ARIA_LABEL,
  HOME_LANDING_NAV_ARIA_LABEL,
  HOME_WHY_TAXES_GO_UP_SECTION_ID,
} from "../src/lib/homeLandingJumps";

test.describe("home landing title-bar nav", () => {
  test("desktop: inline Home page sections jumps to Two numbers", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const nav = page.getByRole("navigation", {
      name: HOME_LANDING_NAV_ARIA_LABEL,
    });
    await expect(nav).toBeVisible();
    await expect(
      page.getByRole("button", { name: HOME_LANDING_MENU_BUTTON_ARIA_LABEL }),
    ).toBeHidden();

    // From page top the section is often already on screen; jump must still
    // pin its title under the sticky bar (block: start), not no-op nearest.
    await nav.getByRole("button", { name: "Two numbers" }).click();
    const whySection = page.locator(`#${HOME_WHY_TAXES_GO_UP_SECTION_ID}`);
    await expect(whySection).toBeFocused();
    await expect(
      page.getByRole("heading", {
        name: "Two numbers raise your property taxes",
        level: 2,
      }),
    ).toBeInViewport();
  });

  test("phone: Menu opens jumps; Look up your property reaches the lead", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const nav = page.getByRole("navigation", {
      name: HOME_LANDING_NAV_ARIA_LABEL,
    });
    await expect(nav).toBeVisible();

    await page
      .getByRole("button", { name: HOME_LANDING_MENU_BUTTON_ARIA_LABEL })
      .click();
    await nav.getByRole("button", { name: "Look up your property" }).click();
    await expect(page.locator(`#${HOME_LANDING_LOOKUP_ID}`)).toBeFocused();
    await expect(
      page.getByText("See where your property tax is actually going. And why."),
    ).toBeVisible();
  });

  test("locked report: home sections nav gone; Jump to a section remains", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Try demo property" }).click();
    await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();

    await expect(
      page.getByRole("navigation", { name: HOME_LANDING_NAV_ARIA_LABEL }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: HOME_LANDING_MENU_BUTTON_ARIA_LABEL }),
    ).toHaveCount(0);

    await expect(
      page.getByRole("button", {
        name: /Reset address lookup, parcel PIN/,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Jump to a section", { exact: true }),
    ).toBeVisible();
  });
});

