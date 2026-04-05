/**
 * Offline situs -> PIN lookup built by tools/build_arapahoe_parcel_levy_index.py
 * (public/data/arapahoe-situs-to-pins.json).
 *
 * Normalization must stay in sync with _STREET_* helpers in that script.
 */

export type ArapahoeSitusPinHit = {
  pin: string;
  label: string;
};

export type ArapahoeSitusToPinsFile = {
  snapshot: {
    bundledAsOf: string;
    source: string;
    taxYear?: string | null;
    lookupNote?: string;
  };
  lookupVersion: number;
  entryCount: number;
  byKey: Record<string, ArapahoeSitusPinHit[]>;
};

/** HTML maxlength + abuse caps (input validation). */
export const SITUS_INPUT_MAX_LEN = {
  streetNumber: 24,
  numberSuffix: 16,
  streetName: 200,
  unit: 40,
} as const;

/**
 * Mobile autofill often dumps the full first address line into the first text field.
 * Allow a longer capture on that field; we split into number / suffix / street on blur or search.
 */
export const SITUS_AUTOFILL_LINE1_MAX_LEN = 160;

/**
 * When a single field contains a full first line (e.g. "123 Main St", "3721 1/2 Holly"),
 * split into situs parts. Returns null if the string does not match that pattern.
 */
export function trySplitSitusAutofillLine(raw: string): {
  streetNumber: string;
  streetNumberSuffix: string;
  streetName: string;
} | null {
  const trimmed = raw.trim();
  if (trimmed.length > SITUS_AUTOFILL_LINE1_MAX_LEN + 64) return null;
  if (!trimmed.includes(" ")) return null;
  const frac = trimmed.match(/^(\d+)\s+(\d\s*\/\s*\d)\s+(.+)$/);
  if (frac) {
    const streetName = frac[3].trim();
    if (streetName.length < 1 || !/[A-Za-z]/.test(streetName)) return null;
    return {
      streetNumber: frac[1],
      streetNumberSuffix: frac[2].replace(/\s*\/\s*/, "/"),
      streetName,
    };
  }
  const m = trimmed.match(/^(\d+)\s+(.+)$/);
  if (!m) return null;
  const streetName = m[2].trim();
  if (streetName.length < 1 || !/[A-Za-z]/.test(streetName)) return null;
  return {
    streetNumber: m[1],
    streetNumberSuffix: "",
    streetName,
  };
}

function normAddrCompareKey(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/,\s*$/g, "")
    .toLowerCase();
}

/**
 * True when the unit field contains a full first address line (typical autofill mistake)
 * or the same text as number (+ optional suffix) + street after normalization.
 */
export function situsUnitLooksLikeStreetAutofillDuplicate(
  unitRaw: string,
  streetNumber: string,
  streetNumberSuffix: string,
  streetName: string,
): boolean {
  const u = unitRaw.trim();
  if (!u) return false;
  if (trySplitSitusAutofillLine(u) != null) return true;
  const name = streetName.trim();
  if (!name) return false;
  const num = streetNumber.trim();
  const suf = streetNumberSuffix.trim();
  const parts = [num];
  if (suf.length > 0) parts.push(suf);
  parts.push(name);
  const combined = normAddrCompareKey(parts.join(" "));
  return combined.length > 0 && normAddrCompareKey(u) === combined;
}

export type SitusResolvedForLookup = {
  num: string;
  suffix: string;
  nameRaw: string;
  unitTrim: string;
};

/**
 * Pure normalization before PIN lookup: split combined line1 from the number box,
 * drop unit values that duplicate the street line (mobile autofill quirk).
 */
export function resolveSitusFieldsForLookup(
  streetNumber: string,
  streetNumberSuffix: string,
  streetName: string,
  unit: string,
): {
  resolved: SitusResolvedForLookup;
  syncNumberFieldsToState: boolean;
  clearUnitToState: boolean;
} {
  const rawNumFromState = streetNumber.trim();
  let num = rawNumFromState;
  let suffix = streetNumberSuffix.trim();
  let nameRaw = streetName.trim();
  let unitTrim = unit.trim();
  let syncNumberFieldsToState = false;
  let clearUnitToState = false;

  if (nameRaw.length === 0) {
    const s = trySplitSitusAutofillLine(num);
    if (s) {
      num = s.streetNumber;
      suffix = s.streetNumberSuffix;
      nameRaw = s.streetName;
      syncNumberFieldsToState = true;
      if (unitTrim === rawNumFromState && rawNumFromState.length > 0) {
        unitTrim = "";
        clearUnitToState = true;
      }
    }
  }

  if (situsUnitLooksLikeStreetAutofillDuplicate(unitTrim, num, suffix, nameRaw)) {
    unitTrim = "";
    clearUnitToState = true;
  }

  return {
    resolved: { num, suffix, nameRaw, unitTrim },
    syncNumberFieldsToState,
    clearUnitToState,
  };
}

/**
 * Blur handler helper: split combined address-line1 only when it would not overwrite
 * intentional multi-field entry.
 */
export function trySitusAutofillBlurSplit(
  rawFromInput: string,
  mode: "number" | "street",
  current: {
    streetNumber: string;
    streetNumberSuffix: string;
    streetName: string;
  },
): ReturnType<typeof trySplitSitusAutofillLine> {
  const sn = current.streetNumber.trim();
  const suf = current.streetNumberSuffix.trim();
  const nm = current.streetName.trim();
  if (mode === "number") {
    if (nm !== "") return null;
  } else if (sn !== "" || suf !== "") {
    return null;
  }
  return trySplitSitusAutofillLine(rawFromInput);
}

const MAX_PIN_CHARS = 64;
const MAX_LABEL_CHARS = 4000;

const UNSAFE_JSON_RECORD_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

function isPinHitRecord(x: unknown): x is ArapahoeSitusPinHit {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.pin !== "string" || typeof o.label !== "string") return false;
  if (o.pin.length > MAX_PIN_CHARS || o.label.length > MAX_LABEL_CHARS) {
    return false;
  }
  return true;
}

function snapshotFromUnknown(x: unknown): ArapahoeSitusToPinsFile["snapshot"] {
  if (!x || typeof x !== "object" || Array.isArray(x)) {
    return { bundledAsOf: "", source: "" };
  }
  const o = x as Record<string, unknown>;
  const taxYear = o.taxYear;
  const lookupNote = o.lookupNote;
  return {
    bundledAsOf: typeof o.bundledAsOf === "string" ? o.bundledAsOf : "",
    source: typeof o.source === "string" ? o.source : "",
    taxYear:
      typeof taxYear === "string" || taxYear === null ? taxYear : undefined,
    lookupNote: typeof lookupNote === "string" ? lookupNote : undefined,
  };
}

/**
 * Validates bundled JSON shape, copies `byKey` into a null-prototype map, and skips
 * malformed rows — defense in depth if a static file were replaced or corrupted.
 */
export function validateArapahoeSitusToPinsPayload(
  data: unknown,
): ArapahoeSitusToPinsFile | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const root = data as Record<string, unknown>;
  const rawByKey = root.byKey;
  if (
    rawByKey === null ||
    typeof rawByKey !== "object" ||
    Array.isArray(rawByKey)
  ) {
    return null;
  }
  const safeByKey: Record<string, ArapahoeSitusPinHit[]> = Object.create(null);
  for (const key of Object.keys(rawByKey)) {
    if (UNSAFE_JSON_RECORD_KEYS.has(key)) continue;
    const bucket = (rawByKey as Record<string, unknown>)[key];
    if (!Array.isArray(bucket)) return null;
    const hits: ArapahoeSitusPinHit[] = [];
    for (const item of bucket) {
      if (isPinHitRecord(item)) hits.push({ pin: item.pin, label: item.label });
    }
    safeByKey[key] = hits;
  }
  const lookupVersion =
    typeof root.lookupVersion === "number" && Number.isFinite(root.lookupVersion)
      ? root.lookupVersion
      : 0;
  const entryCount =
    typeof root.entryCount === "number" && Number.isFinite(root.entryCount)
      ? root.entryCount
      : 0;
  return {
    snapshot: snapshotFromUnknown(root.snapshot),
    lookupVersion,
    entryCount,
    byKey: safeByKey,
  };
}

const STREET_DIR_TOKENS = new Set([
  "N",
  "S",
  "E",
  "W",
  "NE",
  "NW",
  "SE",
  "SW",
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "NORTHEAST",
  "NORTHWEST",
  "SOUTHEAST",
  "SOUTHWEST",
]);

const STREET_TYPE_TOKENS = new Set([
  "ST",
  "STREET",
  "AVE",
  "AVENUE",
  "RD",
  "ROAD",
  "BLVD",
  "BOULEVARD",
  "DR",
  "DRIVE",
  "LN",
  "LANE",
  "CT",
  "COURT",
  "CIR",
  "CIRCLE",
  "WAY",
  "PL",
  "PLACE",
  "PKWY",
  "PARKWAY",
  "TRL",
  "TRAIL",
  "LOOP",
  "TER",
  "TERR",
  "TERRACE",
  "TPKE",
  "TURNPIKE",
  "HWY",
  "HIGHWAY",
  "BL",
  "PATH",
  "PLZ",
  "PLAZA",
  "RUN",
  "COVE",
  "PASS",
  "ALLEY",
  "ALY",
  "BEND",
  "XING",
  "CROSSING",
  "POINT",
  "PT",
  "COMMONS",
  "MALL",
]);

export function normalizeStreetNameKey(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (!s) return "";
  const tokens = s.split(/[^\w]+/).filter(Boolean);
  const kept: string[] = [];
  for (const t of tokens) {
    if (STREET_DIR_TOKENS.has(t) || STREET_TYPE_TOKENS.has(t)) continue;
    kept.push(t);
  }
  return kept.join(" ");
}

/** Merges primary (mart SAAddrNumber) + optional suffix (mart SAStreetNumberSfx, e.g. 1/2). */
export function normalizeStreetNumberKey(primary: string, rangeOrSuffix: string): string {
  const a = primary.trim();
  const b = rangeOrSuffix.trim();
  const merged = [a, b].filter(Boolean).join(" ");
  if (!merged) return "";
  const mergedU = merged.toUpperCase().replace(/\s+/g, "");
  return mergedU
    .split("")
    .filter((c) => c >= "0" && c <= "9" || c === "/" || c === "-")
    .join("");
}

export function normalizeUnitKey(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (!s) return "";
  return s.replace(/[^A-Z0-9]/g, "");
}

export function buildSitusLookupKey(
  streetNumber: string,
  numberSuffix: string,
  streetName: string,
  unit: string,
): string {
  const num = normalizeStreetNumberKey(streetNumber, numberSuffix);
  const name = normalizeStreetNameKey(streetName);
  const u = normalizeUnitKey(unit);
  if (!num || !name) return "";
  return `${num}|${name}|${u}`;
}

let situsCache: Promise<ArapahoeSitusToPinsFile | null> | null = null;

export function fetchArapahoeSitusToPinsJson(): Promise<ArapahoeSitusToPinsFile | null> {
  if (!situsCache) {
    situsCache = fetch("/data/arapahoe-situs-to-pins.json", {
      credentials: "same-origin",
    })
      .then(async (r) => {
        if (!r.ok) return null;
        let parsed: unknown;
        try {
          parsed = await r.json();
        } catch {
          return null;
        }
        return validateArapahoeSitusToPinsPayload(parsed);
      })
      .catch(() => null);
  }
  return situsCache;
}

export function clearArapahoeSitusDataCache(): void {
  situsCache = null;
}

export function lookupPinsBySitusKey(
  file: ArapahoeSitusToPinsFile,
  key: string,
): ArapahoeSitusPinHit[] {
  const hits = file.byKey[key];
  return hits ? [...hits] : [];
}
