import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { parseRawInput } from "@/lib/parser";
import { calculateTotals, getPriceForGigAmount, formatCalculationResult } from "@/lib/calculation";
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

    // Add prices to bundles
    const bundlesWithPrice = bundles.map((bundle) => ({
      ...bundle,
      price: getPriceForGigAmount(bundle.gigAmount, pricingTable),
    }));

    // Calculate totals and produce serializable breakdown
    const calculations = calculateTotals(bundlesWithPrice, pricingTable);
    const formatted = formatCalculationResult(calculations);

    return res.status(200).json({
      success: true,
      bundles,
      // Provide both raw numeric calculations and a formatted view for UI
      calculationsRaw: calculations,
      calculations: formatted,
      parseErrors: errors,
      itemCount: bundles.length,
    });
  } catch (error) {
    console.error("Parse error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
