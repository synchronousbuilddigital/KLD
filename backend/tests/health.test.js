const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('GET /api/health', () => {
  const setReadyState = (state) => {
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: state,
      configurable: true,
      writable: true,
    });
  };

  beforeEach(() => {
    setReadyState(1);
  });

  it('should return 200 OK and health status object when database is connected', async () => {
    setReadyState(1);
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return 503 Service Unavailable when database is disconnected', async () => {
    setReadyState(0);
    const res = await request(app).get('/api/health');

    expect(res.statusCode).toBe(503);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.status).toBe('DEGRADED');
  });

  it('should return 404 for unknown endpoints', async () => {
    const res = await request(app).get('/api/unknown-endpoint-12345');

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('not found');
  });
});
