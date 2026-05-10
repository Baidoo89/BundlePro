import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      password: "demo123", // In production, hash this!
    },
  });

  console.log(`✓ Created user: ${user.email}`);

  // Create pricing table
  const pricingData = [
    { gigAmount: 1, price: 50 },
    { gigAmount: 2, price: 100 },
    { gigAmount: 5, price: 250 },
    { gigAmount: 10, price: 500 },
    { gigAmount: 20, price: 900 },
    { gigAmount: 50, price: 2000 },
    { gigAmount: 100, price: 3500 },
  ];

  for (const pricing of pricingData) {
    await prisma.priceList.upsert({
      where: {
        userId_gigAmount: {
          userId: user.id,
          gigAmount: pricing.gigAmount,
        },
      },
      update: {},
      create: {
        userId: user.id,
        gigAmount: pricing.gigAmount,
        price: pricing.price,
        description: `${pricing.gigAmount}GB Bundle`,
        isActive: true,
      },
    });
  }

  console.log(`✓ Created ${pricingData.length} pricing entries`);

  // Create API credentials
  const apiCredentials = [
    {
      provider: "MTN",
      apiKey: "mtn-test-key",
      endpoint: "https://api.mtn.com/v1/bundles",
    },
    {
      provider: "Airtel",
      apiKey: "airtel-test-key",
      endpoint: "https://api.airtel.com/v1/bundles",
    },
  ];

  for (const cred of apiCredentials) {
    await prisma.aPICredential.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: cred.provider,
        },
      },
      update: {},
      create: {
        userId: user.id,
        provider: cred.provider,
        apiKey: cred.apiKey,
        endpoint: cred.endpoint,
        isActive: false,
      },
    });
  }

  console.log(`✓ Created ${apiCredentials.length} API credentials`);

  console.log("✅ Database seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
