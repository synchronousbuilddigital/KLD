const request = require('supertest');
const app = require('../src/app');

describe('Authentication & Validation Endpoints', () => {
  it('should reject signup OTP request if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/send-signup-otp')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Email address is required');
  });

  it('should reject signup OTP request if email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/send-signup-otp')
      .send({ email: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject unauthorized access to protected /api/users/me endpoint without token', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid password reset request missing OTP and password', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'test@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
