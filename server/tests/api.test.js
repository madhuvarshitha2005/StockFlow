const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prisma');

describe('StockFlow API Test Suite', () => {
  let orgAToken, orgBToken;
  let orgAProduct;

  beforeAll(async () => {
    // Clear test records
    await prisma.stockMovement.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authentication & Multi-Tenant Basics (FR-1, FR-2)', () => {
    it('should successfully sign up a new user and create an organization', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'alice@store-a.com',
          password: 'Password123!',
          organizationName: 'Alpha Store',
          name: 'Alice Manager',
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('alice@store-a.com');
      expect(res.body.organization.name).toBe('Alpha Store');
      expect(res.body.organization.defaultLowStockThreshold).toBe(5);

      orgAToken = res.body.token;
    });

    it('should reject signup with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'alice@store-a.com',
          password: 'Password123!',
          organizationName: 'Alpha Store Duplicate',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('should sign up a second organization for tenant isolation tests', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'bob@store-b.com',
          password: 'Password123!',
          organizationName: 'Beta Market',
          name: 'Bob Owner',
        });

      expect(res.status).toBe(201);
      orgBToken = res.body.token;
    });

    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@store-a.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('alice@store-a.com');
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@store-a.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
    });

    it('should retrieve current user and org via /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${orgAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('alice@store-a.com');
      expect(res.body.organization.name).toBe('Alpha Store');
    });
  });

  describe('Product & Inventory Management (FR-3, FR-4, FR-5)', () => {
    it('should create a product for Org A', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({
          name: 'Mechanical Keyboard TKL',
          sku: 'KB-TKL-01',
          quantityOnHand: 4,
          costPrice: 40.0,
          sellingPrice: 85.0,
          lowStockThreshold: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.sku).toBe('KB-TKL-01');
      expect(res.body.isLowStock).toBe(true); // 4 <= 5

      orgAProduct = res.body;
    });

    it('should reject creating duplicate SKU within the same org', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({
          name: 'Another Keyboard',
          sku: 'KB-TKL-01',
          quantityOnHand: 10,
        });

      expect(res.status).toBe(409);
    });

    it('should allow Org B to create a product with the same SKU (tenant scoped)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${orgBToken}`)
        .send({
          name: 'Org B Keyboard',
          sku: 'KB-TKL-01', // Same SKU as Org A
          quantityOnHand: 20,
        });

      expect(res.status).toBe(201);
      expect(res.body.sku).toBe('KB-TKL-01');
    });

    it('should enforce tenant isolation on product listing', async () => {
      const resA = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${orgAToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.products.length).toBe(1);
      expect(resA.body.products[0].name).toBe('Mechanical Keyboard TKL');

      const resB = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${orgBToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.products.length).toBe(1);
      expect(resB.body.products[0].name).toBe('Org B Keyboard');
    });

    it('should update product details', async () => {
      const res = await request(app)
        .put(`/api/products/${orgAProduct.id}`)
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({
          name: 'Mechanical Keyboard RGB TKL',
          sellingPrice: 89.99,
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Mechanical Keyboard RGB TKL');
      expect(res.body.sellingPrice).toBe(89.99);
    });

    it('should adjust stock with positive delta (FR-5)', async () => {
      const res = await request(app)
        .post(`/api/products/${orgAProduct.id}/adjust-stock`)
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({
          delta: 6,
          note: 'Restock shipment received',
        });

      expect(res.status).toBe(200);
      expect(res.body.product.quantityOnHand).toBe(10); // 4 + 6 = 10
      expect(res.body.product.isLowStock).toBe(false); // 10 > 5
    });

    it('should prevent adjusting stock below zero', async () => {
      const res = await request(app)
        .post(`/api/products/${orgAProduct.id}/adjust-stock`)
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({
          delta: -50,
          note: 'Invalid excessive deduction',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('negative stock');
    });
  });

  describe('Dashboard Analytics (FR-6)', () => {
    it('should return correct dashboard summary and low stock items', async () => {
      // Add a low-stock product
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({
          name: 'USB Cable',
          sku: 'CAB-001',
          quantityOnHand: 2,
          costPrice: 2.0,
          sellingPrice: 10.0,
          lowStockThreshold: 5,
        });

      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${orgAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.totalProducts).toBe(2);
      expect(res.body.summary.totalQuantity).toBe(12); // 10 + 2
      expect(res.body.summary.lowStockCount).toBe(1); // Only USB Cable is <= 5
      expect(res.body.lowStockProducts[0].sku).toBe('CAB-001');
    });
  });

  describe('Global Settings (FR-7)', () => {
    it('should fetch organization settings', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${orgAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Alpha Store');
      expect(res.body.defaultLowStockThreshold).toBe(5);
    });

    it('should update default low stock threshold', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${orgAToken}`)
        .send({
          defaultLowStockThreshold: 12,
        });

      expect(res.status).toBe(200);
      expect(res.body.organization.defaultLowStockThreshold).toBe(12);
    });
  });

  describe('Product Deletion', () => {
    it('should delete a product', async () => {
      const res = await request(app)
        .delete(`/api/products/${orgAProduct.id}`)
        .set('Authorization', `Bearer ${orgAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('successfully deleted');

      // Verify deletion
      const check = await request(app)
        .get(`/api/products/${orgAProduct.id}`)
        .set('Authorization', `Bearer ${orgAToken}`);

      expect(check.status).toBe(404);
    });
  });
});
