const USD_WHOLE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatUsdWhole(n: number): string {
  return USD_WHOLE.format(n);
}
