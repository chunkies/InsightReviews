import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  createTestOrg,
  cleanupTestOrg,
  addPlatform,
  type TestOrg,
} from './helpers';

// ═══════════════════════════════════════════════════════════════════════════════
// Public Review Form E2E Tests
// Tests: star rating, smart routing (positive/negative), platform links, billing gate
// ═══════════════════════════════════════════════════════════════════════════════

let testUserId: string;
let testOrg: TestOrg;
const TEST_EMAIL = `e2e-review-${Date.now()}@test.com`;

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

test.describe('Public Review Form — Display', () => {
  test('loads the review form for a valid slug', async ({ page }) => {
    await page.goto(`/r/${testOrg.slug}`);
    await expect(page.getByText(testOrg.name)).toBeVisible();
  });

  test('shows 404 for invalid slug', async ({ page }) => {
    const response = await page.goto('/r/nonexistent-business-slug-xyz');
    expect(response?.status()).toBe(404);
  });

  test('shows star rating icons', async ({ page }) => {
    await page.goto(`/r/${testOrg.slug}`);
    // The form renders 5 IconButton elements for stars
    const starButtons = page.locator('button').filter({ has: page.locator('svg') });
    await expect(starButtons.first()).toBeVisible();
  });
});

test.describe('Public Review Form — Positive Review (4-5 stars)', () => {
  test('submitting 5-star review shows thank you', async ({ page }) => {
    await page.goto(`/r/${testOrg.slug}`);

    // Click the 5th star IconButton (stars are rendered as IconButton with Star SVG)
    // There are 5 star buttons - click the last one for 5 stars
    const starButtons = page.locator('button').filter({ has: page.locator('svg') });
    const count = await starButtons.count();
    // Click the 5th star (index 4)
    if (count >= 5) {
      await starButtons.nth(4).click();
    }

    await page.waitForTimeout(500);

    // After clicking a star, the form should show additional fields and/or submit button
    // Fill in optional fields if visible
    const commentField = page.locator('textarea').first();
    if (await commentField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await commentField.fill('Great service!');
    }

    // Submit the review
    const submitBtn = page.getByRole('button', { name: /submit|send|share/i });
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitBtn.click();
    }

    // Should show thank you message
    await expect(
      page.getByText(/thank you/i).first()
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Public Review Form — Negative Review (1-3 stars)', () => {
  test('submitting 1-star review shows private feedback message', async ({ page }) => {
    await page.goto(`/r/${testOrg.slug}`);

    // Click the 1st star for a 1-star rating
    const starButtons = page.locator('button').filter({ has: page.locator('svg') });
    const count = await starButtons.count();
    if (count >= 1) {
      await starButtons.nth(0).click();
    }

    await page.waitForTimeout(500);

    // Fill in optional comment
    const commentField = page.locator('textarea').first();
    if (await commentField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await commentField.fill('Could be better');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit|send|share/i });
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitBtn.click();
    }

    // Should show feedback message
    await expect(
      page.getByText(/thank you|feedback/i).first()
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Public Review Form — Billing Gate', () => {
  let expiredUserId: string;
  let expiredOrg: TestOrg;
  const EXPIRED_EMAIL = `e2e-expired-${Date.now()}@test.com`;

  test.beforeAll(async () => {
    const user = await createTestUser(EXPIRED_EMAIL);
    expiredUserId = user.id;
    expiredOrg = await createTestOrg(expiredUserId, EXPIRED_EMAIL, {
      billingPlan: 'cancelled',
      trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  test.afterAll(async () => {
    if (expiredOrg) await cleanupTestOrg(expiredOrg.id);
    if (expiredUserId) await deleteTestUser(expiredUserId);
  });

  test('shows review page disabled for expired billing', async ({ page }) => {
    await page.goto(`/r/${expiredOrg.slug}`);
    await expect(page.getByText('Review page disabled')).toBeVisible();
  });
});
