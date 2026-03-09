import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads and shows brand name', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/InsightReviews/);
    await expect(page.locator('body')).toContainText('InsightReviews');
  });

  test('has hero section with CTA', async ({ page }) => {
    await page.goto('/');
    // Should have a primary call-to-action button
    const cta = page.getByRole('link', { name: /get started|start free|try free/i });
    await expect(cta).toBeVisible();
  });

  test('has pricing section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('$29');
  });

  test('has navigation to login', async ({ page }) => {
    await page.goto('/');
    const loginLink = page.getByRole('link', { name: /log in|sign in/i });
    await expect(loginLink).toBeVisible();
  });

  test('FAQ section is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Frequently Asked');
  });
});
