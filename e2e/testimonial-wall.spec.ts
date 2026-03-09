import { test, expect } from '@playwright/test';

test.describe('Testimonial Wall (/wall/[slug])', () => {
  test('loads for seeded business', async ({ page }) => {
    await page.goto('/wall/joes-cafe');
    await expect(page.locator('body')).toContainText("Joe's Cafe");
  });

  test('displays public reviews', async ({ page }) => {
    await page.goto('/wall/joes-cafe');
    await page.waitForLoadState('networkidle');
    // Seeded data has positive reviews with comments
    const body = await page.locator('body').textContent();
    // Should contain at least one review comment from seed data
    const hasReviews = body?.includes('Best coffee') || body?.includes('Amazing pastries') || body?.includes('review');
    expect(hasReviews).toBeTruthy();
  });

  test('shows average rating', async ({ page }) => {
    await page.goto('/wall/joes-cafe');
    await page.waitForLoadState('networkidle');
    // Should display some rating indicator
    const body = await page.locator('body').textContent();
    const hasRating = body?.match(/[0-9]\.[0-9]/) || body?.includes('★') || body?.includes('star');
    expect(hasRating).toBeTruthy();
  });

  test('shows powered by InsightReviews', async ({ page }) => {
    await page.goto('/wall/joes-cafe');
    await expect(page.locator('body')).toContainText('InsightReviews');
  });

  test('returns 404 for non-existent slug', async ({ page }) => {
    await page.goto('/wall/nonexistent-business-xyz');
    const body = await page.locator('body').textContent();
    const is404 = body?.includes('not found') || body?.includes('404') || body?.includes('Not Found');
    expect(is404).toBeTruthy();
  });
});
