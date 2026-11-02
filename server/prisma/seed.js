const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich demo inventory dataset...');

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
      name: 'Sarah Connor (Store Admin)',
      organizationId: apexOrg.id,
      role: 'OWNER',
    },
  });

  const catalog = [
    {
      name: 'Ergonomic Mechanical Keyboard (TKL RGB)',
      sku: 'KB-ERG-01',
      description: 'Tenkeyless hot-swappable mechanical keyboard with PBT keycaps & wrist pad',
      quantityOnHand: 4,
      costPrice: 42.5,
      sellingPrice: 89.99,
      lowStockThreshold: 8,
      movements: [
        { delta: 25, note: 'Initial stock shipment from Shenzhen', timeOffsetHours: 72 },
        { delta: -15, note: 'B2B Wholesale order shipment to Acme Corp', timeOffsetHours: 48 },
        { delta: -6, note: 'Online retail sales fulfillment batch', timeOffsetHours: 12 },
      ],
    },
    {
      name: 'USB-C Triple Display 4K Docking Station',
      sku: 'DOC-USBC-4K',
      description: '100W Power Delivery, Dual HDMI 2.0, DisplayPort, Gigabit RJ45, 4x USB 3.2',
      quantityOnHand: 5,
      costPrice: 58.0,
      sellingPrice: 129.99,
      lowStockThreshold: 10,
      movements: [
        { delta: 30, note: 'Supplier PO #1044 received', timeOffsetHours: 120 },
        { delta: -20, note: 'E-commerce flash sale orders dispatch', timeOffsetHours: 60 },
        { delta: -5, note: 'Retail counter sales', timeOffsetHours: 24 },
      ],
    },
    {
      name: 'Active Noise-Cancelling Wireless Headphones',
      sku: 'AUD-ANC-900',
      description: 'Hybrid ANC with transparency mode, 45-hour battery, Bluetooth 5.3',
      quantityOnHand: 2,
      costPrice: 78.0,
      sellingPrice: 179.99,
      lowStockThreshold: 6,
      movements: [
        { delta: 20, note: 'Initial stocking', timeOffsetHours: 96 },
        { delta: -15, note: 'Holiday weekend orders dispatched', timeOffsetHours: 36 },
        { delta: -3, note: 'Walk-in customer sales', timeOffsetHours: 8 },
      ],
    },
    {
      name: 'Studio Condenser Broadcast Microphone Kit',
      sku: 'MIC-PRO-X',
      description: '24-bit/192kHz USB audio interface with shock mount & dual pop filter',
      quantityOnHand: 0,
      costPrice: 34.0,
      sellingPrice: 79.99,
      lowStockThreshold: 5,
      movements: [
        { delta: 15, note: 'Initial inventory stocking', timeOffsetHours: 168 },
        { delta: -12, note: 'Creator bundle sales shipped', timeOffsetHours: 72 },
        { delta: -3, note: 'Stock cleared out - backorder requested', timeOffsetHours: 16 },
      ],
    },
    {
      name: '27-inch 4K IPS Color-Accurate Creator Monitor',
      sku: 'MON-4K-27X',
      description: 'Factory-calibrated Delta E < 2, 99% DCI-P3, USB-C 90W single-cable dock',
      quantityOnHand: 14,
      costPrice: 245.0,
      sellingPrice: 429.99,
      lowStockThreshold: 5,
      movements: [
        { delta: 20, note: 'Bulk freight pallet delivery', timeOffsetHours: 240 },
        { delta: -6, note: 'Design studio outfitting order', timeOffsetHours: 90 },
      ],
    },
    {
      name: 'Heavy-Duty Gas Spring Dual Monitor Arm',
      sku: 'ARM-DSK-DUO',
      description: 'Aircraft-grade aluminum dual arm holding monitors up to 32 inches each',
      quantityOnHand: 19,
      costPrice: 32.0,
      sellingPrice: 69.99,
      lowStockThreshold: 6,
      movements: [
        { delta: 25, note: 'Warehouse restock order', timeOffsetHours: 144 },
        { delta: -6, note: 'Corporate office setup order', timeOffsetHours: 50 },
      ],
    },
    {
      name: 'Braided Thunderbolt 4 High-Speed Cable (2m)',
      sku: 'CAB-TB4-2M',
      description: 'Certified 40Gbps data, 8K video output, and 240W EPR fast charging',
      quantityOnHand: 92,
      costPrice: 9.5,
      sellingPrice: 29.99,
      lowStockThreshold: 15,
      movements: [
        { delta: 120, note: 'Supplier bulk carton received', timeOffsetHours: 180 },
        { delta: -28, note: 'Accessories bundle fulfillment', timeOffsetHours: 30 },
      ],
    },
    {
      name: 'Midnight Black Micro-Weave Desk Mat (90x40cm)',
      sku: 'PAD-DESK-XL',
      description: 'Hydrophobic nano-coating with anti-fray stitched edges & natural rubber base',
      quantityOnHand: 48,
      costPrice: 5.5,
      sellingPrice: 19.99,
      lowStockThreshold: 12,
      movements: [
        { delta: 60, note: 'Direct factory shipment', timeOffsetHours: 200 },
        { delta: -12, note: 'Standard web orders', timeOffsetHours: 40 },
      ],
    },
    {
      name: 'Smart Biometric Fingerprint Padlock',
      sku: 'SEC-BIO-PAD',
      description: 'IP65 waterproof keyless smart lock with 0.5s recognition and USB-C recharging',
      quantityOnHand: 3,
      costPrice: 16.0,
      sellingPrice: 39.99,
      lowStockThreshold: 8,
      movements: [
        { delta: 30, note: 'Initial catalog stocking', timeOffsetHours: 110 },
        { delta: -24, note: 'Warehouse retail deliveries', timeOffsetHours: 44 },
        { delta: -3, note: 'In-store sales', timeOffsetHours: 10 },
      ],
    },
    {
      name: 'Magnetic MagSafe Wireless Power Bank 10,000mAh',
      sku: 'PWR-MAG-10K',
      description: 'Foldable kickstand with 15W Qi wireless and 20W PD fast charge',
      quantityOnHand: 6,
      costPrice: 18.5,
      sellingPrice: 44.99,
      lowStockThreshold: null, // Inherits org default (8) -> LOW STOCK
      movements: [
        { delta: 40, note: 'Quarterly supply restock', timeOffsetHours: 150 },
        { delta: -34, note: 'Promotional campaign sales surge', timeOffsetHours: 28 },
      ],
    },
    {
      name: 'High-Speed Thermal Receipt & Label Printer',
      sku: 'PRN-THM-80',
      description: 'Direct thermal shipping label printer with auto-cutter & Ethernet/USB',
      quantityOnHand: 1,
      costPrice: 75.0,
      sellingPrice: 159.99,
      lowStockThreshold: 4,
      movements: [
        { delta: 10, note: 'Commercial gear shipment', timeOffsetHours: 210 },
        { delta: -8, note: 'Fulfillment center supply dispatch', timeOffsetHours: 65 },
        { delta: -1, note: 'POS terminal install package', timeOffsetHours: 18 },
      ],
    },
    {
      name: 'Handheld 2D Wireless Barcode Scanner',
      sku: 'SCN-BAR-2D',
      description: 'Long-range QR/DataMatrix/UPC optical CMOS scanner with 2.4G base cradle',
      quantityOnHand: 0,
      costPrice: 28.0,
      sellingPrice: 64.99,
      lowStockThreshold: 5,
      movements: [
        { delta: 12, note: 'Equipment restock', timeOffsetHours: 190 },
        { delta: -12, note: 'Logistics company enterprise order', timeOffsetHours: 35 },
      ],
    },
    {
      name: 'Adjustable Laptop Riser Stand (Space Gray)',
      sku: 'STD-LPT-GRY',
      description: 'CNC anodized aluminum ergonomic elevator with silicone anti-slip grips',
      quantityOnHand: 34,
      costPrice: 12.0,
      sellingPrice: 32.99,
      lowStockThreshold: 10,
      movements: [
        { delta: 50, note: 'Inventory delivery PO #908', timeOffsetHours: 130 },
        { delta: -16, note: 'Back to school promo dispatch', timeOffsetHours: 42 },
      ],
    },
    {
      name: 'Industrial Heavy Duty Bubble Wrap Roll (50m)',
      sku: 'PKG-BUB-50M',
      description: 'Recyclable perforated air bubble cushioning for fragile shipments',
      quantityOnHand: 65,
      costPrice: 8.0,
      sellingPrice: 22.5,
      lowStockThreshold: 15,
      movements: [
        { delta: 80, note: 'Packaging supplies restocking', timeOffsetHours: 300 },
        { delta: -15, note: 'Shipping station consumption', timeOffsetHours: 20 },
      ],
    },
    {
      name: 'Corrugated Shipping Boxes 12x9x4 inch (Pack of 25)',
      sku: 'PKG-BOX-M25',
      description: 'ECT-32 kraft corrugated shipping mailer cartons for e-commerce parcels',
      quantityOnHand: 110,
      costPrice: 11.0,
      sellingPrice: 27.99,
      lowStockThreshold: 25,
      movements: [
        { delta: 150, note: 'Pallet drop delivery', timeOffsetHours: 350 },
        { delta: -40, note: 'Daily packing batch', timeOffsetHours: 48 },
      ],
    },
  ];

  const now = new Date();

  for (const item of catalog) {
    const { movements, ...productData } = item;

    const prod = await prisma.product.create({
      data: {
        ...productData,
        organizationId: apexOrg.id,
        lastUpdatedBy: apexUser.email,
        updatedAt: new Date(now.getTime() - 2 * 3600 * 1000), // 2 hours ago
      },
    });

    // Populate realistic stock movements
    let runningQty = 0;
    for (const m of movements) {
      const prev = runningQty;
      runningQty += m.delta;
      const movementTime = new Date(now.getTime() - m.timeOffsetHours * 3600 * 1000);

      await prisma.stockMovement.create({
        data: {
          organizationId: apexOrg.id,
          productId: prod.id,
          quantityDelta: m.delta,
          previousQuantity: prev,
          newQuantity: runningQty,
          note: m.note,
          adjustedBy: apexUser.email,
          createdAt: movementTime,
        },
      });
    }
  }

  // 2. Second Tenant: Stellar Goods & Apparel (Multi-Tenant Isolation demo)
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

  const stellarCatalog = [
    {
      name: 'Organic Combed Cotton Crewneck T-Shirt (Navy)',
      sku: 'APP-TSH-NVY',
      description: '100% GOTS certified heavyweight organic cotton tee',
      quantityOnHand: 85,
      costPrice: 9.0,
      sellingPrice: 28.0,
      lowStockThreshold: 15,
    },
    {
      name: 'French Terry Relaxed Fit Hoodie (Charcoal)',
      sku: 'APP-HDY-CHR',
      description: '450 GSM custom knit loopback terry pullover hoodie',
      quantityOnHand: 4, // LOW STOCK
      costPrice: 24.0,
      sellingPrice: 68.0,
      lowStockThreshold: 10,
    },
    {
      name: 'Heavyweight Canvas Field Tote Bag',
      sku: 'BAG-CNV-01',
      description: '16oz water-repellent duck canvas with vegetable tanned leather straps',
      quantityOnHand: 22,
      costPrice: 14.5,
      sellingPrice: 38.0,
      lowStockThreshold: 8,
    },
    {
      name: 'Merino Wool Ribbed Beanie (Oatmeal)',
      sku: 'ACC-WOL-OAT',
      description: '100% extrafine merino wool seamless circular knit winter cap',
      quantityOnHand: 0, // OUT OF STOCK
      costPrice: 8.0,
      sellingPrice: 24.0,
      lowStockThreshold: 5,
    },
  ];

  for (const sItem of stellarCatalog) {
    const sProd = await prisma.product.create({
      data: {
        ...sItem,
        organizationId: stellarOrg.id,
        lastUpdatedBy: stellarUser.email,
      },
    });

    await prisma.stockMovement.create({
      data: {
        organizationId: stellarOrg.id,
        productId: sProd.id,
        quantityDelta: sItem.quantityOnHand,
        previousQuantity: 0,
        newQuantity: sItem.quantityOnHand,
        note: 'Seasonal inventory stocking',
        adjustedBy: stellarUser.email,
      },
    });
  }

  console.log('Seeding completed successfully!');
  console.log(`Apex Retail Logistics: ${catalog.length} items with complete stock movement logs.`);
  console.log(`Stellar Goods: ${stellarCatalog.length} items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
