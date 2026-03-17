'use client';

import { useState } from 'react';
import { Paper, TextField, Button, Typography, Box } from '@mui/material';
import { Save, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';

interface ProfileFormProps {
  memberId: string;
  displayName: string;
  email: string;
}

export function ProfileForm({ memberId, displayName: initialName, email }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useSnackbar();

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('organization_members')
      .update({ display_name: displayName.trim() || null })
      .eq('id', memberId);

    if (!error) {
      showSnackbar('Profile updated');
    } else {
      showSnackbar('Failed to update profile', 'error');
    }
    setSaving(false);
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <User size={20} />
        <Typography variant="h6">Your Profile</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Your Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          size="small"
          sx={{ minWidth: 250 }}
        />
        <TextField
          label="Email"
          value={email}
          disabled
          size="small"
          sx={{ minWidth: 250 }}
        />
        <Button
          variant="contained"
          startIcon={<Save size={16} />}
          onClick={handleSave}
          disabled={saving || displayName === initialName}
          size="small"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Paper>
  );
}
