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

  it('should reject invalid or forged Google credential token with HTTP 401', async () => {
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-google-client-id';

    // Unverified base64 payload attempt
    const fakePayload = Buffer.from(JSON.stringify({ email: 'victim@example.com', sub: '123' })).toString('base64');
    const fakeToken = `header.${fakePayload}.signature`;

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: fakeToken });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid or expired Google ID token');
  });

  it('should reject unauthenticated upload requests to /api/uploads/logo with HTTP 401', async () => {
    const res = await request(app).post('/api/uploads/logo');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject unauthenticated asset deletion attempts with HTTP 401', async () => {
    const res = await request(app).delete('/api/uploads/sample-asset-12345');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
