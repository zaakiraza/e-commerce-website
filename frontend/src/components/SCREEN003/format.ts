/** Format a numeric price for display, e.g. 12.5 -> "$12.50". */
export function formatPrice(value: number): string {
  return `$${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;
}
