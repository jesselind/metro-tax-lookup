// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { expect, test } from "@playwright/test";
import { searchSyntheticAddress } from "./helpers/addressLookup";
import { installSyntheticCountyData } from "./helpers/installSyntheticCountyData";

/**
 * Own | Rent audience lens: default Own; Rent shows equal-split when synthetic UB N is known.
 */
test.describe("audience mode Own / Rent", () => {
  test("default Own keeps comps path; Rent shows equal-split and hides comps", async ({
    page,
  }) => {
    await installSyntheticCountyData(page);
    await page.goto("/");

    const ownRadio = page.getByRole("radio", { name: "Own" });
    const rentRadio = page.getByRole("radio", { name: "Rent" });
    await expect(ownRadio).toBeChecked();
    await expect(rentRadio).not.toBeChecked();
    await expect(
      page.getByText("See where your money is actually going."),
    ).toBeVisible();
    await expect(
      page.getByText("Even if you rent."),
    ).toHaveCount(0);

    await rentRadio.click();
    await expect(rentRadio).toBeChecked();
    await expect(
      page.getByText(
        "You're still paying property tax if you rent. Where's it going?",
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Get a clear picture of your property tax bill."),
    ).toHaveCount(0);
    await expect(
      page.getByText("See where your money is actually going."),
    ).toHaveCount(0);

    await ownRadio.click();
    await expect(ownRadio).toBeChecked();

    await searchSyntheticAddress(page);

    // Own lens: comps tile remains (may be unavailable-status chrome).
    await expect(page.locator("#home-parcel-comps-pdf")).toBeVisible();
    await expect(page.locator("#home-parcel-rent-tax-pressure")).toHaveCount(0);
    const levyTotal = page.getByRole("region", {
      name: "Total mill levy for your stack",
    });
    // Synthetic whole-account annual estimate.
    await expect(levyTotal).toContainText("$68");
    await expect(levyTotal).not.toContainText("/mo");

    await rentRadio.click();
    await expect(rentRadio).toBeChecked();

    const rentPanel = page.locator("#home-parcel-rent-tax-pressure");
    await expect(rentPanel).toBeVisible();

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "You're still paying property tax if you rent.",
      }),
    ).toBeVisible();
    // Synthetic: 4 UB → $1/mo per home, $68/yr whole building; levy $ also /4 then /12.
    await expect(page.locator("#home-parcel-rent-per-home-monthly")).toContainText(
      "Your estimated property tax",
    );
    await expect(page.locator("#home-parcel-rent-per-home-monthly")).toContainText(
      "$1",
    );
    await expect(page.locator("#home-parcel-rent-building-annual")).toContainText(
      "$68",
    );
    await expect(page.locator("#home-parcel-rent-unit-count")).toContainText("4");
    await expect(rentPanel).toContainText(
      "splits this tax account evenly across units",
    );
    await expect(levyTotal).toContainText("$1");
    await expect(levyTotal).toContainText("/mo");
    await expect(levyTotal).not.toContainText("$68");
    await expect(levyTotal).not.toContainText("$17");

    await expect(page.locator("#home-parcel-comps-pdf")).toHaveCount(0);

    // Flip back to Own without Start over: comps return, rent panel clears.
    await ownRadio.click();
    await expect(page.locator("#home-parcel-comps-pdf")).toBeVisible();
    await expect(page.locator("#home-parcel-rent-tax-pressure")).toHaveCount(0);
  });
});
