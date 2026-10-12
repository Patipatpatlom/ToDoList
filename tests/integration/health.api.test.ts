import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';

describe('Health & Global Error Handler Integration Tests', () => {
  it('GET /api/v1/health should return 200 and db connected status', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      db: 'connected',
      timestamp: expect.any(String),
    });
  });

  it('GET /api/v1/non-existent-route should trigger 404 NotFoundError JSON response', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Cannot GET /api/v1/non-existent-route',
      },
    });
  });
});
