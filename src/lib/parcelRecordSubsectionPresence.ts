// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

import type { CountyParcelRecordRow } from "@/lib/countyParcelLevyData";
import { isBusinessPersonalPropertyAccount } from "@/lib/situsMultiPinChooser";

/**
 * Which Property details subsections are mounted for a parcel record.
 * Used to curate locked-report jump membership (flat list; omit unmounted).
 */
export type ParcelRecordSubsectionPresence = {
  appraisedAssessed: boolean;
  saleHistory: boolean;
  buildings: boolean;
  area: boolean;
  landLine: boolean;
  permits: boolean;
};

function buildingHasDetail(building: {
  attributes?: { label: string; value: string }[] | null;
  areas?: unknown[] | null;
  totalArea?: string | null;
}): boolean {
  return (
    (building.attributes?.length ?? 0) > 0 ||
    (building.areas?.length ?? 0) > 0 ||
    Boolean((building.totalArea ?? "").trim())
  );
}

/**
 * Inspect a parcel-record row and report which extended subsections will mount.
 * BPP: values only. Empty building/land content omits those jumps. Permits only
 * when the county shipped at least one permit row.
 */
export function parcelRecordSubsectionPresence(
  record: CountyParcelRecordRow | null,
  options?: { businessPersonal?: boolean },
): ParcelRecordSubsectionPresence {
  const empty: ParcelRecordSubsectionPresence = {
    appraisedAssessed: false,
    saleHistory: false,
    buildings: false,
    area: false,
    landLine: false,
    permits: false,
  };
  if (record == null) return empty;

  const isBpp =
    options?.businessPersonal === true ||
    isBusinessPersonalPropertyAccount({
      taxRollDescr: record.taxRollDescr,
      propertyClassDescr: record.propertyClassDescr,
    });

  if (isBpp) {
    return { ...empty, appraisedAssessed: true };
  }

  const buildings = record.buildings ?? [];
  const buildingsWithDetail = buildings.filter(buildingHasDetail);
  let showBuildings = false;
  let showArea = false;
  for (const building of buildingsWithDetail) {
    if ((building.attributes?.length ?? 0) > 0) showBuildings = true;
    if (
      (building.areas?.length ?? 0) > 0 ||
      Boolean((building.totalArea ?? "").trim())
    ) {
      showArea = true;
    }
  }

  return {
    appraisedAssessed: true,
    saleHistory: true,
    buildings: showBuildings,
    area: showArea,
    landLine: (record.landLines?.length ?? 0) > 0,
    permits: (record.permits?.length ?? 0) > 0,
  };
}
