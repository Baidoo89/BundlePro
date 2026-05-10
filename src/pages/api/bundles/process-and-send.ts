import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { calculateTotals, getPriceForGigAmount, formatCalculationResult } from "@/lib/calculation";
import { resolvePricingEntries } from "@/lib/pricingCollections";

interface BundleToProcess {
  phoneNumber: string;
  gigAmount: number;
  price?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { bundles, provider, calculateOnly, pricingTable, pricingCollectionId } = req.body;

    if (!bundles || !Array.isArray(bundles) || bundles.length === 0) {
      return res.status(400).json({ error: "Invalid bundles array" });
    }

    if (!calculateOnly && !provider) {
      return res.status(400).json({ error: "Provider is required" });
    }

    // If pricingTable is provided by client use it; otherwise fetch user's active pricing
    let pricingForCalc = Array.isArray(pricingTable) && pricingTable.length > 0 ? pricingTable : undefined;
    if (!pricingForCalc) {
      pricingForCalc = (await resolvePricingEntries(session.user.id, pricingCollectionId)).entries;
    }

    // Attach prices to bundles using pricingForCalc when price is missing
    const bundlesWithPrice: BundleToProcess[] = bundles.map((b: BundleToProcess) => ({
      ...b,
      price: b.price ?? getPriceForGigAmount(b.gigAmount, pricingForCalc as any),
    }));

    // If calculateOnly, return calculation result without creating order or bundles
    if (calculateOnly) {
      const calculations = calculateTotals(bundlesWithPrice as any, pricingForCalc as any);
      return res.status(200).json({ success: true, calculateOnly: true, calculations: formatCalculationResult(calculations), itemCount: bundlesWithPrice.length });
    }

    // Get API credentials for the provider
    const credentials = await prisma.aPICredential.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider,
        },
      },
    });

    if (!credentials || !credentials.isActive) {
      return res.status(400).json({
        error: `API credentials for ${provider} not configured or inactive`,
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalGigs: bundlesWithPrice.reduce((sum: number, b: BundleToProcess) => sum + b.gigAmount, 0),
        totalPrice: bundlesWithPrice.reduce((sum: number, b: BundleToProcess) => sum + (b.price || 0), 0),
        itemCount: bundlesWithPrice.length,
        status: "processing",
      },
    });

    // Process each bundle
    const results: any[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const bundle of bundlesWithPrice) {
      try {
        // Make API request to provider
        const response = await fetch(credentials.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${credentials.apiKey}`,
          },
          body: JSON.stringify({
            phoneNumber: bundle.phoneNumber,
            gigAmount: bundle.gigAmount,
          }),
        });

        if (!response.ok) {
          throw new Error(`Provider API error: ${response.status}`);
        }

        const data = await response.json();
        const transactionId = data.transactionId || `TXN-${Date.now()}-${Math.random()}`;

        // Create bundle record
        await prisma.bundle.create({
          data: {
            userId: session.user.id,
            phoneNumber: bundle.phoneNumber,
            gigAmount: bundle.gigAmount,
            price: bundle.price ?? 0,
            provider,
            transactionId,
            status: "completed",
            orderId: order.id,
            processedAt: new Date(),
          },
        });

        results.push({
          phoneNumber: bundle.phoneNumber,
          gigAmount: bundle.gigAmount,
          status: "success",
          transactionId,
        });

        successCount++;
      } catch (error) {
        failureCount++;

        // Create failed bundle record
        await prisma.bundle.create({
          data: {
            userId: session.user.id,
            phoneNumber: bundle.phoneNumber,
            gigAmount: bundle.gigAmount,
            price: bundle.price ?? 0,
            provider,
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            orderId: order.id,
            processedAt: new Date(),
          },
        });

        results.push({
          phoneNumber: bundle.phoneNumber,
          gigAmount: bundle.gigAmount,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: failureCount === 0 ? "completed" : failureCount === bundlesWithPrice.length ? "failed" : "completed",
        processedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      totalProcessed: bundlesWithPrice.length,
      successCount,
      failureCount,
      results,
    });
  } catch (error) {
    console.error("Error processing bundles:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

