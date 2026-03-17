import { describe, it, expect } from 'vitest';
import type { Role, OrganizationMember } from '@/lib/types/database';

// ═══════════════════════════════════════════════════════════════════════════════
// Staff roles — CRUD operations, permissions, invite with role assignment
// ═══════════════════════════════════════════════════════════════════════════════

// Simulate the roles API logic (mirrors app/api/staff/roles/route.ts)

type MemberRole = 'owner' | 'staff';

interface ApiUser {
  id: string;
  email?: string;
}

interface ApiMember {
  organization_id: string;
  role: MemberRole;
  role_id: string | null;
}

interface RoleRecord {
  id: string;
  organization_id: string;
  name: string;
  permissions: string[];
  created_at: string;
}

interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

// --- GET /api/staff/roles ---

function simulateGetRoles(
  user: ApiUser | null,
  member: ApiMember | null,
  orgRoles: RoleRecord[],
  rolesError: { message: string } | null,
): ApiResult {
  if (!user) return { status: 401, body: { error: 'Unauthorized' } };
  if (!member) return { status: 404, body: { error: 'No organization' } };
  if (rolesError) return { status: 500, body: { error: rolesError.message } };
  return { status: 200, body: { roles: orgRoles } };
}

// --- POST /api/staff/roles ---

function simulateCreateRole(
  user: ApiUser | null,
  member: ApiMember | null,
  payload: { name?: string; permissions?: string[] },
  existingRoleNames: string[],
): ApiResult {
  if (!user) return { status: 401, body: { error: 'Unauthorized' } };
  if (!member || member.role !== 'owner') {
    return { status: 403, body: { error: 'Only owners can manage roles' } };
  }

  const name = payload.name?.trim();
  if (!name) return { status: 400, body: { error: 'Role name is required' } };

  if (existingRoleNames.includes(name)) {
    return { status: 409, body: { error: 'A role with this name already exists' } };
  }

  const role: RoleRecord = {
    id: `role-${Date.now()}`,
    organization_id: member.organization_id,
    name,
    permissions: payload.permissions || [],
    created_at: new Date().toISOString(),
  };

  return { status: 200, body: { role } };
}

// --- PATCH /api/staff/roles ---

function simulateUpdateRole(
  user: ApiUser | null,
  member: ApiMember | null,
  payload: { id?: string; name?: string; permissions?: string[] },
  existingRole: RoleRecord | null,
  existingRoleNames: string[],
): ApiResult {
  if (!user) return { status: 401, body: { error: 'Unauthorized' } };
  if (!member || member.role !== 'owner') {
    return { status: 403, body: { error: 'Only owners can manage roles' } };
  }
  if (!payload.id) return { status: 400, body: { error: 'Role id is required' } };
  if (!existingRole) return { status: 500, body: { error: 'Role not found' } };

  const updatedName = payload.name !== undefined ? payload.name.trim() : existingRole.name;
  const updatedPermissions = payload.permissions !== undefined ? payload.permissions : existingRole.permissions;

  // Check for duplicate name (excluding current role)
  if (payload.name !== undefined && existingRoleNames.filter(n => n !== existingRole.name).includes(updatedName)) {
    return { status: 409, body: { error: 'A role with this name already exists' } };
  }

  const role: RoleRecord = {
    ...existingRole,
    name: updatedName,
    permissions: updatedPermissions,
  };

  return { status: 200, body: { role } };
}

// --- DELETE /api/staff/roles ---

function simulateDeleteRole(
  user: ApiUser | null,
  member: ApiMember | null,
  payload: { id?: string },
  assignedMemberCount: number,
): ApiResult {
  if (!user) return { status: 401, body: { error: 'Unauthorized' } };
  if (!member || member.role !== 'owner') {
    return { status: 403, body: { error: 'Only owners can manage roles' } };
  }
  if (!payload.id) return { status: 400, body: { error: 'Role id is required' } };

  if (assignedMemberCount > 0) {
    return {
      status: 409,
      body: { error: `Cannot delete: ${assignedMemberCount} staff member(s) are assigned to this role. Reassign them first.` },
    };
  }

  return { status: 200, body: { success: true } };
}

// --- POST /api/staff/invite (permission check simulation) ---

interface InvitePayload {
  email?: string;
  orgId?: string;
  roleId?: string | null;
}

function simulateInvitePermissionCheck(
  user: ApiUser | null,
  currentMember: ApiMember | null,
  rolePermissions: string[] | null,
): { canInvite: boolean; status?: number; error?: string } {
  if (!user) return { canInvite: false, status: 401, error: 'Unauthorized' };
  if (!currentMember) return { canInvite: false, status: 403, error: 'Not a member of this organization' };

  let canInvite = currentMember.role === 'owner';
  if (!canInvite && currentMember.role_id && rolePermissions) {
    if (rolePermissions.includes('invite_staff')) {
      canInvite = true;
    }
  }

  if (!canInvite) {
    return { canInvite: false, status: 403, error: 'You do not have permission to invite staff' };
  }

  return { canInvite: true };
}

function simulateInviteResult(
  payload: InvitePayload,
  canInvite: boolean,
  alreadyMember: boolean,
): ApiResult {
  if (!canInvite) return { status: 403, body: { error: 'You do not have permission to invite staff' } };
  if (!payload.email || !payload.orgId) return { status: 400, body: { error: 'Email and orgId are required' } };
  if (alreadyMember) return { status: 409, body: { error: 'This user is already a member of your team' } };

  const member = {
    id: `member-${Date.now()}`,
    user_id: `invited-user-${Date.now()}`,
    role: 'staff' as const,
    role_id: payload.roleId || null,
    status: 'pending' as const,
    email: payload.email.toLowerCase(),
    display_name: null,
    created_at: new Date().toISOString(),
  };

  return { status: 200, body: { success: true, member } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════════

const mockUser: ApiUser = { id: 'user-1', email: 'owner@example.com' };
const mockOwnerMember: ApiMember = { organization_id: 'org-1', role: 'owner', role_id: null };
const mockStaffMember: ApiMember = { organization_id: 'org-1', role: 'staff', role_id: null };
const mockStaffWithRole: ApiMember = { organization_id: 'org-1', role: 'staff', role_id: 'role-1' };

const mockRoles: RoleRecord[] = [
  { id: 'role-1', organization_id: 'org-1', name: 'Manager', permissions: ['invite_staff', 'view_reviews'], created_at: '2025-01-01T00:00:00Z' },
  { id: 'role-2', organization_id: 'org-1', name: 'Clerk', permissions: ['send_sms'], created_at: '2025-01-02T00:00:00Z' },
];

describe('GET /api/staff/roles — list roles', () => {
  it('returns roles for the org', () => {
    const result = simulateGetRoles(mockUser, mockOwnerMember, mockRoles, null);
    expect(result.status).toBe(200);
    expect(result.body.roles).toEqual(mockRoles);
    expect((result.body.roles as RoleRecord[]).length).toBe(2);
  });

  it('returns 401 when not authenticated', () => {
    const result = simulateGetRoles(null, null, [], null);
    expect(result.status).toBe(401);
    expect(result.body.error).toBe('Unauthorized');
  });

  it('returns 404 when user has no organization', () => {
    const result = simulateGetRoles(mockUser, null, [], null);
    expect(result.status).toBe(404);
    expect(result.body.error).toBe('No organization');
  });

  it('returns 500 on database error', () => {
    const result = simulateGetRoles(mockUser, mockOwnerMember, [], { message: 'connection refused' });
    expect(result.status).toBe(500);
    expect(result.body.error).toBe('connection refused');
  });

  it('returns empty array when org has no roles', () => {
    const result = simulateGetRoles(mockUser, mockOwnerMember, [], null);
    expect(result.status).toBe(200);
    expect(result.body.roles).toEqual([]);
  });

  it('staff members can also list roles', () => {
    const result = simulateGetRoles(mockUser, mockStaffMember, mockRoles, null);
    expect(result.status).toBe(200);
    expect((result.body.roles as RoleRecord[]).length).toBe(2);
  });
});

describe('POST /api/staff/roles — create role', () => {
  it('creates a new role with name and permissions', () => {
    const result = simulateCreateRole(mockUser, mockOwnerMember, {
      name: 'Receptionist',
      permissions: ['send_sms', 'view_reviews'],
    }, []);
    expect(result.status).toBe(200);
    const role = result.body.role as RoleRecord;
    expect(role.name).toBe('Receptionist');
    expect(role.permissions).toEqual(['send_sms', 'view_reviews']);
    expect(role.organization_id).toBe('org-1');
  });

  it('creates a role with empty permissions array when not provided', () => {
    const result = simulateCreateRole(mockUser, mockOwnerMember, { name: 'Basic' }, []);
    expect(result.status).toBe(200);
    expect((result.body.role as RoleRecord).permissions).toEqual([]);
  });

  it('trims whitespace from role name', () => {
    const result = simulateCreateRole(mockUser, mockOwnerMember, { name: '  Trimmed Role  ' }, []);
    expect(result.status).toBe(200);
    expect((result.body.role as RoleRecord).name).toBe('Trimmed Role');
  });

  it('rejects duplicate role names with 409', () => {
    const result = simulateCreateRole(mockUser, mockOwnerMember, { name: 'Manager' }, ['Manager', 'Clerk']);
    expect(result.status).toBe(409);
    expect(result.body.error).toBe('A role with this name already exists');
  });

  it('rejects when name is empty', () => {
    const result = simulateCreateRole(mockUser, mockOwnerMember, { name: '' }, []);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Role name is required');
  });

  it('rejects when name is only whitespace', () => {
    const result = simulateCreateRole(mockUser, mockOwnerMember, { name: '   ' }, []);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Role name is required');
  });

  it('rejects non-owners with 403', () => {
    const result = simulateCreateRole(mockUser, mockStaffMember, { name: 'Hacker Role' }, []);
    expect(result.status).toBe(403);
    expect(result.body.error).toBe('Only owners can manage roles');
  });

  it('rejects unauthenticated users with 401', () => {
    const result = simulateCreateRole(null, null, { name: 'Test' }, []);
    expect(result.status).toBe(401);
  });
});

describe('PATCH /api/staff/roles — update role', () => {
  const existingRole: RoleRecord = {
    id: 'role-1',
    organization_id: 'org-1',
    name: 'Manager',
    permissions: ['invite_staff', 'view_reviews'],
    created_at: '2025-01-01T00:00:00Z',
  };

  it('updates role name', () => {
    const result = simulateUpdateRole(
      mockUser, mockOwnerMember,
      { id: 'role-1', name: 'Senior Manager' },
      existingRole, ['Manager', 'Clerk'],
    );
    expect(result.status).toBe(200);
    expect((result.body.role as RoleRecord).name).toBe('Senior Manager');
  });

  it('updates role permissions', () => {
    const result = simulateUpdateRole(
      mockUser, mockOwnerMember,
      { id: 'role-1', permissions: ['send_sms', 'invite_staff', 'view_reviews'] },
      existingRole, ['Manager', 'Clerk'],
    );
    expect(result.status).toBe(200);
    expect((result.body.role as RoleRecord).permissions).toEqual(['send_sms', 'invite_staff', 'view_reviews']);
  });

  it('updates both name and permissions', () => {
    const result = simulateUpdateRole(
      mockUser, mockOwnerMember,
      { id: 'role-1', name: 'Admin', permissions: ['all'] },
      existingRole, ['Manager', 'Clerk'],
    );
    expect(result.status).toBe(200);
    const role = result.body.role as RoleRecord;
    expect(role.name).toBe('Admin');
    expect(role.permissions).toEqual(['all']);
  });

  it('rejects duplicate name on update with 409', () => {
    const result = simulateUpdateRole(
      mockUser, mockOwnerMember,
      { id: 'role-1', name: 'Clerk' },
      existingRole, ['Manager', 'Clerk'],
    );
    expect(result.status).toBe(409);
    expect(result.body.error).toBe('A role with this name already exists');
  });

  it('allows keeping the same name (no duplicate error)', () => {
    const result = simulateUpdateRole(
      mockUser, mockOwnerMember,
      { id: 'role-1', name: 'Manager', permissions: ['new_perm'] },
      existingRole, ['Manager', 'Clerk'],
    );
    expect(result.status).toBe(200);
    expect((result.body.role as RoleRecord).name).toBe('Manager');
  });

  it('rejects when id is missing', () => {
    const result = simulateUpdateRole(
      mockUser, mockOwnerMember,
      { name: 'NoId' },
      null, [],
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Role id is required');
  });

  it('rejects non-owners with 403', () => {
    const result = simulateUpdateRole(
      mockUser, mockStaffMember,
      { id: 'role-1', name: 'Hacked' },
      existingRole, [],
    );
    expect(result.status).toBe(403);
  });
});

describe('DELETE /api/staff/roles — delete role', () => {
  it('deletes a role with no assigned members', () => {
    const result = simulateDeleteRole(mockUser, mockOwnerMember, { id: 'role-1' }, 0);
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
  });

  it('prevents deletion when members are assigned (409)', () => {
    const result = simulateDeleteRole(mockUser, mockOwnerMember, { id: 'role-1' }, 3);
    expect(result.status).toBe(409);
    expect(result.body.error).toContain('Cannot delete');
    expect(result.body.error).toContain('3 staff member(s)');
  });

  it('prevents deletion when 1 member is assigned', () => {
    const result = simulateDeleteRole(mockUser, mockOwnerMember, { id: 'role-1' }, 1);
    expect(result.status).toBe(409);
    expect(result.body.error).toContain('1 staff member(s)');
    expect(result.body.error).toContain('Reassign them first');
  });

  it('rejects when id is missing', () => {
    const result = simulateDeleteRole(mockUser, mockOwnerMember, {}, 0);
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Role id is required');
  });

  it('rejects non-owners with 403', () => {
    const result = simulateDeleteRole(mockUser, mockStaffMember, { id: 'role-1' }, 0);
    expect(result.status).toBe(403);
  });

  it('rejects unauthenticated users with 401', () => {
    const result = simulateDeleteRole(null, null, { id: 'role-1' }, 0);
    expect(result.status).toBe(401);
  });
});

describe('POST /api/staff/invite — create pending member with role_id', () => {
  it('creates pending member with role_id', () => {
    const result = simulateInviteResult(
      { email: 'newstaff@example.com', orgId: 'org-1', roleId: 'role-1' },
      true, false,
    );
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    const member = result.body.member as Record<string, unknown>;
    expect(member.role).toBe('staff');
    expect(member.role_id).toBe('role-1');
    expect(member.status).toBe('pending');
    expect(member.email).toBe('newstaff@example.com');
    expect(member.display_name).toBeNull();
  });

  it('creates pending member with null role_id when not specified', () => {
    const result = simulateInviteResult(
      { email: 'newstaff@example.com', orgId: 'org-1' },
      true, false,
    );
    expect(result.status).toBe(200);
    const member = result.body.member as Record<string, unknown>;
    expect(member.role_id).toBeNull();
  });

  it('lowercases the email', () => {
    const result = simulateInviteResult(
      { email: 'Staff@EXAMPLE.com', orgId: 'org-1', roleId: null },
      true, false,
    );
    expect(result.status).toBe(200);
    const member = result.body.member as Record<string, unknown>;
    expect(member.email).toBe('staff@example.com');
  });

  it('rejects when already a member (409)', () => {
    const result = simulateInviteResult(
      { email: 'existing@example.com', orgId: 'org-1' },
      true, true,
    );
    expect(result.status).toBe(409);
    expect(result.body.error).toBe('This user is already a member of your team');
  });

  it('rejects when email is missing', () => {
    const result = simulateInviteResult(
      { orgId: 'org-1' },
      true, false,
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Email and orgId are required');
  });

  it('rejects when orgId is missing', () => {
    const result = simulateInviteResult(
      { email: 'a@b.com' },
      true, false,
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toBe('Email and orgId are required');
  });
});

describe('POST /api/staff/invite — permission checks', () => {
  it('allows owners to invite', () => {
    const result = simulateInvitePermissionCheck(mockUser, mockOwnerMember, null);
    expect(result.canInvite).toBe(true);
  });

  it('allows staff with invite_staff permission', () => {
    const result = simulateInvitePermissionCheck(
      mockUser,
      mockStaffWithRole,
      ['invite_staff', 'view_reviews'],
    );
    expect(result.canInvite).toBe(true);
  });

  it('rejects staff without invite_staff permission', () => {
    const result = simulateInvitePermissionCheck(
      mockUser,
      mockStaffWithRole,
      ['send_sms', 'view_reviews'],
    );
    expect(result.canInvite).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toBe('You do not have permission to invite staff');
  });

  it('rejects staff with no role_id (null permissions)', () => {
    const result = simulateInvitePermissionCheck(mockUser, mockStaffMember, null);
    expect(result.canInvite).toBe(false);
    expect(result.status).toBe(403);
  });

  it('rejects unauthenticated users', () => {
    const result = simulateInvitePermissionCheck(null, null, null);
    expect(result.canInvite).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects non-members', () => {
    const result = simulateInvitePermissionCheck(mockUser, null, null);
    expect(result.canInvite).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toBe('Not a member of this organization');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Type shape verification — Role and OrganizationMember types
// ═══════════════════════════════════════════════════════════════════════════════

describe('Role type — correct shape', () => {
  it('has all required fields', () => {
    const role: Role = {
      id: 'role-123',
      organization_id: 'org-456',
      name: 'Manager',
      permissions: ['invite_staff', 'send_sms'],
      created_at: '2025-01-01T00:00:00Z',
    };

    expect(role.id).toBe('role-123');
    expect(role.organization_id).toBe('org-456');
    expect(role.name).toBe('Manager');
    expect(role.permissions).toEqual(['invite_staff', 'send_sms']);
    expect(role.created_at).toBe('2025-01-01T00:00:00Z');
  });

  it('permissions is a string array', () => {
    const role: Role = {
      id: 'r-1',
      organization_id: 'org-1',
      name: 'Test',
      permissions: [],
      created_at: '',
    };
    expect(Array.isArray(role.permissions)).toBe(true);
  });

  it('permissions can be empty', () => {
    const role: Role = {
      id: 'r-1',
      organization_id: 'org-1',
      name: 'Basic',
      permissions: [],
      created_at: '',
    };
    expect(role.permissions.length).toBe(0);
  });
});

describe('OrganizationMember type — correct shape', () => {
  it('has role_id field (nullable)', () => {
    const memberWithRole: OrganizationMember = {
      id: 'm-1',
      organization_id: 'org-1',
      user_id: 'u-1',
      role: 'staff',
      role_id: 'role-1',
      status: 'active',
      email: 'staff@example.com',
      display_name: 'Staff Member',
      created_at: '2025-01-01T00:00:00Z',
    };
    expect(memberWithRole.role_id).toBe('role-1');

    const memberWithoutRole: OrganizationMember = {
      id: 'm-2',
      organization_id: 'org-1',
      user_id: 'u-2',
      role: 'owner',
      role_id: null,
      status: 'active',
      email: 'owner@example.com',
      display_name: 'Owner',
      created_at: '2025-01-01T00:00:00Z',
    };
    expect(memberWithoutRole.role_id).toBeNull();
  });

  it('has status field with pending/active values', () => {
    const pending: OrganizationMember = {
      id: 'm-1',
      organization_id: 'org-1',
      user_id: 'u-1',
      role: 'staff',
      role_id: null,
      status: 'pending',
      email: 'new@example.com',
      display_name: null,
      created_at: '',
    };
    expect(pending.status).toBe('pending');

    const active: OrganizationMember = {
      id: 'm-2',
      organization_id: 'org-1',
      user_id: 'u-2',
      role: 'staff',
      role_id: null,
      status: 'active',
      email: 'existing@example.com',
      display_name: 'Name',
      created_at: '',
    };
    expect(active.status).toBe('active');
  });

  it('has email field (nullable)', () => {
    const withEmail: OrganizationMember = {
      id: 'm-1', organization_id: 'org-1', user_id: 'u-1',
      role: 'staff', role_id: null, status: 'active',
      email: 'test@example.com', display_name: null, created_at: '',
    };
    expect(withEmail.email).toBe('test@example.com');

    const withoutEmail: OrganizationMember = {
      id: 'm-2', organization_id: 'org-1', user_id: 'u-2',
      role: 'staff', role_id: null, status: 'pending',
      email: null, display_name: null, created_at: '',
    };
    expect(withoutEmail.email).toBeNull();
  });

  it('has display_name field (nullable)', () => {
    const withName: OrganizationMember = {
      id: 'm-1', organization_id: 'org-1', user_id: 'u-1',
      role: 'staff', role_id: null, status: 'active',
      email: null, display_name: 'Jane', created_at: '',
    };
    expect(withName.display_name).toBe('Jane');

    const withoutName: OrganizationMember = {
      id: 'm-2', organization_id: 'org-1', user_id: 'u-2',
      role: 'staff', role_id: null, status: 'pending',
      email: null, display_name: null, created_at: '',
    };
    expect(withoutName.display_name).toBeNull();
  });

  it('role is owner or staff', () => {
    const owner: OrganizationMember = {
      id: 'm-1', organization_id: 'org-1', user_id: 'u-1',
      role: 'owner', role_id: null, status: 'active',
      email: null, display_name: null, created_at: '',
    };
    expect(owner.role).toBe('owner');

    const staff: OrganizationMember = {
      id: 'm-2', organization_id: 'org-1', user_id: 'u-2',
      role: 'staff', role_id: 'role-1', status: 'active',
      email: null, display_name: null, created_at: '',
    };
    expect(staff.role).toBe('staff');
  });
});
