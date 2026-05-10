export const CURRENCY_SYMBOL = "GH₵";

export function formatGHS(amount: number, fractionDigits = 2): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY_SYMBOL}${safeAmount.toLocaleString("en-GH", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}
