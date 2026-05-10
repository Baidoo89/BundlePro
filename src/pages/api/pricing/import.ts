import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

interface PricingImportRow {
  gigAmount: number | string;
  price: number | string;
  description?: string;
  isActive?: boolean;
}

function toNumber(value: number | string): number {
  if (typeof value === "number") {
    return value;
  }

  const normalized = value
    .replace(/[^\d.,-]/g, "")
    .replace(/,/g, "")
    .trim();

  if (!normalized || normalized === "-" || normalized === ".") {
    return Number.NaN;
  }

  return Number(normalized);
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
    const { entries, overwrite = true } = req.body as {
      entries?: PricingImportRow[];
      overwrite?: boolean;
      pricingCollectionId?: string;
      collectionName?: string;
    };
  const pricingCollectionId = typeof req.body?.pricingCollectionId === "string" ? req.body.pricingCollectionId : undefined;
  const collectionName = typeof req.body?.collectionName === "string" ? req.body.collectionName.trim() : "";


    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "entries must be a non-empty array" });
    }

    if (entries.length > 5000) {
      return res.status(400).json({ error: "Maximum 5000 rows per import" });
    }

    const normalizedByGigAmount = new Map<number, PricingImportRow>();
    const invalidRows: Array<{ index: number; reason: string }> = [];

    entries.forEach((entry, index) => {
      const gigAmount = toNumber(entry.gigAmount);
      const price = toNumber(entry.price);

      if (!Number.isFinite(gigAmount) || gigAmount <= 0) {
        invalidRows.push({ index: index + 1, reason: "Invalid gigAmount" });
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        invalidRows.push({ index: index + 1, reason: "Invalid price" });
        return;
      }

      normalizedByGigAmount.set(gigAmount, {
        gigAmount,
        price,
        description: entry.description?.trim() || undefined,
        isActive: entry.isActive ?? true,
      });
    });

    const validRows = Array.from(normalizedByGigAmount.values());

    if (validRows.length === 0) {
      return res.status(400).json({
        error: "No valid rows to import",
        invalidRows,
      });
    }

    if (pricingCollectionId) {
      const collection = await prisma.pricingCollection.findFirst({
        where: { id: pricingCollectionId, userId: session.user.id },
      });

      if (!collection) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const gigAmounts = validRows.map((row) => Number(row.gigAmount));
      const existingRows = await prisma.pricingCollectionEntry.findMany({
        where: {
          pricingCollectionId,
          gigAmount: { in: gigAmounts },
        },
        select: { id: true, gigAmount: true },
      });

      const existingGigAmounts = new Set(existingRows.map((row) => row.gigAmount));

      let createdCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const row of validRows) {
        const gigAmount = Number(row.gigAmount);
        const exists = existingGigAmounts.has(gigAmount);

        if (exists && !overwrite) {
          skippedCount += 1;
          continue;
        }

        if (exists) {
          await prisma.pricingCollectionEntry.update({
            where: {
              pricingCollectionId_gigAmount: {
                pricingCollectionId,
                gigAmount,
              },
            },
            data: {
              price: Number(row.price),
              description: row.description,
              isActive: row.isActive ?? true,
            },
          });
          updatedCount += 1;
        } else {
          await prisma.pricingCollectionEntry.create({
            data: {
              pricingCollectionId,
              gigAmount,
              price: Number(row.price),
              description: row.description,
              isActive: row.isActive ?? true,
            },
          });
          createdCount += 1;
        }
      }

      await prisma.pricingCollection.update({
        where: { id: pricingCollectionId },
        data: {
          name: collectionName || collection.name,
          sourceFileName: collectionName ? collection.sourceFileName : collection.sourceFileName,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        summary: {
          totalRows: entries.length,
          validRows: validRows.length,
          invalidRows: invalidRows.length,
          createdCount,
          updatedCount,
          skippedCount,
        },
        invalidRows,
      });
    }

    const gigAmounts = validRows.map((row) => Number(row.gigAmount));
    const existingRows = await prisma.priceList.findMany({
      where: {
        userId: session.user.id,
        gigAmount: { in: gigAmounts },
      },
      select: { id: true, gigAmount: true },
    });

    const existingGigAmounts = new Set(existingRows.map((row) => row.gigAmount));

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of validRows) {
      const gigAmount = Number(row.gigAmount);
      const exists = existingGigAmounts.has(gigAmount);

      if (exists && !overwrite) {
        skippedCount += 1;
        continue;
      }

      if (exists) {
        await prisma.priceList.update({
          where: {
            userId_gigAmount: {
              userId: session.user.id,
              gigAmount,
            },
          },
          data: {
            price: Number(row.price),
            description: row.description,
            isActive: row.isActive ?? true,
          },
        });
        updatedCount += 1;
      } else {
        await prisma.priceList.create({
          data: {
            userId: session.user.id,
            gigAmount,
            price: Number(row.price),
            description: row.description,
            isActive: row.isActive ?? true,
          },
        });
        createdCount += 1;
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        totalRows: entries.length,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        createdCount,
        updatedCount,
        skippedCount,
      },
      invalidRows,
    });
  } catch (error) {
    console.error("Error importing pricing rows:", error);
    return res.status(500).json({
      error: "Failed to import pricing rows",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
