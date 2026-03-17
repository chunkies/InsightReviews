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
// Auth Flow E2E Tests
// Tests: login page, signup page, magic link flow, logout, redirects
// ═══════════════════════════════════════════════════════════════════════════════

let testUserId: string;
let testOrg: TestOrg;
const TEST_EMAIL = `e2e-auth-${Date.now()}@test.com`;

test.describe('Auth — Login Page', () => {
  test('shows email field and Send Magic Link button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible();
  });

  test('does NOT show Full Name field on login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Full Name')).not.toBeVisible();
  });

  test('shows Create Account link on login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible();
  });

  test('submit button is disabled when email is empty', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeDisabled();
  });

  test('submit button is enabled after entering email', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email address').fill('test@example.com');
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeEnabled();
  });
});

test.describe('Auth — Signup Page', () => {
  test('shows Full Name and Email fields', async ({ page }) => {
    await page.goto('/auth/login?mode=signup');
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
  });

  test('shows Create Account button', async ({ page }) => {
    await page.goto('/auth/login?mode=signup');
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('shows 14-day free trial messaging', async ({ page }) => {
    await page.goto('/auth/login?mode=signup');
    await expect(page.getByText('Start your 14-day free trial')).toBeVisible();
    await expect(page.getByText('14 days free')).toBeVisible();
  });

  test('shows Sign in link', async ({ page }) => {
    await page.goto('/auth/login?mode=signup');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('toggle between login and signup', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(page).toHaveURL(/mode=signup/);
    await expect(page.getByLabel('Full Name')).toBeVisible();

    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByLabel('Full Name')).not.toBeVisible();
  });
});

test.describe('Auth — Protected Route Redirects', () => {
  test('unauthenticated user on /dashboard → redirects to /auth/login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated user on /dashboard/reviews → redirects to /auth/login', async ({ page }) => {
    await page.goto('/dashboard/reviews');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('unauthenticated user on /onboarding → redirects to /auth/login', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('Auth — Authenticated User Flow', () => {
  test.beforeAll(async () => {
    const user = await createTestUser(TEST_EMAIL);
    testUserId = user.id;
    testOrg = await createTestOrg(testUserId, TEST_EMAIL);
  });

  test.afterAll(async () => {
    if (testOrg) await cleanupTestOrg(testOrg.id);
    if (testUserId) await deleteTestUser(testUserId);
  });

  test('authenticated user can access dashboard', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard');
    // Should stay on dashboard, not redirect to login
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');
  });

  test('authenticated user on /auth/login → page loads (public route)', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    // /auth/login is a public route — middleware lets it through
    // The login form should still be visible
    await expect(page.getByLabel('Email address')).toBeVisible();
  });
});

test.describe('Auth — New User Without Org', () => {
  let newUserId: string;
  const NEW_EMAIL = `e2e-newuser-${Date.now()}@test.com`;

  test.beforeAll(async () => {
    const user = await createTestUser(NEW_EMAIL);
    newUserId = user.id;
  });

  test.afterAll(async () => {
    if (newUserId) await deleteTestUser(newUserId);
  });

  test('new user without org → redirected to /onboarding', async ({ page }) => {
    await signInAsUser(page, NEW_EMAIL);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/onboarding/);
  });
});
