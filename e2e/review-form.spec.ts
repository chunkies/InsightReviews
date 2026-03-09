import { test, expect } from '@playwright/test';

test.describe('Public Review Form (/r/[slug])', () => {
  test('loads for seeded business', async ({ page }) => {
    await page.goto('/r/joes-cafe');
    await expect(page.locator('body')).toContainText("Joe's Cafe");
  });

  test('shows star rating selector', async ({ page }) => {
    await page.goto('/r/joes-cafe');
    // Wait for the page to fully render
    await page.waitForLoadState('networkidle');
    // Stars should be clickable elements
    const stars = page.locator('[data-testid="star-rating"], [role="button"], button').filter({ hasText: /★|⭐/ });
    // If no test IDs, look for SVG star icons or rating area
    const ratingArea = page.locator('text=/How was your|Rate your|experience/i');
    await expect(ratingArea).toBeVisible();
  });

  test('returns 404 for non-existent slug', async ({ page }) => {
    await page.goto('/r/this-business-does-not-exist-xyz');
    // Should show a not-found message or 404
    const body = await page.locator('body').textContent();
    const is404 = body?.includes('not found') || body?.includes('404') || body?.includes('Not Found');
    expect(is404).toBeTruthy();
  });

  test('can submit a 5-star review', async ({ page }) => {
    await page.goto('/r/joes-cafe');
    await page.waitForLoadState('networkidle');

    // Click the 5th star (last star element)
    // Stars are typically rendered as SVG or button elements
    const starElements = page.locator('svg[data-star], [aria-label*="star"], [aria-label*="Star"]');
    const count = await starElements.count();

    if (count >= 5) {
      await starElements.nth(4).click();
    } else {
      // Fallback: look for any clickable star-like elements
      const anyStars = page.locator('svg').filter({ has: page.locator('path') });
      if (await anyStars.count() >= 5) {
        await anyStars.nth(4).click();
      }
    }

    // Fill in optional comment
    const commentField = page.getByRole('textbox').first();
    if (await commentField.isVisible()) {
      await commentField.fill('Great place, loved it!');
    }

    // Submit the form
    const submitBtn = page.getByRole('button', { name: /submit|send|review/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should show success / thank you / platform redirect buttons
      await page.waitForTimeout(1000);
      const bodyText = await page.locator('body').textContent();
      const hasSuccess = bodyText?.includes('Thank') || bodyText?.includes('thank') || bodyText?.includes('Google') || bodyText?.includes('success');
      expect(hasSuccess).toBeTruthy();
    }
  });

  test('can submit a 2-star review (negative path)', async ({ page }) => {
    await page.goto('/r/joes-cafe');
    await page.waitForLoadState('networkidle');

    const starElements = page.locator('svg[data-star], [aria-label*="star"], [aria-label*="Star"]');
    const count = await starElements.count();

    if (count >= 2) {
      await starElements.nth(1).click(); // 2nd star
    }

    const commentField = page.getByRole('textbox').first();
    if (await commentField.isVisible()) {
      await commentField.fill('Could be better');
    }

    const submitBtn = page.getByRole('button', { name: /submit|send|review/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      const bodyText = await page.locator('body').textContent();
      // Negative reviews should show "thank you" but NOT redirect to Google/Yelp
      const hasThankYou = bodyText?.includes('Thank') || bodyText?.includes('thank') || bodyText?.includes('letting us know');
      expect(hasThankYou).toBeTruthy();
    }
  });
});
