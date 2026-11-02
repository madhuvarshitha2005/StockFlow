const express = require('express');
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard/stats - Overview metrics and low-stock items
router.get('/stats', async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const defaultThreshold = req.user.organization.defaultLowStockThreshold ?? 5;

    // Fetch all products for the organization
    const products = await prisma.product.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
    });

    const totalProducts = products.length;
    let totalQuantity = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    const lowStockProducts = [];

    for (const prod of products) {
      totalQuantity += prod.quantityOnHand;
      if (prod.costPrice) {
        totalCostValue += prod.quantityOnHand * prod.costPrice;
      }
      if (prod.sellingPrice) {
        totalRetailValue += prod.quantityOnHand * prod.sellingPrice;
      }

      const threshold = prod.lowStockThreshold ?? defaultThreshold;
      if (prod.quantityOnHand <= threshold) {
        lowStockProducts.push({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          quantityOnHand: prod.quantityOnHand,
          lowStockThreshold: prod.lowStockThreshold,
          effectiveThreshold: threshold,
          sellingPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
          deficit: threshold - prod.quantityOnHand,
        });
      }
    }

    // Sort low stock items by lowest quantity first
    lowStockProducts.sort((a, b) => a.quantityOnHand - b.quantityOnHand);

    // Fetch recent 5 stock movements
    const recentMovements = await prisma.stockMovement.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        product: {
          select: { name: true, sku: true },
        },
      },
    });

    return res.json({
      summary: {
        totalProducts,
        totalQuantity,
        totalCostValue: Math.round(totalCostValue * 100) / 100,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        lowStockCount: lowStockProducts.length,
        defaultLowStockThreshold: defaultThreshold,
        organizationName: req.user.organization.name,
      },
      lowStockProducts,
      recentMovements,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
  }
});

module.exports = router;
