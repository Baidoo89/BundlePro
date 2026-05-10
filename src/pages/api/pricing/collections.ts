import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const collections = await prisma.pricingCollection.findMany({
        where: { userId: session.user.id },
        include: {
          entries: {
            orderBy: { gigAmount: "asc" },
            select: {
              id: true,
              gigAmount: true,
              price: true,
              description: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      });

      return res.status(200).json({ success: true, collections });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch pricing collections" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, sourceFileName, isActive = true } = req.body;
      const collectionName = String(name || "").trim();
      if (!collectionName) {
        return res.status(400).json({ error: "Collection name is required" });
      }

      if (isActive) {
        await prisma.pricingCollection.updateMany({
          where: { userId: session.user.id, isActive: true },
          data: { isActive: false },
        });
      }

      const created = await prisma.pricingCollection.create({
        data: {
          userId: session.user.id,
          name: collectionName,
          sourceFileName: sourceFileName ? String(sourceFileName).trim() : null,
          isActive: Boolean(isActive),
        },
      });

      return res.status(201).json({ success: true, collection: created });
    } catch (error) {
      console.error("Error creating pricing collection:", error);
      return res.status(500).json({ error: "Failed to create pricing collection" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { id, name, sourceFileName, isActive } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Collection id is required" });
      }

      const existing = await prisma.pricingCollection.findFirst({ where: { id, userId: session.user.id } });
      if (!existing) {
        return res.status(404).json({ error: "Collection not found" });
      }

      if (isActive === true) {
        await prisma.pricingCollection.updateMany({
          where: { userId: session.user.id, isActive: true },
          data: { isActive: false },
        });
      }

      const updated = await prisma.pricingCollection.update({
        where: { id },
        data: {
          name: typeof name === "string" && name.trim() ? name.trim() : existing.name,
          sourceFileName: sourceFileName === undefined ? existing.sourceFileName : sourceFileName ? String(sourceFileName).trim() : null,
          isActive: typeof isActive === "boolean" ? isActive : existing.isActive,
        },
      });

      return res.status(200).json({ success: true, collection: updated });
    } catch (error) {
      console.error("Error updating pricing collection:", error);
      return res.status(500).json({ error: "Failed to update pricing collection" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Collection id is required" });
      }

      const existing = await prisma.pricingCollection.findFirst({ where: { id, userId: session.user.id } });
      if (!existing) {
        return res.status(404).json({ error: "Collection not found" });
      }

      await prisma.pricingCollection.delete({ where: { id } });
      return res.status(200).json({ success: true, message: "Collection deleted" });
    } catch (error) {
      console.error("Error deleting pricing collection:", error);
      return res.status(500).json({ error: "Failed to delete pricing collection" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
