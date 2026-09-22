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
import {
  HOME_APPRAISED_ASSESSED_ID,
  HOME_DASHBOARD_UTILITY_BAR_ID,
  HOME_FEEDBACK_ASIDE_ID,
  HOME_PROPERTY_DETAILS_ID,
} from "../src/lib/homeDashboardJumps";

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

    // Desktop sidenav scroll-spies (mobile Jump does not): after scroll, one current jump.
    await page.locator("#home-levy-stack-tiles").hover();
    await page.mouse.wheel(0, 500);
    await expect(
      onThisPage.locator('button[aria-current="location"]'),
    ).toHaveCount(1);

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

    // I Own | I Rent sits with the report under the Jump strip (both must be usable).
    const ownRent = page.getByRole("radiogroup", { name: "I own or I rent" });
    await expect(ownRent).toBeVisible();
    await expect(ownRent.getByRole("radio", { name: "I Own" })).toBeVisible();

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
    // Wheel the report; Jump strip stays on screen and usable (sticky).
    await page.locator("#home-levy-stack-subheading").hover();
    await page.mouse.wheel(0, 900);
    await page.mouse.wheel(0, 900);
    await expect(sectionNav).toBeVisible();
    await expect(sectionNav).toBeInViewport();
    await expect(
      jumpSummary.getByText("Jump to a section", { exact: true }),
    ).toBeVisible();
    await jumpSummary.click();
    await expect(details).toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(details).not.toHaveAttribute("open", "");
  });

  test("mobile TOC list scrolls when taller than the viewport, then jumps", async ({
    page,
  }) => {
    // Short phone chrome: full demo jump list + open postage address exceed svh.
    await page.setViewportSize({ width: 390, height: 560 });
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();

    const sectionNav = page.locator(`#${HOME_DASHBOARD_UTILITY_BAR_ID}`);
    const details = sectionNav.locator("details");
    const jumpSummary = sectionNav.locator("summary");
    if (await details.evaluate((el) => (el as HTMLDetailsElement).open)) {
      await jumpSummary.click();
    }
    await jumpSummary.click();
    await expect(details).toHaveAttribute("open", "");

    const menu = details.locator("ul").first();
    const feedback = sectionNav.getByRole("button", {
      name: "Feedback",
      exact: true,
    });
    // Wheel the open Jump list like a phone, then tap Feedback.
    await menu.hover();
    await page.mouse.wheel(0, 400);
    await page.mouse.wheel(0, 400);
    await feedback.click();
    const feedbackAside = page.locator(`#${HOME_FEEDBACK_ASIDE_ID}`);
    await expect(feedbackAside).toBeFocused();
    await expect(feedbackAside).toBeInViewport();
    await expect(details).not.toHaveAttribute("open", "");
  });

  test("mobile TOC second jump still works after the first", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();

    const sectionNav = page.locator(`#${HOME_DASHBOARD_UTILITY_BAR_ID}`);
    const details = sectionNav.locator("details");
    const jumpSummary = sectionNav.locator("summary");
    if (await details.evaluate((el) => (el as HTMLDetailsElement).open)) {
      await jumpSummary.click();
    }
    await jumpSummary.click();
    await expect(details).toHaveAttribute("open", "");

    // Mobile Jump list must not use scroll-spy aria-current.
    await expect(
      sectionNav.locator('button[aria-current="location"]'),
    ).toHaveCount(0);

    await sectionNav
      .getByRole("button", { name: "Property details", exact: true })
      .click();
    const propertyDetails = page.locator(`#${HOME_PROPERTY_DETAILS_ID}`);
    await expect(propertyDetails).toBeFocused();
    await expect(propertyDetails).toBeInViewport();
    await expect(details).not.toHaveAttribute("open", "");

    await jumpSummary.click();
    await expect(details).toHaveAttribute("open", "");
    await sectionNav
      .getByRole("button", { name: "Feedback", exact: true })
      .click();
    const feedbackAside = page.locator(`#${HOME_FEEDBACK_ASIDE_ID}`);
    await expect(feedbackAside).toBeFocused();
    await expect(feedbackAside).toBeInViewport();
    await expect(details).not.toHaveAttribute("open", "");
  });

  test("Comparable properties: one heading, sticky table grid, no PDF gap under title", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();

    const comps = page.locator("#home-nov-comps-grid");
    await expect(comps).toBeVisible();
    await expect(
      comps.getByRole("heading", { name: "Comparable properties", level: 3 }),
    ).toBeVisible();
    await expect(
      comps.getByRole("heading", { name: "Comps grid" }),
    ).toHaveCount(0);
    await expect(comps.getByRole("button", { name: "Coming soon" })).toHaveCount(
      0,
    );
    await expect(comps.getByText(/COUNTY DATA GAP/i)).toHaveCount(0);
    await expect(
      comps.getByRole("table", {
        name: /Comparable sales and subject fields/i,
      }),
    ).toBeVisible();
    await expect(
      comps.getByRole("region", {
        name: /Field names and your property stay fixed/i,
      }),
    ).toBeVisible();
  });

  test("Comparable properties Jump order: comps, then county compare, then Feedback", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();

    const onThisPage = page.getByRole("navigation", { name: "On this page" });
    await expect(
      onThisPage.getByRole("button", { name: /Comparable properties/ }),
    ).toBeVisible();
    const jumpLabels = await onThisPage.getByRole("button").allTextContents();
    const compsIdx = jumpLabels.findIndex((t) =>
      t.includes("Comparable properties"),
    );
    const compareIdx = jumpLabels.findIndex((t) =>
      t.includes("See how Arapahoe County displays your data"),
    );
    const feedbackIdx = jumpLabels.findIndex((t) => t.includes("Feedback"));
    expect(compsIdx).toBeGreaterThanOrEqual(0);
    expect(compareIdx).toBeGreaterThan(compsIdx);
    expect(feedbackIdx).toBeGreaterThan(compareIdx);
  });

  test("Appraised and assessed values: Total boards visible; Building and land behind disclosure", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Try demo property" }).click();

    const section = page.locator(`#${HOME_APPRAISED_ASSESSED_ID}`);
    await expect(section).toBeVisible();
    await page.mouse.wheel(0, 200);

    const faceList = section.getByRole("list").first();
    await expect(faceList).toBeVisible();
    const firstBoard = faceList.getByRole("listitem").first();
    await expect(firstBoard).toBeVisible();
    await expect(firstBoard.getByText(/^\$[\d,]+/)).toBeVisible();

    const breakdownToggle = section.getByRole("button", {
      name: "Building and land breakdown",
    });
    await expect(breakdownToggle).toBeVisible();
    await expect(
      section.getByRole("table", {
        name: /Building and land breakdown/i,
      }),
    ).toHaveCount(0);

    await breakdownToggle.click();
    const breakdownTable = section.getByRole("table", {
      name: /Building and land breakdown/i,
    });
    await expect(breakdownTable).toBeVisible();
    await expect(
      breakdownTable.getByRole("columnheader", { name: "Building" }),
    ).toBeVisible();
    await expect(
      breakdownTable.getByRole("columnheader", { name: "Land" }),
    ).toBeVisible();
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
