/** Formats a taka amount, e.g. 1500 -> "৳1,500". */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}৳${Math.abs(Math.round(amount)).toLocaleString('en-US')}`;
}
