import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  signInAsUser,
  createTestOrg,
  cleanupTestOrg,
  type TestOrg,
} from './helpers';

// ═══════════════════════════════════════════════════════════════════════════════
// Profile Page E2E Tests
// Tests: page display, form fields, save changes, sidebar navigation
// ═══════════════════════════════════════════════════════════════════════════════

let testUserId: string;
let testOrg: TestOrg;
const TEST_EMAIL = `e2e-profile-${Date.now()}@test.com`;

test.beforeAll(async () => {
  const user = await createTestUser(TEST_EMAIL);
  testUserId = user.id;
  testOrg = await createTestOrg(testUserId, TEST_EMAIL);
});

test.afterAll(async () => {
  if (testOrg) await cleanupTestOrg(testOrg.id);
  if (testUserId) await deleteTestUser(testUserId);
});

test.describe('Profile — Page Display', () => {
  test('loads profile page with heading', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await expect(page.locator('h5').getByText('My Profile')).toBeVisible();
  });

  test('shows display name field', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await expect(page.getByLabel('Display Name')).toBeVisible();
  });

  test('shows email field (disabled)', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    const emailField = page.getByLabel('Email');
    await expect(emailField).toBeVisible();
    await expect(emailField).toBeDisabled();
  });

  test('shows phone field', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await expect(page.getByLabel('Phone')).toBeVisible();
  });

  test('shows job title field', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await expect(page.getByLabel('Job Title')).toBeVisible();
  });

  test('shows timezone selector', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await expect(page.getByText('Timezone').first()).toBeVisible();
  });

  test('shows role chip', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await expect(page.getByText('Owner')).toBeVisible();
  });

  test('display name is pre-filled from test data', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await expect(page.getByLabel('Display Name')).toHaveValue('E2E Test User');
  });
});

test.describe('Profile — Save Changes', () => {
  test('save button is disabled when no changes', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await expect(page.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  test('save button enables after changing a field', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await page.getByLabel('Job Title').fill('Manager');
    await expect(page.getByRole('button', { name: /save/i })).toBeEnabled();
  });
});

test.describe('Profile — Header Navigation', () => {
  test('profile is accessible via direct URL', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/profile');
    await expect(page.locator('h5').getByText('My Profile')).toBeVisible();
  });
});

test.describe('Profile — Settings Page Cleanup', () => {
  test('settings page no longer shows profile form', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/settings');
    await expect(page.locator('h5').getByText('Settings')).toBeVisible();
    await expect(page.getByText('Your Profile')).not.toBeVisible();
  });
});
