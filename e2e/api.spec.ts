import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test.describe('POST /api/reviews/submit', () => {
    test('accepts valid 5-star review', async ({ request }) => {
      const res = await request.post('/api/reviews/submit', {
        data: {
          slug: 'joes-cafe',
          rating: 5,
          comment: 'E2E test review - excellent!',
          customerName: 'E2E Tester',
        },
      });
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isPositive).toBe(true);
    });

    test('accepts valid 2-star review (negative)', async ({ request }) => {
      const res = await request.post('/api/reviews/submit', {
        data: {
          slug: 'joes-cafe',
          rating: 2,
          comment: 'E2E test - not great',
        },
      });
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isPositive).toBe(false);
    });

    test('rejects missing slug', async ({ request }) => {
      const res = await request.post('/api/reviews/submit', {
        data: { rating: 5 },
      });
      expect(res.status()).toBe(400);
    });

    test('rejects missing rating', async ({ request }) => {
      const res = await request.post('/api/reviews/submit', {
        data: { slug: 'joes-cafe' },
      });
      expect(res.status()).toBe(400);
    });

    test('rejects rating out of range', async ({ request }) => {
      const res = await request.post('/api/reviews/submit', {
        data: { slug: 'joes-cafe', rating: 0 },
      });
      expect(res.status()).toBe(400);

      const res2 = await request.post('/api/reviews/submit', {
        data: { slug: 'joes-cafe', rating: 6 },
      });
      expect(res2.status()).toBe(400);
    });

    test('returns 404 for non-existent business', async ({ request }) => {
      const res = await request.post('/api/reviews/submit', {
        data: { slug: 'nonexistent-biz', rating: 5 },
      });
      expect(res.status()).toBe(404);
    });

    test('accepts review with minimal data', async ({ request }) => {
      const res = await request.post('/api/reviews/submit', {
        data: { slug: 'joes-cafe', rating: 4 },
      });
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isPositive).toBe(true);
    });

    test('works for second seeded business', async ({ request }) => {
      const res = await request.post('/api/reviews/submit', {
        data: {
          slug: 'glow-beauty',
          rating: 5,
          comment: 'E2E test for Glow Beauty',
        },
      });
      expect(res.status()).toBe(200);
      expect((await res.json()).success).toBe(true);
    });
  });

  test.describe('GET /api/embed/[slug]', () => {
    test('returns JSON with reviews for valid slug', async ({ request }) => {
      const res = await request.get('/api/embed/joes-cafe');
      expect(res.status()).toBe(200);
      const json = await res.json();
      expect(json.organization).toBeDefined();
      expect(json.reviews).toBeDefined();
      expect(Array.isArray(json.reviews)).toBe(true);
      expect(json.reviews.length).toBeGreaterThan(0);
    });

    test('returns CORS headers', async ({ request }) => {
      const res = await request.get('/api/embed/joes-cafe');
      const headers = res.headers();
      expect(headers['access-control-allow-origin']).toBe('*');
    });

    test('returns 404 for non-existent slug', async ({ request }) => {
      const res = await request.get('/api/embed/fake-business-xyz');
      expect(res.status()).toBe(404);
    });
  });

  test.describe('POST /api/sms/send', () => {
    test('returns 401 when not authenticated', async ({ request }) => {
      const res = await request.post('/api/sms/send', {
        data: {
          organizationId: '00000000-0000-0000-0000-000000000001',
          customerPhone: '+1234567890',
        },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe('POST /api/stripe/create-checkout', () => {
    test('returns 401 when not authenticated', async ({ request }) => {
      const res = await request.post('/api/stripe/create-checkout');
      expect(res.status()).toBe(401);
    });
  });

  test.describe('POST /api/stripe/create-portal', () => {
    test('returns 401 when not authenticated', async ({ request }) => {
      const res = await request.post('/api/stripe/create-portal');
      expect(res.status()).toBe(401);
    });
  });
});
