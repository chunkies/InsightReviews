'use client';

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, FormGroup, FormControlLabel, Checkbox, Box, Typography,
  CircularProgress,
} from '@mui/material';

const ALL_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'View dashboard stats and overview' },
  { key: 'reviews', label: 'Reviews', description: 'View and manage customer reviews' },
  { key: 'collect', label: 'Collect Reviews', description: 'Send review requests to customers' },
  { key: 'integrations', label: 'Integrations', description: 'View and manage platform integrations' },
  { key: 'staff', label: 'Staff', description: 'View team members and roles' },
  { key: 'invite_staff', label: 'Invite Staff', description: 'Invite new members to the workspace' },
  { key: 'customization', label: 'Customization', description: 'Customize testimonial wall and branding' },
  { key: 'billing', label: 'Billing', description: 'View and manage billing and subscription' },
  { key: 'settings', label: 'Settings', description: 'Manage business settings and profile' },
  { key: 'support', label: 'Support', description: 'Access support and submit tickets' },
];

interface RoleEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, permissions: string[]) => Promise<void>;
  initialName?: string;
  initialPermissions?: string[];
  title?: string;
}

export function RoleEditor({ open, onClose, onSave, initialName = '', initialPermissions = [], title = 'Create Role' }: RoleEditorProps) {
  const [name, setName] = useState(initialName);
  const [permissions, setPermissions] = useState<string[]>(initialPermissions);
  const [saving, setSaving] = useState(false);

  function togglePermission(key: string) {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), permissions);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Role Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Front Desk, Manager"
          disabled={saving}
          sx={{ mt: 1, mb: 2 }}
        />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          What this role can do:
        </Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          <FormGroup>
            {ALL_PERMISSIONS.map((perm) => (
              <FormControlLabel
                key={perm.key}
                control={
                  <Checkbox
                    checked={permissions.includes(perm.key)}
                    onChange={() => togglePermission(perm.key)}
                    disabled={saving}
                    size="small"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">{perm.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{perm.description}</Typography>
                  </Box>
                }
              />
            ))}
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
