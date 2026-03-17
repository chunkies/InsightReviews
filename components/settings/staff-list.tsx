'use client';

import { useState } from 'react';
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, IconButton, Button, TextField, Box, Dialog, DialogTitle,
  DialogContent, DialogActions, Typography, CircularProgress, MenuItem,
  Select, FormControl, InputLabel, Tabs, Tab,
} from '@mui/material';
import { Trash2, UserPlus, Shield, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RoleEditor } from './role-editor';
import type { OrganizationMember, Role } from '@/lib/types/database';

interface StaffListProps {
  members: OrganizationMember[];
  roles: Role[];
  isOwner: boolean;
  canInvite: boolean;
  canManageRoles: boolean;
  orgId: string;
  currentUserId: string;
}

export function StaffList({ members: initial, roles: initialRoles, isOwner, canInvite, canManageRoles, orgId, currentUserId }: StaffListProps) {
  const [members, setMembers] = useState(initial);
  const [roles, setRoles] = useState(initialRoles);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [roleEditorOpen, setRoleEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<Role | null>(null);
  const { showSnackbar } = useSnackbar();

  const showTabs = isOwner || canManageRoles;

  async function handleRemove(memberId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('organization_members').delete().eq('id', memberId);
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showSnackbar('Member removed');
    } else {
      showSnackbar('Failed to remove member', 'error');
    }
    setRemoveTarget(null);
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), orgId, roleId: inviteRoleId || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        showSnackbar(data.error || 'Failed to send invite', 'error');
        return;
      }

      setMembers((prev) => [...prev, {
        id: data.member.id,
        organization_id: orgId,
        user_id: data.member.user_id,
        role: data.member.role,
        role_id: data.member.role_id,
        status: data.member.status,
        email: data.member.email,
        display_name: data.member.display_name,
        created_at: data.member.created_at,
      }]);
      showSnackbar(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRoleId('');
      setInviteOpen(false);
    } catch {
      showSnackbar('Failed to send invite', 'error');
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRoleChange(memberId: string, roleId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('organization_members')
      .update({ role_id: roleId || null })
      .eq('id', memberId);

    if (!error) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role_id: roleId || null } : m));
      showSnackbar('Role updated');
    } else {
      showSnackbar('Failed to update role', 'error');
    }
  }

  async function handleSaveRole(name: string, permissions: string[]) {
    if (editingRole) {
      const res = await fetch('/api/staff/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingRole.id, name, permissions }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.error || 'Failed to update role', 'error');
        throw new Error(data.error);
      }
      setRoles((prev) => prev.map((r) => r.id === editingRole.id ? data.role : r));
      showSnackbar('Role updated');
    } else {
      const res = await fetch('/api/staff/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, permissions }),
      });
      const data = await res.json();
      if (!res.ok) {
        showSnackbar(data.error || 'Failed to create role', 'error');
        throw new Error(data.error);
      }
      setRoles((prev) => [...prev, data.role]);
      showSnackbar('Role created');
    }
    setEditingRole(null);
  }

  async function handleDeleteRole() {
    if (!deleteRoleTarget) return;
    const res = await fetch('/api/staff/roles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteRoleTarget.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      showSnackbar(data.error || 'Failed to delete role', 'error');
    } else {
      setRoles((prev) => prev.filter((r) => r.id !== deleteRoleTarget.id));
      showSnackbar('Role deleted');
    }
    setDeleteRoleTarget(null);
  }

  function getRoleName(roleId: string | null) {
    if (!roleId) return 'No role';
    return roles.find((r) => r.id === roleId)?.name ?? 'Unknown';
  }

  return (
    <Box>
      {showTabs && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Members" />
          <Tab label="Roles" />
        </Tabs>
      )}

      {tab === 0 && (
        <>
          {canInvite && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<UserPlus size={18} />}
                onClick={() => setInviteOpen(true)}
              >
                Invite Staff
              </Button>
            </Box>
          )}

          {members.length === 0 ? (
            <EmptyState
              title="No team members yet"
              description="Invite staff members so they can send review requests from the collect page."
            />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Joined</TableCell>
                    {isOwner && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((m) => {
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {m.user_id === currentUserId ? (m.display_name || 'You') : (m.display_name || '—')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {m.email || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {m.role === 'owner' ? (
                            <Chip label="Owner" color="primary" size="small" />
                          ) : isOwner ? (
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={m.role_id || ''}
                                onChange={(e) => handleRoleChange(m.id, e.target.value)}
                                displayEmpty
                                size="small"
                                sx={{ fontSize: '0.875rem' }}
                              >
                                <MenuItem value="">
                                  <em>No role</em>
                                </MenuItem>
                                {roles.map((r) => (
                                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          ) : (
                            <Chip label={getRoleName(m.role_id)} size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={m.status === 'pending' ? 'Pending' : 'Active'}
                            color={m.status === 'pending' ? 'warning' : 'success'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{format(new Date(m.created_at), 'dd MMM yyyy')}</TableCell>
                        {isOwner && (
                          <TableCell align="right">
                            {m.user_id !== currentUserId && m.role !== 'owner' && (
                              <IconButton size="small" color="error" onClick={() => setRemoveTarget(m.id)}>
                                <Trash2 size={16} />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tab === 1 && canManageRoles && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Shield size={18} />}
              onClick={() => { setEditingRole(null); setRoleEditorOpen(true); }}
            >
              Create Role
            </Button>
          </Box>

          {roles.length === 0 ? (
            <EmptyState
              title="No roles yet"
              description="Create roles to control which pages staff members can access."
            />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Role Name</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((r) => {
                    const memberCount = members.filter((m) => m.role_id === r.id).length;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{r.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(r.permissions as string[]).map((p) => (
                              <Chip key={p} label={p} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>{memberCount}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => { setEditingRole(r); setRoleEditorOpen(true); }}
                          >
                            <Edit2 size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteRoleTarget(r)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? They will lose access to your business."
        onConfirm={() => removeTarget && handleRemove(removeTarget)}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteRoleTarget}
        title="Delete Role"
        message={`Are you sure you want to delete the "${deleteRoleTarget?.name}" role?`}
        onConfirm={handleDeleteRole}
        onCancel={() => setDeleteRoleTarget(null)}
      />

      <Dialog open={inviteOpen} onClose={() => !inviteLoading && setInviteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Invite Staff Member</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter their email address. They&apos;ll receive a magic link to join your team.
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="staff@example.com"
            disabled={inviteLoading}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            sx={{ mb: 2 }}
          />
          {roles.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRoleId}
                onChange={(e) => setInviteRoleId(e.target.value)}
                label="Role"
                disabled={inviteLoading}
              >
                <MenuItem value="">
                  <em>No role</em>
                </MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)} disabled={inviteLoading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInvite}
            disabled={!inviteEmail.trim() || inviteLoading}
            startIcon={inviteLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {inviteLoading ? 'Sending...' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      <RoleEditor
        open={roleEditorOpen}
        onClose={() => { setRoleEditorOpen(false); setEditingRole(null); }}
        onSave={handleSaveRole}
        initialName={editingRole?.name ?? ''}
        initialPermissions={(editingRole?.permissions as string[]) ?? []}
        title={editingRole ? 'Edit Role' : 'Create Role'}
        key={editingRole?.id ?? 'new'}
      />
    </Box>
  );
}
