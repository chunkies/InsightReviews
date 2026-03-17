'use client';

import { useState } from 'react';
import {
  Paper, TextField, Button, Typography, Box, Chip,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Save, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';

const TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEST)' },
  { value: 'Australia/Brisbane', label: 'Australia/Brisbane (AEST)' },
  { value: 'Australia/Adelaide', label: 'Australia/Adelaide (ACST)' },
  { value: 'Australia/Perth', label: 'Australia/Perth (AWST)' },
  { value: 'Australia/Hobart', label: 'Australia/Hobart (AEST)' },
  { value: 'Australia/Darwin', label: 'Australia/Darwin (ACST)' },
  { value: 'Pacific/Auckland', label: 'New Zealand (NZST)' },
  { value: 'Pacific/Fiji', label: 'Fiji (FJT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'America/Denver', label: 'Denver (MST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
];

interface ProfilePageFormProps {
  memberId: string;
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  timezone: string;
  role: 'owner' | 'staff';
  orgName: string;
}

export function ProfilePageForm({
  memberId,
  displayName: initialName,
  email,
  phone: initialPhone,
  jobTitle: initialJobTitle,
  timezone: initialTimezone,
  role,
  orgName,
}: ProfilePageFormProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useSnackbar();

  const hasChanges =
    displayName !== initialName ||
    phone !== initialPhone ||
    jobTitle !== initialJobTitle ||
    timezone !== initialTimezone;

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('organization_members')
      .update({
        display_name: displayName.trim() || null,
        phone: phone.trim() || null,
        job_title: jobTitle.trim() || null,
        timezone,
      })
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <User size={20} />
        <Typography variant="h6">Personal Details</Typography>
      </Box>
      {orgName && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {orgName}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          size="small"
          sx={{ minWidth: 250, flex: 1 }}
        />
        <TextField
          label="Email"
          value={email}
          disabled
          size="small"
          sx={{ minWidth: 250, flex: 1 }}
        />
        <TextField
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +61 400 000 000"
          size="small"
          sx={{ minWidth: 250, flex: 1 }}
        />
        <TextField
          label="Job Title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. Owner, Manager, Front Desk"
          size="small"
          sx={{ minWidth: 250, flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 250, flex: 1 }}>
          <InputLabel>Timezone</InputLabel>
          <Select
            value={timezone}
            label="Timezone"
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <MenuItem key={tz.value} value={tz.value}>
                {tz.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ minWidth: 250, flex: 1, display: 'flex', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Role
            </Typography>
            <Chip
              label={role === 'owner' ? 'Owner' : role.charAt(0).toUpperCase() + role.slice(1)}
              size="small"
              color={role === 'owner' ? 'primary' : 'default'}
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      <Button
        variant="contained"
        startIcon={<Save size={16} />}
        onClick={handleSave}
        disabled={saving || !hasChanges}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Paper>
  );
}
