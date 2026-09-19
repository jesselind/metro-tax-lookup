// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { buildMissingParcelDataMailtoHref } from "../src/lib/contact";
import {
  DEMO_AIN,
  DEMO_ADDRESS_LABEL,
  DEMO_DISPLAY_PIN,
  DEMO_OWNER_LIST,
} from "../src/lib/demoProperty";
import { splitSitusLabelEnvelopeLines } from "../src/lib/addressLabelDifference";
import { PARCEL_RECORD_NO_DATA } from "../src/lib/parcelRecordNoData";
import { COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS } from "../src/content/countyPriorYearValuesGapNote";
import { HOME_DASHBOARD_UTILITY_BAR_ID } from "../src/lib/homeDashboardJumps";

/**
 * Try demo: PIN-less fixture → levy stack + property details + missing-data mailto.
 * Linear user flow; Playwright auto-waits on expect(...).toBeVisible().
 */
test.describe("Try demo property", () => {
  test("shows levy stack and property details", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();

    await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
    await expect(
      page.getByRole("button", { name: COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS }),
    ).toBeVisible();

    const sectionNav = page.locator(`#${HOME_DASHBOARD_UTILITY_BAR_ID}`);
    await expect(sectionNav).toBeVisible();
    // Desktop sidenav: postage stack (street / city-state-ZIP), not one comma line.
    const demoEnvelope = splitSitusLabelEnvelopeLines(DEMO_ADDRESS_LABEL);
    await expect(sectionNav).toContainText(demoEnvelope.streetLine);
    if (demoEnvelope.localityLine) {
      await expect(sectionNav).toContainText(demoEnvelope.localityLine);
    }
    const onThisPage = page.getByRole("navigation", { name: "On this page" });
    await expect(
      onThisPage.getByRole("button", { name: "Summary", exact: true }),
    ).toHaveCount(0);
    await expect(
      await sectionNav.evaluate((el) => {
        // Desktop: aside stretches the column (static); stickiness is on the inner wrapper.
        const inner = el.firstElementChild;
        if (!(inner instanceof HTMLElement)) return getComputedStyle(el).position;
        return getComputedStyle(inner).position;
      }),
    ).toBe("sticky");

    await page
      .getByRole("navigation", { name: "On this page" })
      .getByRole("button", { name: "Where is your money going?" })
      .click();
    await expect(page.locator("#home-levy-stack-subheading")).toBeFocused();
    await expect(page.locator("#home-levy-stack-tiles")).toHaveAttribute(
      "data-arrive",
      "",
    );
    await expect(
      page.getByRole("region", { name: "Property tax breakdown" }),
    ).toBeVisible();
    await expect(page.locator("#parcel-record-heading")).toBeVisible();
    const details = page.locator("#home-property-details");
    await expect(
      details.getByText(DEMO_OWNER_LIST, {
        exact: true,
      }),
    ).toBeVisible();
    // Fictional neighborhood from src/data/demo-property.json (not a GIS join).
    await expect(
      details.getByText("EXAMPLE NEIGHBORHOOD", { exact: true }),
    ).toBeVisible();
    await expect(details.getByText("9999", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open county parcel record" }),
    ).toBeDisabled();
  });

  test("mobile section nav sticks, address toggles Jump to, and Escape closes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();

    const sectionNav = page.locator(`#${HOME_DASHBOARD_UTILITY_BAR_ID}`);
    await expect(sectionNav).toBeVisible();
    await expect(sectionNav).toContainText(DEMO_ADDRESS_LABEL);

    const jumpSummary = sectionNav.locator("summary");
    await expect(
      jumpSummary.getByText("Jump to a section", { exact: true }),
    ).toBeVisible();
    // Closed: one truncated line (full label string).
    await expect(jumpSummary).toContainText(DEMO_ADDRESS_LABEL);

    // I Own | I Rent must sit under the sticky Jump/address strip, not above it.
    const ownRent = page.getByRole("radiogroup", { name: "I own or I rent" });
    await expect(ownRent).toBeVisible();
    const navBox = await sectionNav.boundingBox();
    const rentBox = await ownRent.boundingBox();
    expect(navBox).not.toBeNull();
    expect(rentBox).not.toBeNull();
    expect(rentBox!.y).toBeGreaterThan(navBox!.y);

    const details = sectionNav.locator("details");
    const demoEnvelope = splitSitusLabelEnvelopeLines(DEMO_ADDRESS_LABEL);
    // Address is inside the summary: tap it to open, then Escape to close.
    if (await details.evaluate((el) => (el as HTMLDetailsElement).open)) {
      await jumpSummary.click();
    }
    await expect(details).not.toHaveAttribute("open", "");
    await jumpSummary.getByText(DEMO_ADDRESS_LABEL, { exact: false }).click();
    await expect(details).toHaveAttribute("open", "");
    // Open: postage stack (street / city-state-ZIP), same as desktop rail.
    await expect(jumpSummary).toContainText(demoEnvelope.streetLine);
    if (demoEnvelope.localityLine) {
      await expect(jumpSummary).toContainText(demoEnvelope.localityLine);
    }
    await page.keyboard.press("Escape");
    await expect(details).not.toHaveAttribute("open", "");
    await expect(jumpSummary).toContainText(DEMO_ADDRESS_LABEL);
    await sectionNav.scrollIntoViewIfNeeded();
    const topBefore = await sectionNav.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    expect(topBefore).toBeGreaterThan(0);
    await page.evaluate(() => window.scrollBy(0, 700));
    const after = await sectionNav.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width };
    });
    // Real stick: clamped near 0 — not scrolled away (negative) or mid-page.
    expect(after.top).toBeGreaterThanOrEqual(-1);
    expect(after.top).toBeLessThanOrEqual(1);
    expect(after.left).toBeLessThanOrEqual(1);
    expect(after.width).toBeGreaterThanOrEqual(388);
  });

  test("missing-data mailto includes field, demo PIN, and AIN", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();
    await expect(page.locator("#parcel-record-heading")).toBeVisible();

    // Subdivision Code stays empty in the demo fixture; Neighborhood is filled.
    await page
      .locator("#home-property-details")
      .getByRole("button", {
        name: `${PARCEL_RECORD_NO_DATA} for Subdivision Code. Open for details and how to report it.`,
      })
      .click();

    await expect(
      page.getByRole("link", { name: "Email us about this missing field" }),
    ).toHaveAttribute(
      "href",
      buildMissingParcelDataMailtoHref({
        fieldLabel: "Subdivision Code",
        pin: DEMO_DISPLAY_PIN,
        ain: DEMO_AIN,
      }),
    );
  });
});
