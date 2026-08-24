const request = require('supertest');
const app = require('../src/app');
const CatalogItem = require('../src/models/CatalogItem');

// Mock CatalogItem model methods so tests run fast without waiting for database network
jest.mock('../src/models/CatalogItem');

describe('GET /api/catalog/public', () => {
  beforeEach(() => {
    CatalogItem.countDocuments.mockResolvedValue(1);
    CatalogItem.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { itemId: 'box-mockups', title: 'Box Mockups', active: true }
      ])
    });
  });

  it('should return catalog categories and items list', async () => {
    const res = await request(app).get('/api/catalog/public');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should return public catalog via default root endpoint', async () => {
    const res = await request(app).get('/api/catalog');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
