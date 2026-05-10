import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]";
import { resolvePricingEntries } from "@/lib/pricingCollections";

type PricingExportRow = {
  gigAmount: number;
  price: number;
  description: string;
  isActive: boolean;
};

function escapeCsv(value: string | number | boolean): string {
  const stringValue = String(value ?? "");
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const format = String(req.query.format || "xlsx").toLowerCase();
    const template = String(req.query.template || "false").toLowerCase() === "true";
    const pricingCollectionId = typeof req.query.pricingCollectionId === "string" ? req.query.pricingCollectionId : undefined;

    if (format !== "xlsx" && format !== "csv") {
      return res.status(400).json({ error: "format must be csv or xlsx" });
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const priceRows: PricingExportRow[] = template
      ? [
          { gigAmount: 1, price: 120, description: "1GB Daily", isActive: true },
          { gigAmount: 2, price: 230, description: "2GB Weekly", isActive: true },
        ]
      : (
          await resolvePricingEntries(session.user.id, pricingCollectionId)
        ).entries.map((row) => ({
          gigAmount: row.gigAmount,
          price: row.price,
          description: row.description || "",
          isActive: row.isActive ?? true,
        }));

    const filenameBase = template ? `pricing-template-${timestamp}` : `pricing-export-${timestamp}`;

    if (format === "csv") {
      const header = ["gigAmount", "price", "description", "isActive"];
      const lines = [
        header.join(","),
        ...priceRows.map((row) =>
          [
            escapeCsv(row.gigAmount),
            escapeCsv(row.price),
            escapeCsv(row.description),
            escapeCsv(row.isActive),
          ].join(",")
        ),
      ];

      const csv = lines.join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=${filenameBase}.csv`);
      return res.status(200).send(csv);
    }

    const worksheet = XLSX.utils.json_to_sheet(priceRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pricing");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filenameBase}.xlsx`);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Error exporting pricing rows:", error);
    return res.status(500).json({
      error: "Failed to export pricing rows",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
