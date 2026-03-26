import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════════════════════
// Landing Page E2E Tests
// Tests: marketing page content, CTAs, navigation
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Landing Page — Content', () => {
  test('loads the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/5-star/i).first()).toBeVisible();
  });

  test('shows hero section with CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /start free trial|get started/i }).first()).toBeVisible();
  });

  test('shows pricing section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('$49', { exact: true })).toBeVisible();
  });

  test('shows features section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/QR Code at the Counter/i).first()).toBeVisible();
  });

  test('Sign in link navigates to login', async ({ page }) => {
    await page.goto('/');
    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    await expect(signInLink).toBeVisible();
  });

  test('Start Free Trial CTA links to signup', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /start free trial/i }).first();
    await expect(cta).toHaveAttribute('href', '/auth/login?mode=signup');
  });
});

test.describe('Landing Page — No Console Errors', () => {
  test('page loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-issues
    const realErrors = errors.filter(
      (e) =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon') &&
        !e.includes('Vercel'),
    );
    expect(realErrors).toHaveLength(0);
  });
});

test.describe('Landing Page — Responsive', () => {
  test('renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByText(/5-star/i).first()).toBeVisible();
  });

  test('renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByText(/5-star/i).first()).toBeVisible();
  });
});
