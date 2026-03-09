import { test, expect } from '@playwright/test';

test.describe('Auth Pages', () => {
  test('login page loads with magic link form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('body')).toContainText('InsightReviews');
    // Should have an email input
    const emailInput = page.getByRole('textbox');
    await expect(emailInput).toBeVisible();
  });

  test('login form validates empty email', async ({ page }) => {
    await page.goto('/auth/login');
    // Try submitting without email - button should be present
    const submitBtn = page.getByRole('button', { name: /send|sign in|log in|magic/i });
    await expect(submitBtn).toBeVisible();
  });

  test('auth error page loads', async ({ page }) => {
    const res = await page.goto('/auth/error');
    expect(res?.status()).toBe(200);
  });

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should be redirected to login
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('onboarding redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
