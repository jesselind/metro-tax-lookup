// Metro Tax Lookup
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { displayMartAuthorityName } from "../src/lib/countyParcelLevyData";
import { SYNTHETIC_DOUGLAS_PIN } from "../src/lib/syntheticTestIds";
import {
  COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LEAD_BEFORE_LINK,
  COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LINK_LABEL,
  COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL,
  COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS,
} from "../src/content/countyPriorYearValuesGapNote";
import { COUNTY_SERVICE_GAP_CALLOUT_TITLE } from "../src/content/countyServiceGapGuidance";
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
 * dashboard → `/sources?county=` preselect, and Douglas Prior years missing
 * COUNTY DATA GAP (property-page link; /sources holds file + custom-report cite).
 * Synthetic route fulfill only.
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
    await expect(page.locator("#home-parcel-property-tax")).toContainText("$68");
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

  test("Douglas Prior years missing badge uses Douglas COUNTY DATA GAP copy", async ({
    page,
  }) => {
    await installSyntheticCountyData(page, { countyId: "douglas" });
    await page.goto("/");
    await page.getByRole("radio", { name: "Douglas" }).click();
    await searchSyntheticAddress(page);

    const priorYearTrigger = page.getByRole("button", {
      name: COUNTY_PRIOR_YEAR_VALUES_TILE_STATUS,
    });
    await expect(priorYearTrigger).toBeVisible();
    await priorYearTrigger.click();

    const priorYearGap = page.getByRole("note").filter({
      hasText: COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LEAD_BEFORE_LINK,
    });
    await expect(priorYearGap).toBeVisible();
    await expect(priorYearGap).toContainText(COUNTY_SERVICE_GAP_CALLOUT_TITLE);
    await expect(priorYearGap).toContainText(/bulk download/i);
    await expect(priorYearGap).not.toContainText(/Property_Values\.txt/i);
    await expect(priorYearGap).not.toContainText(/\$50/);
    await expect(priorYearGap).not.toContainText(
      /no historical information available on the public website/i,
    );
    await expect(
      priorYearGap.getByRole("link", {
        name: COUNTY_PRIOR_YEAR_VALUES_DASHBOARD_DOUGLAS_LINK_LABEL,
      }),
    ).toHaveAttribute(
      "href",
      `https://apps.douglas.co.us/assessor/web/#/details/2026/${SYNTHETIC_DOUGLAS_PIN}`,
    );
    await expect(
      priorYearGap.getByRole("link", {
        name: COUNTY_PRIOR_YEAR_VALUES_SOURCES_LINK_LABEL,
      }),
    ).toHaveAttribute(
      "href",
      "/sources?county=douglas#county-prior-year-values-gap",
    );
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
    await expect(
      page.locator("#county-prior-year-values-gap"),
    ).toContainText(/Property_Values\.txt/i);
    await expect(
      page.locator("#county-prior-year-values-gap").getByRole("link", {
        name: /Assessor Custom Reports/i,
      }),
    ).toHaveAttribute(
      "href",
      "https://www.douglasco.gov/assessor/real-estate-data-center/#:~:text=Assessor%20Custom%20Reports",
    );
    await expect(
      page.locator("#county-prior-year-values-gap"),
    ).not.toContainText(
      /no historical information available on the public website/i,
    );
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
