// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { describe, expect, it } from "vitest";
import {
  adjacentAuthorityMillsYoYChanges,
  formatMetroMillsChangeFactValue,
  selectMetroAuthorityMillsChangeBlocks,
} from "@/lib/authorityMillsChangeBlocks";
import type { AuthorityMillsSeriesPoint } from "@/lib/authorityMillsHistory";

describe("authorityMillsChangeBlocks", () => {
  const skyRanchLike: AuthorityMillsSeriesPoint[] = [
    { taxYear: 2018, mills: 0 },
    { taxYear: 2019, mills: 0 },
    { taxYear: 2020, mills: 0 },
    { taxYear: 2021, mills: 126.336 },
    { taxYear: 2022, mills: 122.215 },
    { taxYear: 2023, mills: 128.67 },
    { taxYear: 2024, mills: 119.387 },
    { taxYear: 2025, mills: 118.956 },
  ];

  it("builds adjacent YoY pairs without inventing years", () => {
    expect(adjacentAuthorityMillsYoYChanges(skyRanchLike)).toHaveLength(7);
    expect(adjacentAuthorityMillsYoYChanges([{ taxYear: 2025, mills: 1 }])).toEqual(
      [],
    );
  });

  it("always returns change from last year when two+ points exist", () => {
    const { changeFromLastYear, mostNotableChange } =
      selectMetroAuthorityMillsChangeBlocks(skyRanchLike);
    expect(changeFromLastYear).toEqual({
      fromYear: 2024,
      toYear: 2025,
      fromMills: 119.387,
      toMills: 118.956,
      delta: expect.closeTo(-0.431, 5),
      calendarYearSpan: 1,
    });
    expect(mostNotableChange).toEqual({
      fromYear: 2020,
      toYear: 2021,
      fromMills: 0,
      toMills: 126.336,
      delta: 126.336,
      calendarYearSpan: 1,
    });
  });

  it("omits most notable when it is the same pair as last year", () => {
    const series: AuthorityMillsSeriesPoint[] = [
      { taxYear: 2023, mills: 10 },
      { taxYear: 2024, mills: 11 },
      { taxYear: 2025, mills: 20 },
    ];
    const { changeFromLastYear, mostNotableChange } =
      selectMetroAuthorityMillsChangeBlocks(series);
    expect(changeFromLastYear?.fromYear).toBe(2024);
    expect(changeFromLastYear?.toYear).toBe(2025);
    expect(mostNotableChange).toBeNull();
  });

  it("tie-breaks equal absolute moves toward the more recent pair", () => {
    const series: AuthorityMillsSeriesPoint[] = [
      { taxYear: 2020, mills: 0 },
      { taxYear: 2021, mills: 10 },
      { taxYear: 2022, mills: 20 },
      { taxYear: 2023, mills: 21 },
    ];
    const { changeFromLastYear, mostNotableChange } =
      selectMetroAuthorityMillsChangeBlocks(series);
    expect(changeFromLastYear?.toYear).toBe(2023);
    // |+10| twice (2020→2021 and 2021→2022); prefer more recent → 2021→2022
    expect(mostNotableChange).toEqual({
      fromYear: 2021,
      toYear: 2022,
      fromMills: 10,
      toMills: 20,
      delta: 10,
      calendarYearSpan: 1,
    });
  });

  it("annotates non-consecutive published tax years in fact text", () => {
    const value = formatMetroMillsChangeFactValue({
      fromYear: 2020,
      toYear: 2022,
      fromMills: 0,
      toMills: 122.215,
      delta: 122.215,
      calendarYearSpan: 2,
    });
    expect(value).toContain("not consecutive published years");
  });

  it("formats up/down fact values for the trail", () => {
    expect(
      formatMetroMillsChangeFactValue({
        fromYear: 2024,
        toYear: 2025,
        fromMills: 119.387,
        toMills: 118.956,
        delta: -0.431,
        calendarYearSpan: 1,
      }),
    ).toBe("2024: 119.387 mills\n2025: 118.956 mills\nDown 0.431 mills");
    expect(
      formatMetroMillsChangeFactValue({
        fromYear: 2020,
        toYear: 2021,
        fromMills: 0,
        toMills: 126.336,
        delta: 126.336,
        calendarYearSpan: 1,
      }),
    ).toBe("2020: 0.000 mills\n2021: 126.336 mills\nUp 126.336 mills");
  });
});
