const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with realistic demo inventory...');

  // Clean existing data
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 1. Primary Tenant: Apex Retail Logistics
  const apexOrg = await prisma.organization.create({
    data: {
      name: 'Apex Retail Logistics',
      defaultLowStockThreshold: 8,
    },
  });

  const apexUser = await prisma.user.create({
    data: {
      email: 'demo@stockflow.io',
      password: passwordHash,
      name: 'Sarah Connor',
      organizationId: apexOrg.id,
      role: 'OWNER',
    },
  });

  const apexProducts = [
    {
      name: 'Wireless Ergonomic Keyboard',
      sku: 'KB-WIR-001',
      description: 'Split design wireless mechanical keyboard with wrist rest',
      quantityOnHand: 4, // LOW STOCK (<= 8)
      costPrice: 45.0,
      sellingPrice: 89.99,
      lowStockThreshold: 10,
    },
    {
      name: 'USB-C Ultra Docking Station 10-in-1',
      sku: 'DOC-USBC-10',
      description: 'Dual 4K HDMI, Gigabit Ethernet, 100W Power Delivery',
      quantityOnHand: 6, // LOW STOCK (<= 8)
      costPrice: 38.5,
      sellingPrice: 79.99,
      lowStockThreshold: null, // Fallback to org default 8
    },
    {
      name: 'Noise-Cancelling Over-Ear Headphones',
      sku: 'AUD-NC-900',
      description: 'Active noise cancellation with 40-hour battery life',
      quantityOnHand: 2, // CRITICAL LOW STOCK
      costPrice: 65.0,
      sellingPrice: 149.99,
      lowStockThreshold: 5,
    },
    {
      name: 'Studio Condenser USB Microphone',
      sku: 'MIC-USB-PRO',
      description: 'Cardioid polar pattern studio microphone with pop filter',
      quantityOnHand: 0, // OUT OF STOCK
      costPrice: 28.0,
      sellingPrice: 59.99,
      lowStockThreshold: 5,
    },
    {
      name: '27-inch 4K IPS Creator Monitor',
      sku: 'MON-4K-27',
      description: 'Color calibrated 99% sRGB with height adjustable stand',
      quantityOnHand: 18, // HEALTHY STOCK
      costPrice: 210.0,
      sellingPrice: 349.99,
      lowStockThreshold: 6,
    },
    {
      name: 'Braided Thunderbolt 4 Cable (2m)',
      sku: 'CAB-TB4-2M',
      description: '40Gbps data transfer, 100W fast charging',
      quantityOnHand: 85, // HEALTHY STOCK
      costPrice: 8.5,
      sellingPrice: 24.99,
      lowStockThreshold: 15,
    },
    {
      name: 'Heavy-Duty Monitor Desk Arm',
      sku: 'ARM-DSK-01',
      description: 'Gas spring single arm mount holding up to 34" ultrawide',
      quantityOnHand: 22, // HEALTHY STOCK
      costPrice: 24.0,
      sellingPrice: 49.99,
      lowStockThreshold: 8,
    },
    {
      name: 'Desk Pad Vegan Leather (90x40cm)',
      sku: 'PAD-VGN-90',
      description: 'Waterproof non-slip desk mat, matte midnight black',
      quantityOnHand: 45, // HEALTHY STOCK
      costPrice: 6.0,
      sellingPrice: 19.99,
      lowStockThreshold: 10,
    },
  ];

  for (const item of apexProducts) {
    const prod = await prisma.product.create({
      data: {
        ...item,
        organizationId: apexOrg.id,
        lastUpdatedBy: apexUser.email,
      },
    });

    // Create initial stock movement
    await prisma.stockMovement.create({
      data: {
        organizationId: apexOrg.id,
        productId: prod.id,
        quantityDelta: item.quantityOnHand,
        previousQuantity: 0,
        newQuantity: item.quantityOnHand,
        note: 'Initial catalog stocking',
        adjustedBy: apexUser.email,
      },
    });
  }

  // 2. Second Tenant (demonstrating multi-tenant isolation)
  const stellarOrg = await prisma.organization.create({
    data: {
      name: 'Stellar Goods & Apparel',
      defaultLowStockThreshold: 10,
    },
  });

  const stellarUser = await prisma.user.create({
    data: {
      email: 'owner@stellargoods.com',
      password: passwordHash,
      name: 'Marcus Vance',
      organizationId: stellarOrg.id,
      role: 'OWNER',
    },
  });

  await prisma.product.create({
    data: {
      name: 'Organic Cotton Crewneck T-Shirt',
      sku: 'APP-TSH-01',
      description: '100% GOTS certified organic ring-spun cotton',
      quantityOnHand: 150,
      costPrice: 9.0,
      sellingPrice: 28.0,
      organizationId: stellarOrg.id,
      lastUpdatedBy: stellarUser.email,
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Primary demo account: demo@stockflow.io / Password123! (Org: Apex Retail Logistics)');
  console.log('Isolated tenant account: owner@stellargoods.com / Password123! (Org: Stellar Goods & Apparel)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
