/**
 * Duplicate Checking Logic
 * Identifies duplicates within the same paste and across 24-hour period
 */

export interface DuplicateCheckResult {
  cleanOrders: Array<{ phoneNumber: string; gigAmount: number }>;
  flaggedDuplicates: Array<{
    phoneNumber: string;
    count: number;
    type: "same_paste" | "last_24h" | "both";
    lastServedAt?: Date;
  }>;
  statistics: {
    totalItems: number;
    cleanItems: number;
    duplicateItems: number;
    duplicateCount: number;
  };
}

/**
 * Finds duplicates within the same paste
 */
export function findDuplicatesInPaste(
  bundles: Array<{ phoneNumber: string; gigAmount: number }>
): Map<string, number> {
  const phoneMap = new Map<string, number>();

  for (const bundle of bundles) {
    const count = phoneMap.get(bundle.phoneNumber) || 0;
    phoneMap.set(bundle.phoneNumber, count + 1);
  }

  // Return only duplicates (count > 1)
  const duplicates = new Map<string, number>();
  for (const [phone, count] of phoneMap.entries()) {
    if (count > 1) {
      duplicates.set(phone, count);
    }
  }

  return duplicates;
}

/**
 * Separates clean orders from flagged duplicates
 */
export function separateDuplicates(
  bundles: Array<{ phoneNumber: string; gigAmount: number }>,
  duplicatePhones: Map<string, number>,
  last24hRecords?: Map<string, Date>
): DuplicateCheckResult {
  const cleanOrders: Array<{ phoneNumber: string; gigAmount: number }> = [];
  const flaggedMap = new Map<string, { count: number; types: Set<string>; lastServedAt?: Date }>();
  const seenSamePaste = new Set<string>();

  // Process each bundle
  for (const bundle of bundles) {
    const isDuplicateInPaste = duplicatePhones.has(bundle.phoneNumber);
    const isDuplicateInLast24h = last24hRecords?.has(bundle.phoneNumber) ?? false;

    // If duplicate in the same paste, keep the first occurrence and flag the rest
    if (isDuplicateInPaste) {
      if (!seenSamePaste.has(bundle.phoneNumber)) {
        seenSamePaste.add(bundle.phoneNumber);
        cleanOrders.push(bundle);
        continue;
      }

      const existing = flaggedMap.get(bundle.phoneNumber) || {
        count: 0,
        types: new Set<string>(),
      };
      existing.count += 1;
      existing.types.add("same_paste");
      flaggedMap.set(bundle.phoneNumber, existing);
      continue;
    }

    // If only a last-24h hit, flag it but still include in cleanOrders (user may want to process)
    if (isDuplicateInLast24h) {
      const existing = flaggedMap.get(bundle.phoneNumber) || {
        count: 0,
        types: new Set<string>(),
      };
      existing.count += 1;
      existing.types.add("last_24h");
      if (last24hRecords) existing.lastServedAt = last24hRecords.get(bundle.phoneNumber);
      flaggedMap.set(bundle.phoneNumber, existing);
      // keep in cleanOrders so processing can still run; UI can decide whether to skip
      cleanOrders.push(bundle);
      continue;
    }

    // Otherwise it's clean
    cleanOrders.push(bundle);
  }

  // Convert flaggedMap to array
  const flaggedDuplicates = Array.from(flaggedMap.entries()).map(([phoneNumber, data]) => ({
    phoneNumber,
    count: data.count,
    type: Array.from(data.types).join("_") as "same_paste" | "last_24h" | "both",
    lastServedAt: data.lastServedAt,
  }));

  // Calculate statistics
  const statistics = {
    totalItems: bundles.length,
    cleanItems: cleanOrders.length,
    duplicateItems: bundles.length - cleanOrders.length,
    duplicateCount: flaggedDuplicates.length,
  };

  return {
    cleanOrders,
    flaggedDuplicates,
    statistics,
  };
}

/**
 * Checks for orders served in the last 24 hours
 * Returns a map of phoneNumber -> lastServedDate
 */
export async function checkLast24hRecords(
  phoneNumbers: string[],
  userId: string
): Promise<Map<string, Date>> {
  try {
    // Server-side: query DB directly instead of calling a relative API route
    // Import prisma here to avoid circular imports for client-side bundles
    const { prisma } = await import("@/lib/prisma");

    const last24hDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const records = await prisma.bundle.findMany({
      where: {
        userId,
        phoneNumber: { in: phoneNumbers },
        status: "completed",
        processedAt: { gte: last24hDate },
      },
      select: { phoneNumber: true, processedAt: true },
      distinct: ["phoneNumber"],
    });

    const map = new Map<string, Date>();
    for (const r of records) {
      if (r.phoneNumber && r.processedAt) map.set(r.phoneNumber, r.processedAt);
    }

    return map;
  } catch (error) {
    console.error("Error checking last 24h records:", error);
    return new Map();
  }
}

/**
 * Performs full duplicate checking
 */
export async function performDuplicateCheck(
  bundles: Array<{ phoneNumber: string; gigAmount: number }>,
  userId: string
): Promise<DuplicateCheckResult> {
  // Check duplicates in paste
  const samePasteDuplicates = findDuplicatesInPaste(bundles);

  // Get unique phone numbers
  const uniquePhones = Array.from(new Set(bundles.map((b) => b.phoneNumber)));

  // Check last 24h records
  const last24hRecords = await checkLast24hRecords(uniquePhones, userId);

  // Separate and return
  return separateDuplicates(bundles, samePasteDuplicates, last24hRecords);
}

/**
 * Formats duplicate check result for display
 */
export function formatDuplicateCheckResult(result: DuplicateCheckResult): object {
  return {
    cleanCount: result.statistics.cleanItems,
    duplicateCount: result.statistics.duplicateItems,
    totalCount: result.statistics.totalItems,
    duplicatePhones: result.flaggedDuplicates,
    cleanOrders: result.cleanOrders.slice(0, 100), // Show first 100
    cleanOrdersCount: result.cleanOrders.length,
  };
}
