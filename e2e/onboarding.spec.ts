import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  signInAsUser,
  cleanupTestOrg,
  supabaseRest,
} from './helpers';

// ═══════════════════════════════════════════════════════════════════════════════
// Onboarding Flow E2E Tests
// Tests: wizard steps, validation, org creation, Stripe redirect
// ═══════════════════════════════════════════════════════════════════════════════

let testUserId: string;
let createdOrgId: string | null = null;
const TEST_EMAIL = `e2e-onboard-${Date.now()}@test.com`;

test.beforeAll(async () => {
  const user = await createTestUser(TEST_EMAIL);
  testUserId = user.id;
});

test.afterAll(async () => {
  if (createdOrgId) await cleanupTestOrg(createdOrgId);
  if (testUserId) await deleteTestUser(testUserId);
});

test.describe('Onboarding — Wizard Flow', () => {
  test('displays Step 1 with name and business fields', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/onboarding');

    await expect(page.getByText('Set Up Your Business')).toBeVisible();
    await expect(page.getByLabel('Your Name')).toBeVisible();
    await expect(page.getByLabel('Business Name')).toBeVisible();
    await expect(page.getByLabel(/Business Phone/)).toBeVisible();
  });

  test('Next button disabled when business name is empty', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/onboarding');

    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  });

  test('Next button enabled after entering business name', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/onboarding');

    await page.getByLabel('Business Name').fill('My Test Cafe');
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
  });

  test('navigates to Step 2 and shows platform fields', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/onboarding');

    await page.getByLabel('Your Name').fill('John Smith');
    await page.getByLabel('Business Name').fill('My Test Cafe');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 2 — Review Platforms
    await expect(page.getByLabel('Google Business Review URL')).toBeVisible();
    await expect(page.getByLabel(/Yelp Review URL/)).toBeVisible();
    await expect(page.getByLabel(/Facebook Review URL/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create My Review Page' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Skip/i })).toBeVisible();
  });

  test('Back button returns to Step 1 with data preserved', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/onboarding');

    await page.getByLabel('Your Name').fill('John Smith');
    await page.getByLabel('Business Name').fill('My Test Cafe');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await page.getByRole('button', { name: 'Back' }).click();

    // Data should be preserved
    await expect(page.getByLabel('Your Name')).toHaveValue('John Smith');
    await expect(page.getByLabel('Business Name')).toHaveValue('My Test Cafe');
  });

  test('submitting onboarding creates org and redirects to dashboard (no Stripe checkout)', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/onboarding');

    // Step 1
    await page.getByLabel('Your Name').fill('E2E Owner');
    await page.getByLabel('Business Name').fill(`E2E Biz ${Date.now()}`);
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 2 — use skip button (no Stripe checkout needed)
    await page.getByRole('button', { name: /Skip/i }).click();

    // Wait for redirect to dashboard (not Stripe)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Verify org was created
    const membersRes = await supabaseRest<{ organization_id: string }[]>('organization_members', {
      query: `user_id=eq.${testUserId}&select=organization_id`,
    });
    if (membersRes.data && membersRes.data[0]) {
      createdOrgId = membersRes.data[0].organization_id;
    }
    expect(createdOrgId).toBeTruthy();
  });
});

test.describe('Onboarding — Name Pre-fill from Metadata', () => {
  let prefillUserId: string;
  const PREFILL_EMAIL = `e2e-prefill-${Date.now()}@test.com`;

  test.beforeAll(async () => {
    // Create user with full_name in metadata
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'}/auth/v1/admin/users`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: PREFILL_EMAIL,
          password: 'testpassword123',
          email_confirm: true,
          user_metadata: { full_name: 'Pre-filled Name' },
        }),
      },
    );
    const user = await res.json();
    prefillUserId = user.id;
  });

  test.afterAll(async () => {
    if (prefillUserId) await deleteTestUser(prefillUserId);
  });

  test('pre-fills Your Name from user metadata', async ({ page }) => {
    await signInAsUser(page, PREFILL_EMAIL);
    await page.goto('/onboarding');
    await expect(page.getByLabel('Your Name')).toHaveValue('Pre-filled Name');
  });
});
