import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { parseRawInput } from "@/lib/parser";
import { calculateTotals, getPriceForGigAmount, formatCalculationResult, isGigAmountInPricingTable } from "@/lib/calculation";
import { authOptions } from "../auth/[...nextauth]";
import { resolvePricingEntries } from "@/lib/pricingCollections";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { rawText, pricingCollectionId } = req.body;

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "Invalid input: rawText is required" });
    }

    // Parse the raw input
    const { bundles, errors } = parseRawInput(rawText);

    if (bundles.length === 0) {
      return res.status(400).json({
        error: "No valid bundles found",
        parseErrors: errors,
      });
    }

    // Get selected pricing table or fallback to the active/default list
    const pricingSource = await resolvePricingEntries(session.user.id, pricingCollectionId);
    const pricingTable = pricingSource.entries;

    if (pricingTable.length === 0) {
      return res.status(400).json({
        error: "User pricing table not configured",
      });
    }

    // Separate bundles into valid (with pricing) and invalid (missing pricing)
    const pricingWarnings: Array<{ gigAmount: number; count: number; lines: Array<{ phoneNumber: string; gigAmount: number }> }> = [];
    const validBundles: typeof bundles = [];
    const missingPricingBundles: typeof bundles = [];

    for (const bundle of bundles) {
      if (isGigAmountInPricingTable(bundle.gigAmount, pricingTable)) {
        validBundles.push(bundle);
      } else {
        missingPricingBundles.push(bundle);
      }
    }

    // Group missing pricing by gig amount for reporting
    const missingByGigAmount = new Map<number, typeof missingPricingBundles>();
    for (const bundle of missingPricingBundles) {
      if (!missingByGigAmount.has(bundle.gigAmount)) {
        missingByGigAmount.set(bundle.gigAmount, []);
      }
      missingByGigAmount.get(bundle.gigAmount)!.push(bundle);
    }

    for (const [gigAmount, bundlesWithGig] of missingByGigAmount.entries()) {
      pricingWarnings.push({
        gigAmount,
        count: bundlesWithGig.length,
        lines: bundlesWithGig,
      });
    }

    // Add prices to valid bundles only
    const bundlesWithPrice = validBundles.map((bundle) => ({
      ...bundle,
      price: getPriceForGigAmount(bundle.gigAmount, pricingTable),
    }));

    // Calculate totals and produce serializable breakdown
    const calculations = calculateTotals(bundlesWithPrice, pricingTable);
    const formatted = formatCalculationResult(calculations);

    return res.status(200).json({
      success: true,
      bundles: validBundles,
      // Provide both raw numeric calculations and a formatted view for UI
      calculationsRaw: calculations,
      calculations: formatted,
      parseErrors: errors,
      pricingWarnings, // Alert user to missing pricing entries
      missingPricingCount: missingPricingBundles.length,
      itemCount: validBundles.length,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
