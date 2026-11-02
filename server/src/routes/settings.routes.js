const express = require('express');
const { z } = require('zod');
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

const updateSettingsSchema = z.object({
  defaultLowStockThreshold: z.coerce
    .number()
    .int('Threshold must be an integer')
    .min(0, 'Threshold cannot be negative')
    .max(10000, 'Threshold is unreasonably high')
    .optional(),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
});

// GET /api/settings - Fetch current organization settings
router.get('/', async (req, res) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      include: {
        _count: {
          select: { products: true, users: true },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    return res.json({
      id: organization.id,
      name: organization.name,
      defaultLowStockThreshold: organization.defaultLowStockThreshold,
      productCount: organization._count.products,
      userCount: organization._count.users,
      createdAt: organization.createdAt,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

// PUT /api/settings - Update organization settings
router.put('/', validate(updateSettingsSchema), async (req, res) => {
  try {
    const { defaultLowStockThreshold, organizationName } = req.body;
    const organizationId = req.user.organizationId;

    const data = {};
    if (defaultLowStockThreshold !== undefined) {
      data.defaultLowStockThreshold = defaultLowStockThreshold;
    }
    if (organizationName !== undefined) {
      data.name = organizationName.trim();
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data,
    });

    return res.json({
      message: 'Settings updated successfully.',
      organization: {
        id: updated.id,
        name: updated.name,
        defaultLowStockThreshold: updated.defaultLowStockThreshold,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Failed to update settings.' });
  }
});

module.exports = router;
