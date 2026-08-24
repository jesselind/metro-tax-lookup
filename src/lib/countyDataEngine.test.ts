// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  COUNTY_DATA_ENGINE_SETTING,
  activeCountyDataEngine,
  activeCountyDataRoot,
} from "@/lib/countyDataEngine";
import {
  ENGINE_V2_DATA_ROOT,
  SHIPPING_DATA_ROOT,
} from "@/lib/countyDataPaths";

describe("countyDataEngine", () => {
  const envKey = "NEXT_PUBLIC_COUNTY_DATA_ENGINE";

  afterEach(() => {
    delete process.env[envKey];
    vi.unstubAllEnvs();
  });

  it("ships with v1 as the committed file default", () => {
    expect(COUNTY_DATA_ENGINE_SETTING).toBe("v1");
  });

  it("defaults to shipping /data when env is unset", () => {
    delete process.env[envKey];
    expect(activeCountyDataEngine()).toBe("v1");
    expect(activeCountyDataRoot()).toBe(SHIPPING_DATA_ROOT);
  });

  it("loads v2 root when env is v2", () => {
    process.env[envKey] = "v2";
    expect(activeCountyDataEngine()).toBe("v2");
    expect(activeCountyDataRoot()).toBe(ENGINE_V2_DATA_ROOT);
  });

  it("ignores invalid env values", () => {
    process.env[envKey] = "candidate";
    expect(activeCountyDataEngine()).toBe(COUNTY_DATA_ENGINE_SETTING);
  });

  it("ignores env override in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env[envKey] = "v2";
    expect(activeCountyDataEngine()).toBe("v1");
    expect(activeCountyDataRoot()).toBe(SHIPPING_DATA_ROOT);
  });
});
