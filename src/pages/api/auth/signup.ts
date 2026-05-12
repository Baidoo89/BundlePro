import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set JSON content type for all responses
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL not set");
      return res.status(500).json({
        error: "Database not configured",
        message: "DATABASE_URL environment variable is missing",
      });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // In production, hash this with bcrypt
      },
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Full error:", JSON.stringify(error));
    return res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
      details: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
}
