import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import {
  findDuplicatesInPaste,
  separateDuplicates,
  checkLast24hRecords,
} from "@/lib/duplicates";
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
    const { bundles } = req.body;

    if (!bundles || !Array.isArray(bundles)) {
      return res.status(400).json({ error: "Invalid bundles array" });
    }

    // Check duplicates in paste
    const samePasteDuplicates = findDuplicatesInPaste(bundles);

    // Get unique phone numbers
    const uniquePhones = Array.from(new Set(bundles.map((b) => b.phoneNumber)));

    // Check last 24h records
    const last24hRecords = await checkLast24hRecords(uniquePhones, session.user.id);

    // Separate duplicates
    const result = separateDuplicates(bundles, samePasteDuplicates, last24hRecords);

    // Save duplicate records to database
    for (const flagged of result.flaggedDuplicates) {
      await prisma.duplicateRecord.create({
        data: {
          userId: session.user.id,
          phoneNumber: flagged.phoneNumber,
          count: flagged.count,
          duplicateType: flagged.type,
          lastServedAt: flagged.lastServedAt,
        },
      });
    }

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
