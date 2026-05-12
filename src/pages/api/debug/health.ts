import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json");

  try {
    // Check environment variables
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✓ Set" : "✗ Missing",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "Not set",
      NODE_ENV: process.env.NODE_ENV,
    };

    // Test database connection
    const dbTest = await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ok",
      environment: envCheck,
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      error: String(error),
    });
  }
}
