import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  signInAsUser,
  createTestOrg,
  cleanupTestOrg,
  submitReview,
  type TestOrg,
} from './helpers';

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard E2E Tests
// Tests: dashboard home, navigation, stats display, all dashboard pages
// ═══════════════════════════════════════════════════════════════════════════════

let testUserId: string;
let testOrg: TestOrg;
const TEST_EMAIL = `e2e-dash-${Date.now()}@test.com`;

test.beforeAll(async () => {
  const user = await createTestUser(TEST_EMAIL);
  testUserId = user.id;
  testOrg = await createTestOrg(testUserId, TEST_EMAIL);

  // Seed some reviews for stats
  await submitReview(testOrg.slug, 5, { comment: 'Amazing!', customerName: 'Alice' });
  await submitReview(testOrg.slug, 4, { comment: 'Very good', customerName: 'Bob' });
  await submitReview(testOrg.slug, 2, { comment: 'Not great', customerName: 'Charlie' });
});

test.afterAll(async () => {
  if (testOrg) await cleanupTestOrg(testOrg.id);
  if (testUserId) await deleteTestUser(testUserId);
});

test.describe('Dashboard — Home Page', () => {
  test('loads dashboard with heading', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard');
    await expect(page.locator('h5').getByText('Dashboard')).toBeVisible();
  });
});

test.describe('Dashboard — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
  });

  test('navigates to Collect Reviews page', async ({ page }) => {
    await page.goto('/dashboard/collect');
    await expect(page.locator('h5').getByText('Collect Reviews')).toBeVisible();
  });

  test('navigates to Reviews page', async ({ page }) => {
    await page.goto('/dashboard/reviews');
    await expect(page.locator('h5').filter({ hasText: 'Reviews' })).toBeVisible();
  });

  test('navigates to Staff page', async ({ page }) => {
    await page.goto('/dashboard/staff');
    await expect(page.locator('h5').getByText('Staff')).toBeVisible();
  });

  test('navigates to Testimonials page', async ({ page }) => {
    await page.goto('/dashboard/testimonials');
    await expect(page.locator('h5').getByText('Testimonials')).toBeVisible();
  });

  test('navigates to Settings page', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.locator('h5').getByText('Settings')).toBeVisible();
  });

  test('navigates to Billing page', async ({ page }) => {
    await page.goto('/dashboard/billing');
    await expect(page.locator('h5').getByText('Billing')).toBeVisible();
  });
});

test.describe('Dashboard — Reviews Page', () => {
  test('shows submitted reviews', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/reviews');
    await page.waitForLoadState('networkidle');
    // Should show at least one review name
    await expect(page.getByText(/alice|bob|charlie/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard — Collect Page', () => {
  test('shows review collection form', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/collect');
    await expect(page.locator('h5').getByText('Collect Reviews')).toBeVisible();
  });
});
