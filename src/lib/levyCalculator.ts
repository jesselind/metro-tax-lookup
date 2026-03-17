/**
 * Debt share of total property tax (one decimal place).
 * Formula: (metroDebtMills / totalMills) * 100.
 */
export function calculateDebtPercentage(
  totalMillLevy: number,
  metroDebtMillLevy: number
): { percentage: number } {
  const safeTotal = Number.isFinite(totalMillLevy) ? totalMillLevy : 0;
  const safeDebt = Number.isFinite(metroDebtMillLevy) ? metroDebtMillLevy : 0;
  const percentage =
    safeTotal > 0 ? Math.round((safeDebt / safeTotal) * 1000) / 10 : 0;
  return { percentage };
}

