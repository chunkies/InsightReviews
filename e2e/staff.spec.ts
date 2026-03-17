import { test, expect } from '@playwright/test';
import {
  createTestUser,
  deleteTestUser,
  signInAsUser,
  createTestOrg,
  cleanupTestOrg,
  supabaseRest,
  type TestOrg,
} from './helpers';

// ═══════════════════════════════════════════════════════════════════════════════
// Staff Management E2E Tests
// Tests: invite staff, view members, remove staff, role assignment
// ═══════════════════════════════════════════════════════════════════════════════

let ownerUserId: string;
let testOrg: TestOrg;
const OWNER_EMAIL = `e2e-staff-owner-${Date.now()}@test.com`;
const INVITE_EMAIL = `e2e-staff-invite-${Date.now()}@test.com`;

test.beforeAll(async () => {
  const user = await createTestUser(OWNER_EMAIL);
  ownerUserId = user.id;
  testOrg = await createTestOrg(ownerUserId, OWNER_EMAIL);
});

test.afterAll(async () => {
  if (testOrg) await cleanupTestOrg(testOrg.id);
  if (ownerUserId) await deleteTestUser(ownerUserId);
});

test.describe('Staff — Page Display', () => {
  test('shows staff page with owner listed', async ({ page }) => {
    await signInAsUser(page, OWNER_EMAIL);
    await page.goto('/dashboard/staff');

    await expect(page.locator('h5').getByText('Staff')).toBeVisible();
    // Owner should be listed
    await expect(page.getByText(OWNER_EMAIL)).toBeVisible();
  });

  test('shows invite button for owner', async ({ page }) => {
    await signInAsUser(page, OWNER_EMAIL);
    await page.goto('/dashboard/staff');

    await expect(page.getByRole('button', { name: /invite/i })).toBeVisible();
  });
});

test.describe('Staff — Invite Flow', () => {
  test('can invite a new staff member via API', async ({ page }) => {
    await signInAsUser(page, OWNER_EMAIL);

    // Use the API directly to test invite
    const res = await page.request.post('/api/staff/invite', {
      data: { email: INVITE_EMAIL, orgId: testOrg.id },
    });

    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.member.status).toBe('pending');
    expect(data.member.email).toBe(INVITE_EMAIL);
  });

  test('invited staff appears in staff list', async ({ page }) => {
    await signInAsUser(page, OWNER_EMAIL);
    await page.goto('/dashboard/staff');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(INVITE_EMAIL)).toBeVisible({ timeout: 10000 });
  });

  test('cannot invite duplicate staff member', async ({ page }) => {
    await signInAsUser(page, OWNER_EMAIL);

    const res = await page.request.post('/api/staff/invite', {
      data: { email: INVITE_EMAIL, orgId: testOrg.id },
    });

    expect(res.status()).toBe(409);
    const data = await res.json();
    expect(data.error).toContain('already a member');
  });
});

test.describe('Staff — Remove Member', () => {
  let removableUserId: string;
  const REMOVE_EMAIL = `e2e-staff-remove-${Date.now()}@test.com`;

  test.beforeAll(async () => {
    const user = await createTestUser(REMOVE_EMAIL);
    removableUserId = user.id;

    // Add as staff member
    await supabaseRest('organization_members', {
      method: 'POST',
      body: {
        organization_id: testOrg.id,
        user_id: removableUserId,
        role: 'staff',
        status: 'active',
        email: REMOVE_EMAIL,
        display_name: 'Removable Staff',
      },
    });
  });

  test.afterAll(async () => {
    if (removableUserId) await deleteTestUser(removableUserId);
  });

  test('staff member appears in list', async ({ page }) => {
    await signInAsUser(page, OWNER_EMAIL);
    await page.goto('/dashboard/staff');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(REMOVE_EMAIL)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Staff — Access Control', () => {
  let staffUserId: string;
  let staffOrg: TestOrg;
  const STAFF_EMAIL = `e2e-staff-access-${Date.now()}@test.com`;

  test.beforeAll(async () => {
    const user = await createTestUser(STAFF_EMAIL);
    staffUserId = user.id;

    // Add as staff to existing org
    await supabaseRest('organization_members', {
      method: 'POST',
      body: {
        organization_id: testOrg.id,
        user_id: staffUserId,
        role: 'staff',
        status: 'active',
        email: STAFF_EMAIL,
        display_name: 'Staff User',
      },
    });
  });

  test.afterAll(async () => {
    // Clean up the staff member
    await supabaseRest('organization_members', {
      method: 'DELETE',
      query: `user_id=eq.${staffUserId}&organization_id=eq.${testOrg.id}`,
    });
    if (staffUserId) await deleteTestUser(staffUserId);
  });

  test('staff user can access dashboard', async ({ page }) => {
    await signInAsUser(page, STAFF_EMAIL);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/dashboard');
  });

  test('staff user cannot invite other staff', async ({ page }) => {
    await signInAsUser(page, STAFF_EMAIL);

    const res = await page.request.post('/api/staff/invite', {
      data: { email: 'another@test.com', orgId: testOrg.id },
    });

    expect(res.status()).toBe(403);
  });
});
