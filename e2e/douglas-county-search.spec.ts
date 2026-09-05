// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { displayMartAuthorityName } from "../src/lib/countyParcelLevyData";
import { SYNTHETIC_DOUGLAS_PIN } from "../src/lib/syntheticTestIds";
import { VALUATION_HISTORY_MODAL_TITLE_ASSESSED } from "../src/content/valuationHistoryCopy";
import {
  SYNTHETIC_E2E_AUTHORITY,
  SYNTHETIC_E2E_OWNER,
  SYNTHETIC_PIN,
} from "./fixtures/syntheticCountyData";
import {
  searchSyntheticAddress,
  streetAddressField,
  viewDistrictDetailsButton,
} from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

const authorityLabel = displayMartAuthorityName(SYNTHETIC_E2E_AUTHORITY);

const DOUGLAS_COMPARE_REGION =
  "See how Douglas County displays your data";

/**
 * Phase 13: Douglas JSON paths, county search gate (adjacent / unknown),
 * dashboard → `/sources?county=` preselect. Douglas ships valuation history
 * from Realware detail JSON (Phase 15). Synthetic route fulfill only.
 */
test.describe("Douglas county search gate (Phase 13)", () => {
  test("Douglas account-id load from the address field", async ({ page }) => {
    await installSyntheticCountyData(page, { countyId: "douglas" });
    await page.goto("/");
    await page.getByRole("radio", { name: "Douglas" }).click();

    const street = streetAddressField(page);
    await street.fill(SYNTHETIC_DOUGLAS_PIN);
    await street.press("Escape");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.locator("#home-levy-stack-subheading")).toBeVisible();
    await expect(page.getByText(authorityLabel)).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: DOUGLAS_COMPARE_REGION })
        .getByText(SYNTHETIC_DOUGLAS_PIN, { exact: true }),
    ).toBeVisible();
    await expect(page.locator("#home-parcel-property-tax")).toContainText("$272");
  });

  test("Douglas address resolve with county scope selected", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, { countyId: "douglas" });
    await page.goto("/");
    await page.getByRole("radio", { name: "Douglas" }).click();
    await searchSyntheticAddress(page);

    await expect(page.getByText(authorityLabel)).toBeVisible();
    await expect(
      page.getByRole("region", { name: DOUGLAS_COMPARE_REGION }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: DOUGLAS_COMPARE_REGION })
        .getByText(SYNTHETIC_DOUGLAS_PIN, { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("#home-property-details").getByText(SYNTHETIC_E2E_OWNER, {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("adjacent auto-try loads Douglas after Arapahoe miss", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, {
      countyId: "douglas",
      emptySitusCompanionCountyId: "arapahoe",
    });
    await page.goto("/");
    await expect(page.getByRole("radio", { name: "Arapahoe" })).toBeChecked();
    await searchSyntheticAddress(page);

    await expect(
      page.getByRole("region", { name: DOUGLAS_COMPARE_REGION }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: DOUGLAS_COMPARE_REGION })
        .getByText(SYNTHETIC_DOUGLAS_PIN, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(authorityLabel)).toBeVisible();
  });

  test("I don't know my county probes both and resolves Douglas", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, {
      countyId: "douglas",
      emptySitusCompanionCountyId: "arapahoe",
    });
    await page.goto("/");
    await page.getByRole("radio", { name: "I don't know my county" }).click();
    await searchSyntheticAddress(page);

    await expect(
      page.getByRole("region", { name: DOUGLAS_COMPARE_REGION }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: DOUGLAS_COMPARE_REGION })
        .getByText(SYNTHETIC_DOUGLAS_PIN, { exact: true }),
    ).toBeVisible();
  });

  test("Douglas dashboard See Sources opens /sources with Douglas preselected", async ({
    page,
    context,
  }) => {
    await installSyntheticCountyData(page, { countyId: "douglas" });
    await page.goto("/");
    await page.getByRole("radio", { name: "Douglas" }).click();
    await searchSyntheticAddress(page);

    await viewDistrictDetailsButton(page, authorityLabel).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const sourcesLink = dialog.getByRole("link", { name: /See Sources/i });
    await expect(sourcesLink).toHaveAttribute(
      "href",
      "/sources?county=douglas#levy-breakdown-tool",
    );

    const [sourcesPage] = await Promise.all([
      context.waitForEvent("page"),
      sourcesLink.click(),
    ]);
    await sourcesPage.waitForLoadState("domcontentloaded");
    await expect(sourcesPage.locator("#sources-county-select")).toHaveValue(
      "douglas",
    );
    await expect(
      sourcesPage.getByRole("heading", {
        name: "Douglas account lookup",
        level: 2,
      }),
    ).toBeVisible();
  });

  test("Douglas assessed value opens valuation history modal", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, { countyId: "douglas" });
    await page.goto("/");
    await page.getByRole("radio", { name: "Douglas" }).click();
    await searchSyntheticAddress(page);

    await expect(
      page.getByRole("button", { name: "Prior years missing" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Coming soon" }),
    ).toHaveCount(0);

    await page
      .getByRole("button", {
        name: /Assessed value\. View valuation history/i,
      })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", {
        name: VALUATION_HISTORY_MODAL_TITLE_ASSESSED,
        level: 3,
      }),
    ).toBeVisible();
    const yoyRegion = dialog.getByRole("region", {
      name: /higher than last year/i,
    });
    await expect(yoyRegion).toBeVisible();
    await expect(yoyRegion.getByText(/\$25,740/)).toBeVisible();
    await expect(yoyRegion.getByText(/\$27,170/)).toBeVisible();

    await dialog.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toBeHidden();

    await page
      .getByRole("region", { name: "Appraised and assessed values" })
      .getByRole("button", { name: "View valuation history", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("/sources?county=douglas preselects Douglas methodology", async ({
    page,
  }) => {
    await page.goto("/sources?county=douglas");
    await expect(page.locator("#sources-county-select")).toHaveValue("douglas");
    await expect(
      page.getByRole("heading", { name: "Douglas account lookup", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Your property tax bill (Arapahoe)",
        level: 2,
      }),
    ).toHaveCount(0);
    await expect(page.locator("#county-prior-year-values-gap")).toHaveCount(0);
    await expect(page.locator("#county-prior-year-values-in-progress")).toHaveCount(
      0,
    );
    await expect(page.getByText(/Realware detail JSON/i)).toBeVisible();
    await expect(page.getByText(/valuesByAbstractCode/i)).toBeVisible();
  });
});

test.describe("Arapahoe Sources county query (Phase 13)", () => {
  test("Arapahoe synthetic parcel Sources link carries county query", async ({
    page,
  }) => {
    await installSyntheticCountyData(page);
    await page.goto("/");
    await searchSyntheticAddress(page);

    await viewDistrictDetailsButton(page, authorityLabel).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: /See Sources/i }),
    ).toHaveAttribute(
      "href",
      "/sources?county=arapahoe#levy-breakdown-tool",
    );

    await expect(
      page
        .getByRole("region", {
          name: "See how Arapahoe County displays your data",
        })
        .getByText(SYNTHETIC_PIN, { exact: true }),
    ).toBeVisible();
  });
});
