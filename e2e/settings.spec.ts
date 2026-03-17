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
// Settings E2E Tests
// Tests: business profile, platform management, notification settings
// ═══════════════════════════════════════════════════════════════════════════════

let testUserId: string;
let testOrg: TestOrg;
const TEST_EMAIL = `e2e-settings-${Date.now()}@test.com`;

test.beforeAll(async () => {
  const user = await createTestUser(TEST_EMAIL);
  testUserId = user.id;
  testOrg = await createTestOrg(testUserId, TEST_EMAIL);
});

test.afterAll(async () => {
  if (testOrg) await cleanupTestOrg(testOrg.id);
  if (testUserId) await deleteTestUser(testUserId);
});

test.describe('Settings — Page Display', () => {
  test('loads settings page', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/settings');
    await expect(page.locator('h5').getByText('Settings')).toBeVisible();
  });

  test('shows business name field', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/settings');
    await expect(page.getByLabel(/business name/i)).toBeVisible();
  });

  test('business name is pre-filled', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/settings');
    const nameInput = page.getByLabel(/business name/i);
    await expect(nameInput).toHaveValue(testOrg.name);
  });
});

test.describe('Settings — Profile Form', () => {
  test('shows profile section with display name', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/settings');
    // Profile form should have a display name field
    await expect(page.getByText(/profile|display name/i).first()).toBeVisible();
  });
});

test.describe('Settings — Save Changes', () => {
  test('save button is present', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/settings');
    await expect(page.getByRole('button', { name: /save settings/i })).toBeVisible();
  });
});
