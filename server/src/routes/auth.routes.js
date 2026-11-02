const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prisma');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper to generate JWT
const generateToken = (userId, organizationId) => {
  return jwt.sign(
    { userId, organizationId },
    process.env.JWT_SECRET || 'stockflow-super-secret-jwt-token-key-2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/signup
router.post('/signup', validate(signupSchema), async (req, res) => {
  try {
    const { email, password, organizationName, name } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Organization and User in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          defaultLowStockThreshold: 5,
        },
      });

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: name ? name.trim() : null,
          organizationId: org.id,
          role: 'OWNER',
        },
      });

      return { org, user };
    });

    const token = generateToken(result.user.id, result.org.id);

    return res.status(201).json({
      message: 'Account and organization created successfully.',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      organization: {
        id: result.org.id,
        name: result.org.name,
        defaultLowStockThreshold: result.org.defaultLowStockThreshold,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { organization: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user.id, user.organizationId);

    return res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        defaultLowStockThreshold: user.organization.defaultLowStockThreshold,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    return res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
      organization: {
        id: req.user.organization.id,
        name: req.user.organization.name,
        defaultLowStockThreshold: req.user.organization.defaultLowStockThreshold,
      },
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

module.exports = router;
