const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Apply tenant auth to all product routes
router.use(authMiddleware);

// Validation Schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required').transform((v) => v.trim().toUpperCase()),
  description: z.string().optional().nullable(),
  quantityOnHand: z.coerce.number().int().min(0, 'Quantity cannot be negative').default(0),
  costPrice: z.coerce.number().min(0, 'Cost price must be positive').optional().nullable(),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be positive').optional().nullable(),
  lowStockThreshold: z.coerce.number().int().min(0, 'Threshold cannot be negative').optional().nullable(),
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  sku: z.string().min(1, 'SKU is required').transform((v) => v.trim().toUpperCase()).optional(),
  description: z.string().optional().nullable(),
  quantityOnHand: z.coerce.number().int().min(0, 'Quantity cannot be negative').optional(),
  costPrice: z.coerce.number().min(0, 'Cost price must be positive').optional().nullable(),
  sellingPrice: z.coerce.number().min(0, 'Selling price must be positive').optional().nullable(),
  lowStockThreshold: z.coerce.number().int().min(0, 'Threshold cannot be negative').optional().nullable(),
});

const adjustStockSchema = z.object({
  delta: z.coerce.number().int().refine((val) => val !== 0, 'Adjustment delta cannot be zero'),
  note: z.string().optional().nullable(),
});

// Helper to compute effective low stock threshold & flag
const enrichProduct = (product, defaultThreshold) => {
  const effectiveThreshold = product.lowStockThreshold ?? defaultThreshold ?? 5;
  const isLowStock = product.quantityOnHand <= effectiveThreshold;
  return {
    ...product,
    effectiveThreshold,
    isLowStock,
  };
};

// GET /api/products - List products for tenant with search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const organizationId = req.user.organizationId;
    const defaultThreshold = req.user.organization.defaultLowStockThreshold;

    const where = { organizationId };

    if (search && search.trim() !== '') {
      const query = search.trim();
      where.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        stockMovements: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const enriched = products.map((p) => enrichProduct(p, defaultThreshold));

    return res.json({
      products: enriched,
      total: enriched.length,
    });
  } catch (error) {
    console.error('List products error:', error);
    return res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// GET /api/products/:id - Single product detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const defaultThreshold = req.user.organization.defaultLowStockThreshold;

    const product = await prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json(enrichProduct(product, defaultThreshold));
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ error: 'Failed to retrieve product.' });
  }
});

// GET /api/products/:id/movements - Full movement history
router.get('/:id/movements', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const movements = await prisma.stockMovement.findMany({
      where: { productId: id, organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ movements });
  } catch (error) {
    console.error('Get movements error:', error);
    return res.status(500).json({ error: 'Failed to retrieve stock movement history.' });
  }
});

// POST /api/products - Create product
router.post('/', validate(createProductSchema), async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { name, sku, description, quantityOnHand, costPrice, sellingPrice, lowStockThreshold } = req.body;

    // Check SKU uniqueness within organization
    const existingSku = await prisma.product.findUnique({
      where: {
        organizationId_sku: {
          organizationId,
          sku,
        },
      },
    });

    if (existingSku) {
      return res.status(409).json({ error: `A product with SKU "${sku}" already exists in your organization.` });
    }

    const product = await prisma.product.create({
      data: {
        organizationId,
        name: name.trim(),
        sku,
        description: description ? description.trim() : null,
        quantityOnHand: quantityOnHand ?? 0,
        costPrice: costPrice !== undefined ? costPrice : null,
        sellingPrice: sellingPrice !== undefined ? sellingPrice : null,
        lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : null,
        lastUpdatedBy: req.user.email,
      },
    });

    // If initial stock > 0, log an initial stock movement
    if (quantityOnHand > 0) {
      await prisma.stockMovement.create({
        data: {
          organizationId,
          productId: product.id,
          quantityDelta: quantityOnHand,
          previousQuantity: 0,
          newQuantity: quantityOnHand,
          note: 'Initial inventory on product creation',
          adjustedBy: req.user.email,
        },
      });
    }

    const defaultThreshold = req.user.organization.defaultLowStockThreshold;
    return res.status(201).json(enrichProduct(product, defaultThreshold));
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', validate(updateProductSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { name, sku, description, quantityOnHand, costPrice, sellingPrice, lowStockThreshold } = req.body;

    const existingProduct = await prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Check SKU uniqueness if SKU is changing
    if (sku && sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findUnique({
        where: {
          organizationId_sku: {
            organizationId,
            sku,
          },
        },
      });

      if (skuConflict && skuConflict.id !== id) {
        return res.status(409).json({ error: `A product with SKU "${sku}" already exists in your organization.` });
      }
    }

    // Check if quantity changed directly in update form
    let quantityDelta = null;
    if (quantityOnHand !== undefined && quantityOnHand !== existingProduct.quantityOnHand) {
      quantityDelta = quantityOnHand - existingProduct.quantityOnHand;
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(sku !== undefined && { sku }),
          ...(description !== undefined && { description: description ? description.trim() : null }),
          ...(quantityOnHand !== undefined && { quantityOnHand }),
          ...(costPrice !== undefined && { costPrice }),
          ...(sellingPrice !== undefined && { sellingPrice }),
          ...(lowStockThreshold !== undefined && { lowStockThreshold }),
          lastUpdatedBy: req.user.email,
        },
      });

      if (quantityDelta !== null) {
        await tx.stockMovement.create({
          data: {
            organizationId,
            productId: id,
            quantityDelta,
            previousQuantity: existingProduct.quantityOnHand,
            newQuantity: quantityOnHand,
            note: 'Direct quantity edit in product form',
            adjustedBy: req.user.email,
          },
        });
      }

      return prod;
    });

    const defaultThreshold = req.user.organization.defaultLowStockThreshold;
    return res.json(enrichProduct(updatedProduct, defaultThreshold));
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
});

// POST /api/products/:id/adjust-stock - Quick adjust stock (+/- N units)
router.post('/:id/adjust-stock', validate(adjustStockSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, note } = req.body;
    const organizationId = req.user.organizationId;

    const product = await prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const previousQuantity = product.quantityOnHand;
    const newQuantity = previousQuantity + delta;

    if (newQuantity < 0) {
      return res.status(400).json({
        error: `Adjustment would result in negative stock (${newQuantity}). Available stock is ${previousQuantity}.`,
      });
    }

    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: {
          quantityOnHand: newQuantity,
          lastUpdatedBy: req.user.email,
        },
      }),
      prisma.stockMovement.create({
        data: {
          organizationId,
          productId: id,
          quantityDelta: delta,
          previousQuantity,
          newQuantity,
          note: note ? note.trim() : 'Stock adjustment',
          adjustedBy: req.user.email,
        },
      }),
    ]);

    const defaultThreshold = req.user.organization.defaultLowStockThreshold;
    return res.json({
      product: enrichProduct(updatedProduct, defaultThreshold),
      movement,
      message: `Stock successfully adjusted by ${delta > 0 ? '+' : ''}${delta} units.`,
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    return res.status(500).json({ error: 'Failed to adjust stock.' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const product = await prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    await prisma.product.delete({
      where: { id },
    });

    return res.json({
      message: `Product "${product.name}" (${product.sku}) was successfully deleted.`,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
});

module.exports = router;
