import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  signInAsUser,
  createTestOrg,
  cleanupTestOrg,
  submitReview,
  supabaseRest,
  type TestOrg,
} from './helpers';

// ═══════════════════════════════════════════════════════════════════════════════
// Testimonials & Wall E2E Tests
// Tests: testimonial page, wall display, review curation
// ═══════════════════════════════════════════════════════════════════════════════

let testUserId: string;
let testOrg: TestOrg;
const TEST_EMAIL = `e2e-wall-${Date.now()}@test.com`;

test.beforeAll(async () => {
  const user = await createTestUser(TEST_EMAIL);
  testUserId = user.id;
  testOrg = await createTestOrg(testUserId, TEST_EMAIL);

  // Add some public reviews for the wall
  const review1 = await submitReview(testOrg.slug, 5, { comment: 'Absolutely amazing!', customerName: 'Wall Alice' });
  const review2 = await submitReview(testOrg.slug, 5, { comment: 'Best place ever', customerName: 'Wall Bob' });

  // Make reviews public (positive reviews are auto-published)
  if (review1.reviewId) {
    await supabaseRest('reviews', {
      method: 'PATCH',
      query: `id=eq.${review1.reviewId}`,
      body: { is_public: true },
    });
  }
  if (review2.reviewId) {
    await supabaseRest('reviews', {
      method: 'PATCH',
      query: `id=eq.${review2.reviewId}`,
      body: { is_public: true },
    });
  }
});

test.afterAll(async () => {
  if (testOrg) await cleanupTestOrg(testOrg.id);
  if (testUserId) await deleteTestUser(testUserId);
});

test.describe('Testimonials — Dashboard Page', () => {
  test('loads testimonials management page', async ({ page }) => {
    await signInAsUser(page, TEST_EMAIL);
    await page.goto('/dashboard/testimonials');
    await expect(page.getByRole('heading', { name: 'Testimonials', level: 5 })).toBeVisible();
  });
});

test.describe('Testimonial Wall — Public Page', () => {
  test('loads the public testimonial wall', async ({ page }) => {
    await page.goto(`/wall/${testOrg.slug}`);
    // Should display the business name
    await expect(page.getByText(testOrg.name)).toBeVisible();
  });

  test('shows public reviews on the wall', async ({ page }) => {
    await page.goto(`/wall/${testOrg.slug}`);
    await page.waitForLoadState('networkidle');

    // Should show the reviews we created
    const content = await page.content();
    const hasReviews = content.includes('Wall Alice') || content.includes('Wall Bob') || content.includes('amazing') || content.includes('Best place');
    expect(hasReviews).toBe(true);
  });

  test('returns 404 for invalid wall slug', async ({ page }) => {
    const response = await page.goto('/wall/nonexistent-slug-xyz');
    expect(response?.status()).toBe(404);
  });
});
