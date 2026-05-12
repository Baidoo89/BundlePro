/**
 * Calculation Engine
 * Calculates total gigs, total price based on user's pricing table
 */

export interface BundleItem {
  phoneNumber: string;
  gigAmount: number;
  price?: number;
}

export interface PricingEntry {
  gigAmount: number;
  price: number;
}

export interface CalculationResult {
  totalGigs: number;
  totalPrice: number;
  itemCount: number;
  averagePrice: number;
  breakdownByGigAmount: Map<number, { count: number; total: number }>;
}

/**
 * Finds the price for a given gig amount based on pricing table
 * Uses exact match or returns 0 if not found
 */
export function getPriceForGigAmount(
  gigAmount: number,
  pricingTable: PricingEntry[]
): number {
  const entry = pricingTable.find((p) => p.gigAmount === gigAmount);
  return entry ? entry.price : 0;
}

/**
 * Checks if a gig amount exists in the pricing table
 */
export function isGigAmountInPricingTable(
  gigAmount: number,
  pricingTable: PricingEntry[]
): boolean {
  return pricingTable.some((p) => p.gigAmount === gigAmount);
}

/**
 * Calculates total gigs, price, and statistics
 */
export function calculateTotals(
  bundles: BundleItem[],
  pricingTable: PricingEntry[]
): CalculationResult {
  const result: CalculationResult = {
    totalGigs: 0,
    totalPrice: 0,
    itemCount: bundles.length,
    averagePrice: 0,
    breakdownByGigAmount: new Map(),
  };

  if (bundles.length === 0) {
    return result;
  }

  // Calculate totals and breakdown
  for (const bundle of bundles) {
    result.totalGigs += bundle.gigAmount;

    const price = bundle.price ?? getPriceForGigAmount(bundle.gigAmount, pricingTable);
    result.totalPrice += price;

    // Breakdown by gig amount
    const key = bundle.gigAmount;
    const existing = result.breakdownByGigAmount.get(key) || { count: 0, total: 0 };
    existing.count += 1;
    existing.total += price;
    result.breakdownByGigAmount.set(key, existing);
  }

  result.averagePrice = result.itemCount > 0 ? result.totalPrice / result.itemCount : 0;

  return result;
}

/**
 * Formats calculation result for display
 */
export function formatCalculationResult(result: CalculationResult): {
  totalGigs: string;
  totalPrice: string;
  itemCount: string;
  averagePrice: string;
  breakdown: Array<{ gigAmount: number; count: number; total: number }>;
} {
  return {
    totalGigs: result.totalGigs.toFixed(2),
    totalPrice: result.totalPrice.toFixed(2),
    itemCount: result.itemCount.toString(),
    averagePrice: result.averagePrice.toFixed(2),
    breakdown: Array.from(result.breakdownByGigAmount.entries()).map(([gigAmount, data]) => ({
      gigAmount,
      count: data.count,
      total: data.total,
    })),
  };
}

/**
 * Validates pricing table
 */
export function isValidPricingTable(pricingTable: PricingEntry[]): boolean {
  if (pricingTable.length === 0) return false;

  return pricingTable.every(
    (entry) =>
      typeof entry.gigAmount === "number" &&
      entry.gigAmount > 0 &&
      typeof entry.price === "number" &&
      entry.price >= 0
  );
}

/**
 * Creates a pricing map for O(1) lookups
 */
export function createPricingMap(pricingTable: PricingEntry[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const entry of pricingTable) {
    map.set(entry.gigAmount, entry.price);
  }
  return map;
}
