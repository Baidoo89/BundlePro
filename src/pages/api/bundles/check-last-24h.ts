import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { phoneNumbers, userId } = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ error: "Invalid phoneNumbers array" });
    }

    // Verify the userId matches the session user
    if (userId !== session.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Get last 24 hours timestamp
    const last24hDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find bundles processed in last 24 hours
    const records = await prisma.bundle.findMany({
      where: {
        userId: session.user.id,
        phoneNumber: { in: phoneNumbers },
        status: "completed",
        processedAt: { gte: last24hDate },
      },
      select: {
        phoneNumber: true,
        processedAt: true,
      },
      distinct: ["phoneNumber"],
    });

    return res.status(200).json({
      success: true,
      records,
      checkTime: new Date(),
    });
  } catch (error) {
    console.error("Error checking last 24h records:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
