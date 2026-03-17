import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  signInAsUser,
  createTestOrg,
  cleanupTestOrg,
  addPlatform,
  type TestOrg,
} from './helpers';

// ═══════════════════════════════════════════════════════════════════════════════
// API Endpoint E2E Tests
// Tests: review submission, staff invite, Stripe webhook simulation
// ═══════════════════════════════════════════════════════════════════════════════

let testUserId: string;
let testOrg: TestOrg;
const TEST_EMAIL = `e2e-api-${Date.now()}@test.com`;

test.beforeAll(async () => {
  const user = await createTestUser(TEST_EMAIL);
  testUserId = user.id;
  testOrg = await createTestOrg(testUserId, TEST_EMAIL);
  await addPlatform(testOrg.id, 'google', 'https://g.page/r/test/review');
});

test.afterAll(async () => {
  if (testOrg) await cleanupTestOrg(testOrg.id);
  if (testUserId) await deleteTestUser(testUserId);
});

test.describe('API — Review Submission', () => {
  test('submit positive review (5 stars)', async ({ request }) => {
    const res = await request.post('/api/reviews/submit', {
      data: {
        slug: testOrg.slug,
        rating: 5,
        comment: 'E2E test - great!',
        customerName: 'API Test User',
        source: 'direct',
      },
    });

    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.isPositive).toBe(true);
    expect(data.reviewId).toBeTruthy();
  });

  test('submit negative review (2 stars)', async ({ request }) => {
    const res = await request.post('/api/reviews/submit', {
      data: {
        slug: testOrg.slug,
        rating: 2,
        comment: 'E2E test - needs improvement',
        customerName: 'Unhappy Tester',
        source: 'direct',
      },
    });

    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.isPositive).toBe(false);
  });

  test('review submission fails for invalid slug', async ({ request }) => {
    const res = await request.post('/api/reviews/submit', {
      data: {
        slug: 'nonexistent-business-xyz',
        rating: 5,
        comment: 'Should fail',
      },
    });

    expect(res.status()).toBe(404);
  });

  test('review submission fails without rating', async ({ request }) => {
    const res = await request.post('/api/reviews/submit', {
      data: {
        slug: testOrg.slug,
        comment: 'Missing rating',
      },
    });

    expect(res.status()).toBe(400);
  });

  test('review submission fails with out-of-range rating', async ({ request }) => {
    const res = await request.post('/api/reviews/submit', {
      data: {
        slug: testOrg.slug,
        rating: 6,
      },
    });

    expect(res.status()).toBe(400);
  });

  test('review submission rejects overly long comment', async ({ request }) => {
    const res = await request.post('/api/reviews/submit', {
      data: {
        slug: testOrg.slug,
        rating: 5,
        comment: 'x'.repeat(10001),
      },
    });

    expect(res.status()).toBe(400);
  });
});

test.describe('API — Staff Invite', () => {
  test('invite requires authentication', async ({ request }) => {
    const res = await request.post('/api/staff/invite', {
      data: {
        email: 'test@example.com',
        orgId: testOrg.id,
      },
    });

    expect(res.status()).toBe(401);
  });

  test('invite requires email and orgId', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);

    const res = await page.request.post('/api/staff/invite', {
      data: { email: '', orgId: testOrg.id },
    });

    expect(res.status()).toBe(400);
  });
});

test.describe('API — Stripe Webhook', () => {
  test('webhook endpoint exists and rejects unsigned requests', async ({ request }) => {
    const res = await request.post('/api/stripe/webhook', {
      data: { type: 'checkout.session.completed' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Should return 400 because the Stripe signature is missing/invalid
    expect(res.status()).toBe(400);
  });
});

test.describe('API — Review Submission Sources', () => {
  test('accepts qr source', async ({ request }) => {
    const res = await request.post('/api/reviews/submit', {
      data: {
        slug: testOrg.slug,
        rating: 4,
        source: 'qr',
        customerName: 'QR Customer',
      },
    });

    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('accepts sms source', async ({ request }) => {
    const res = await request.post('/api/reviews/submit', {
      data: {
        slug: testOrg.slug,
        rating: 3,
        source: 'sms',
        customerName: 'SMS Customer',
      },
    });

    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
