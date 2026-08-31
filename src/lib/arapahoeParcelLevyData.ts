// Metro Tax Lookup - Arapahoe County
// Copyright (C) 2026 Jesse Lind
// SPDX-License-Identifier: AGPL-3.0-or-later
// See LICENSE for full terms or https://www.gnu.org/licenses/agpl-3.0.html

/**
 * @deprecated Import from `@/lib/countyParcelLevyData` instead.
 *
 * Compatibility barrel: same symbols as before Phase 10. Implementation lives in
 * `countyParcelLevyData.ts`. Keep until forks and docs finish migrating.
 */

export type {
  CountyDolaMatch as ArapahoeDolaMatch,
  CountyLevyStack as ArapahoeLevyStack,
  CountyLevyStackLine as ArapahoeLevyStackLine,
  CountyLevyStacksFile as ArapahoeLevyStacksFile,
  CountyParcelRecordByPinFile as ArapahoeParcelRecordByPinFile,
  CountyParcelRecordRow as ArapahoeParcelRecordRow,
  CountyPinToTagFile as ArapahoePinToTagFile,
  CountyPinToTagRow as ArapahoePinToTagRow,
} from "./countyParcelLevyData";

export {
  PARCEL_RECORD_SHARD_PREFIX_LENGTH,
  COUNTY_ACCOUNT_MAP_CACHE_BUST,
  COUNTY_PARCEL_RECORD_CACHE_BUST as ARAPAHOE_PARCEL_RECORD_CACHE_BUST,
  accountIdLookupCandidates,
  ainLookupCandidates,
  clearCountyParcelDataCache as clearArapahoeParcelDataCache,
  displayMartAuthorityName,
  fetchCountyLevyStacksJson as fetchArapahoeLevyStacksJson,
  fetchCountyParcelRecordForPin as fetchArapahoeParcelRecordForPin,
  fetchCountyPinToTagJson as fetchArapahoePinToTagJson,
  formatPropertyClassificationDisplay,
  formatTaxAreaShortDescrDisplay,
  getAinToPinIndex,
  getLastCountyLevyStacksFetchFailureDetail as getLastArapahoeLevyStacksFetchFailureDetail,
  getLastCountyPinToTagFetchFailureDetail as getLastArapahoePinToTagFetchFailureDetail,
  lookupParcelRecordRow,
  looksLikeAinInput,
  looksLikeParcelIdInput,
  looksLikePinOnlyInput,
  parcelRecordShardPrefixes,
  parcelRecordShardUrl,
  pinLookupCandidates,
  resolvePinKeyFromParcelIdInput,
  validateCountyLevyStacksFile as validateArapahoeLevyStacksFile,
  validateCountyPinToTagFile as validateArapahoePinToTagFile,
} from "./countyParcelLevyData";

export type {
  ParcelRecordBuilding,
  ParcelRecordBuildingArea,
  ParcelRecordBuildingAttribute,
  ParcelRecordLandLine,
  ParcelRecordPermit,
  ParcelRecordTransfer,
} from "./countyParcelLevyData";
