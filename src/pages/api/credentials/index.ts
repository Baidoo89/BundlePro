import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET - Retrieve all API credentials
  if (req.method === "GET") {
    try {
      const credentials = await prisma.aPICredential.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          provider: true,
          endpoint: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          // Don't return apiKey and apiSecret in GET
        },
      });

      return res.status(200).json({ success: true, credentials });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch credentials" });
    }
  }

  // POST - Create or update API credentials
  if (req.method === "POST") {
    try {
      const { provider, apiKey, apiSecret, endpoint, isActive } = req.body;

      if (!provider || !apiKey || !endpoint) {
        return res.status(400).json({
          error: "provider, apiKey, and endpoint are required",
        });
      }

      const existing = await prisma.aPICredential.findUnique({
        where: {
          userId_provider: {
            userId: session.user.id,
            provider,
          },
        },
      });

      if (existing) {
        // Update
        const updated = await prisma.aPICredential.update({
          where: { id: existing.id },
          data: {
            apiKey,
            apiSecret,
            endpoint,
            isActive: isActive ?? existing.isActive,
            updatedAt: new Date(),
          },
        });

        return res.status(200).json({
          success: true,
          message: "Credentials updated",
          credential: {
            id: updated.id,
            provider: updated.provider,
            endpoint: updated.endpoint,
            isActive: updated.isActive,
          },
        });
      } else {
        // Create
        const created = await prisma.aPICredential.create({
          data: {
            userId: session.user.id,
            provider,
            apiKey,
            apiSecret,
            endpoint,
            isActive: isActive ?? false,
          },
        });

        return res.status(201).json({
          success: true,
          message: "Credentials created",
          credential: {
            id: created.id,
            provider: created.provider,
            endpoint: created.endpoint,
            isActive: created.isActive,
          },
        });
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
      return res.status(500).json({
        error: "Failed to save credentials",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // DELETE - Delete API credentials
  if (req.method === "DELETE") {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Credential id is required" });
      }

      // Verify ownership
      const credential = await prisma.aPICredential.findUnique({
        where: { id },
      });

      if (!credential || credential.userId !== session.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await prisma.aPICredential.delete({ where: { id } });

      return res.status(200).json({
        success: true,
        message: "Credentials deleted",
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete credentials" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
