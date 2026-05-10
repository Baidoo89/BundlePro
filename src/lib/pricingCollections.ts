import { prisma } from "@/lib/prisma";

export type PricingEntry = {
  id: string;
  gigAmount: number;
  price: number;
  description?: string | null;
  isActive?: boolean;
};

export async function resolvePricingEntries(userId: string, pricingCollectionId?: string | null) {
  if (pricingCollectionId) {
    const collection = await prisma.pricingCollection.findFirst({
      where: { id: pricingCollectionId, userId },
      include: { entries: { orderBy: { gigAmount: "asc" } } },
    });

    if (collection) {
      return {
        source: "collection" as const,
        collectionId: collection.id,
        collectionName: collection.name,
        entries: collection.entries.map((entry) => ({
          id: entry.id,
          gigAmount: entry.gigAmount,
          price: entry.price,
          description: entry.description,
          isActive: entry.isActive,
        })) as PricingEntry[],
      };
    }
  }

  const activeCollection = await prisma.pricingCollection.findFirst({
    where: { userId, isActive: true },
    include: { entries: { orderBy: { gigAmount: "asc" } } },
  });

  if (activeCollection) {
    return {
      source: "collection" as const,
      collectionId: activeCollection.id,
      collectionName: activeCollection.name,
      entries: activeCollection.entries.map((entry) => ({
        id: entry.id,
        gigAmount: entry.gigAmount,
        price: entry.price,
        description: entry.description,
        isActive: entry.isActive,
      })) as PricingEntry[],
    };
  }

  const legacyRows = await prisma.priceList.findMany({
    where: { userId, isActive: true },
    select: { id: true, gigAmount: true, price: true, description: true, isActive: true },
    orderBy: { gigAmount: "asc" },
  });

  return {
    source: "legacy" as const,
    collectionId: null,
    collectionName: null,
    entries: legacyRows.map((row) => ({
      id: row.id,
      gigAmount: row.gigAmount,
      price: row.price,
      description: row.description,
      isActive: row.isActive,
    })) as PricingEntry[],
  };
}

export async function listPricingCollections(userId: string) {
  const collections = await prisma.pricingCollection.findMany({
    where: { userId },
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

  return collections;
}
