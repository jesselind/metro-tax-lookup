/** Positive finite assessed value for dollar estimates; otherwise null (no fake $0). */
export function parcelAssessedForDollarEstimate(
  v: number | null | undefined,
): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return v;
}

/** Colorado-style: annual tax ≈ assessed × (mills / 1000), rounded to whole dollars. */
export function annualTaxDollarsFromAssessedMills(
  assessed: number,
  mills: number,
): number {
  return Math.round(assessed * (mills / 1000));
}
