/** Prices and totals are stored as REAL; computed amounts are rounded to 2 decimals before leaving the API. */
export function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}
