import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { resolvePricingEntries } from "@/lib/pricingCollections";

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").replace(/[^\d.,-]/g, "").replace(/,/g, "").trim();
  return normalized ? Number(normalized) : Number.NaN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const pricingCollectionId = typeof req.query.pricingCollectionId === "string" ? req.query.pricingCollectionId : undefined;

  // GET - Retrieve pricing rows from a named collection or legacy table
  if (req.method === "GET") {
    try {
      const selected = await resolvePricingEntries(session.user.id, pricingCollectionId);
      return res.status(200).json({
        success: true,
        source: selected.source,
        pricingCollectionId: selected.collectionId,
        pricingCollectionName: selected.collectionName,
        priceLists: selected.entries,
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch price lists" });
    }
  }

  // POST - Create or update a pricing row in a collection (or legacy table if no collection is supplied)
  if (req.method === "POST") {
    try {
      const { gigAmount, price, description, isActive, pricingCollectionId: bodyCollectionId } = req.body;
      const effectiveCollectionId = typeof bodyCollectionId === "string" && bodyCollectionId.trim() ? bodyCollectionId.trim() : pricingCollectionId;
      const nextGigAmount = asNumber(gigAmount);
      const nextPrice = asNumber(price);

      if (!Number.isFinite(nextGigAmount) || !Number.isFinite(nextPrice)) {
        return res.status(400).json({ error: "gigAmount and price must be numbers" });
      }

      if (nextGigAmount <= 0 || nextPrice < 0) {
        return res.status(400).json({ error: "gigAmount must be positive and price must be non-negative" });
      }

      if (effectiveCollectionId) {
        const collection = await prisma.pricingCollection.findFirst({
          where: { id: effectiveCollectionId, userId: session.user.id },
        });

        if (!collection) {
          return res.status(403).json({ error: "Forbidden" });
        }

        const existing = await prisma.pricingCollectionEntry.findUnique({
          where: {
            pricingCollectionId_gigAmount: {
              pricingCollectionId: effectiveCollectionId,
              gigAmount: nextGigAmount,
            },
          },
        });

        if (existing) {
          const updated = await prisma.pricingCollectionEntry.update({
            where: { id: existing.id },
            data: {
              price: nextPrice,
              description,
              isActive: isActive ?? existing.isActive,
            },
          });

          return res.status(200).json({ success: true, message: "Price row updated", priceList: updated });
        }

        const created = await prisma.pricingCollectionEntry.create({
          data: {
            pricingCollectionId: effectiveCollectionId,
            gigAmount: nextGigAmount,
            price: nextPrice,
            description,
            isActive: isActive ?? true,
          },
        });

        return res.status(201).json({ success: true, message: "Price row created", priceList: created });
      }

      const existing = await prisma.priceList.findUnique({
        where: {
          userId_gigAmount: {
            userId: session.user.id,
            gigAmount: nextGigAmount,
          },
        },
      });

      if (existing) {
        const updated = await prisma.priceList.update({
          where: { id: existing.id },
          data: {
            price: nextPrice,
            description,
            isActive: isActive ?? existing.isActive,
            updatedAt: new Date(),
          },
        });

        return res.status(200).json({ success: true, message: "Price list updated", priceList: updated });
      }

      const created = await prisma.priceList.create({
        data: {
          userId: session.user.id,
          gigAmount: nextGigAmount,
          price: nextPrice,
          description,
          isActive: isActive ?? true,
        },
      });

      return res.status(201).json({ success: true, message: "Price list created", priceList: created });
    } catch (error) {
      console.error("Error saving price list:", error);
      return res.status(500).json({ error: "Failed to save price list", message: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  // PUT - Update existing price row by id
  if (req.method === "PUT") {
    try {
      const { id, gigAmount, price, description, isActive, pricingCollectionId: bodyCollectionId } = req.body;
      const effectiveCollectionId = typeof bodyCollectionId === "string" && bodyCollectionId.trim() ? bodyCollectionId.trim() : pricingCollectionId;

      if (!id) {
        return res.status(400).json({ error: "Price list id is required" });
      }

      const nextGigAmount = gigAmount !== undefined ? asNumber(gigAmount) : undefined;
      const nextPrice = price !== undefined ? asNumber(price) : undefined;

      if (effectiveCollectionId) {
        const collection = await prisma.pricingCollection.findFirst({
          where: { id: effectiveCollectionId, userId: session.user.id },
        });

        if (!collection) {
          return res.status(403).json({ error: "Forbidden" });
        }

        const existing = await prisma.pricingCollectionEntry.findUnique({ where: { id } });
        if (!existing || existing.pricingCollectionId !== effectiveCollectionId) {
          return res.status(403).json({ error: "Forbidden" });
        }

        const updated = await prisma.pricingCollectionEntry.update({
          where: { id },
          data: {
            gigAmount: nextGigAmount ?? existing.gigAmount,
            price: nextPrice ?? existing.price,
            description: description ?? existing.description,
            isActive: isActive ?? existing.isActive,
          },
        });

        return res.status(200).json({ success: true, message: "Price row updated", priceList: updated });
      }

      const existing = await prisma.priceList.findUnique({ where: { id } });
      if (!existing || existing.userId !== session.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updated = await prisma.priceList.update({
        where: { id },
        data: {
          gigAmount: nextGigAmount ?? existing.gigAmount,
          price: nextPrice ?? existing.price,
          description: description ?? existing.description,
          isActive: isActive ?? existing.isActive,
        },
      });

      return res.status(200).json({ success: true, message: "Price list updated", priceList: updated });
    } catch (error) {
      console.error("Error updating price list:", error);
      return res.status(500).json({ error: "Failed to update price list", message: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  // DELETE - Delete price row
  if (req.method === "DELETE") {
    try {
      const { id, pricingCollectionId: bodyCollectionId } = req.body;
      const effectiveCollectionId = typeof bodyCollectionId === "string" && bodyCollectionId.trim() ? bodyCollectionId.trim() : pricingCollectionId;

      if (!id) {
        return res.status(400).json({ error: "Price list id is required" });
      }

      if (effectiveCollectionId) {
        const existing = await prisma.pricingCollectionEntry.findUnique({ where: { id } });
        if (!existing) {
          return res.status(404).json({ error: "Price row not found" });
        }

        const collection = await prisma.pricingCollection.findFirst({
          where: { id: existing.pricingCollectionId, userId: session.user.id },
        });

        if (!collection || existing.pricingCollectionId !== effectiveCollectionId) {
          return res.status(403).json({ error: "Forbidden" });
        }

        await prisma.pricingCollectionEntry.delete({ where: { id } });
        return res.status(200).json({ success: true, message: "Price row deleted" });
      }

      const priceList = await prisma.priceList.findUnique({ where: { id } });
      if (!priceList || priceList.userId !== session.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await prisma.priceList.delete({ where: { id } });
      return res.status(200).json({ success: true, message: "Price list deleted" });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete price list" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
