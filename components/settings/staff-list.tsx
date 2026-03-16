'use client';

import { useState } from 'react';
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, IconButton, Button, TextField, Box, Dialog, DialogTitle,
  DialogContent, DialogActions, Typography, CircularProgress,
} from '@mui/material';
import { Trash2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { OrganizationMember } from '@/lib/types/database';

interface StaffListProps {
  members: OrganizationMember[];
  isOwner: boolean;
  orgId: string;
  currentUserId: string;
}

export function StaffList({ members: initial, isOwner, orgId, currentUserId }: StaffListProps) {
  const [members, setMembers] = useState(initial);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

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
        body: JSON.stringify({ email: inviteEmail.trim(), orgId }),
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
        created_at: data.member.created_at,
      }]);
      showSnackbar(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteOpen(false);
    } catch {
      showSnackbar('Failed to send invite', 'error');
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <Box>
      {isOwner && (
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
                <TableCell>User ID</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
                {isOwner && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.user_id === currentUserId ? 'You' : m.user_id.slice(0, 8) + '...'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={m.role}
                      color={m.role === 'owner' ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{format(new Date(m.created_at), 'dd MMM yyyy')}</TableCell>
                  {isOwner && (
                    <TableCell align="right">
                      {m.user_id !== currentUserId && (
                        <IconButton size="small" color="error" onClick={() => setRemoveTarget(m.id)}>
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? They will lose access to your business."
        onConfirm={() => removeTarget && handleRemove(removeTarget)}
        onCancel={() => setRemoveTarget(null)}
      />

      <Dialog open={inviteOpen} onClose={() => !inviteLoading && setInviteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Invite Staff Member</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter their email address. They&apos;ll receive a magic link to join your team.
            Staff members can use the Collect Reviews page to send review requests.
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
          />
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
    </Box>
  );
}
