'use client';

import { useState, useRef } from 'react';
import {
  Paper, TextField, Button, Typography, Box, Chip, Avatar,
  FormControl, InputLabel, Select, MenuItem, IconButton, Divider,
} from '@mui/material';
import { Save, Upload, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';

const TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Australia/Hobart', label: 'Hobart (AEST)' },
  { value: 'Australia/Darwin', label: 'Darwin (ACST)' },
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
  orgId: string;
  displayName: string;
  email: string;
  phone: string;
  jobTitle: string;
  timezone: string;
  avatarUrl: string;
  role: 'owner' | 'staff';
  orgName: string;
}

export function ProfilePageForm({
  memberId,
  orgId,
  displayName: initialName,
  email,
  phone: initialPhone,
  jobTitle: initialJobTitle,
  timezone: initialTimezone,
  avatarUrl: initialAvatarUrl,
  role,
  orgName,
}: ProfilePageFormProps) {
  const [displayName, setDisplayName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { showSnackbar } = useSnackbar();

  const hasChanges =
    displayName !== initialName ||
    phone !== initialPhone ||
    jobTitle !== initialJobTitle ||
    timezone !== initialTimezone ||
    avatarUrl !== initialAvatarUrl;

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? '?';

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showSnackbar('Please select an image file', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Image must be under 2MB', 'error');
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${orgId}/${memberId}.${ext}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      console.error('Avatar upload error:', error);
      showSnackbar(`Upload failed: ${error.message}`, 'error');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    setUploading(false);
    showSnackbar('Photo uploaded — click Save to apply');
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const updates = {
      display_name: displayName.trim() || null,
      phone: phone.trim() || null,
      job_title: jobTitle.trim() || null,
      timezone,
      avatar_url: avatarUrl || null,
    };

    const { error, count } = await supabase
      .from('organization_members')
      .update(updates, { count: 'exact' })
      .eq('id', memberId);

    if (error) {
      console.error('Profile save error:', error);
      showSnackbar(`Failed to save: ${error.message}`, 'error');
    } else if (count === 0) {
      showSnackbar('No changes saved — please try signing out and back in', 'error');
    } else {
      showSnackbar('Profile saved');
    }
    setSaving(false);
  }

  return (
    <Paper sx={{ p: { xs: 3, sm: 4 }, maxWidth: 800 }}>
      {/* Avatar + Name Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={avatarUrl || undefined}
            sx={{
              width: 80,
              height: 80,
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            }}
          >
            {initials}
          </Avatar>
          <IconButton
            size="small"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              backgroundColor: 'background.paper',
              border: '2px solid',
              borderColor: 'divider',
              width: 30,
              height: 30,
              '&:hover': { backgroundColor: 'action.hover' },
            }}
          >
            {uploading ? <Upload size={14} /> : <Camera size={14} />}
          </IconButton>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleAvatarUpload}
          />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {displayName || 'Your Profile'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
          <Box sx={{ mt: 0.5, display: 'flex', gap: 1 }}>
            <Chip
              label={role === 'owner' ? 'Owner' : role.charAt(0).toUpperCase() + role.slice(1)}
              size="small"
              color={role === 'owner' ? 'primary' : 'default'}
              variant="outlined"
            />
            {orgName && <Chip label={orgName} size="small" variant="outlined" />}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Form Fields */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
        <TextField
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
        />
        <TextField
          label="Email"
          value={email}
          disabled
          helperText="Managed by your login method"
        />
        <TextField
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +61 400 000 000"
        />
        <TextField
          label="Job Title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. Owner, Manager, Front Desk"
        />
        <FormControl>
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
      </Box>

      <Button
        variant="contained"
        startIcon={<Save size={18} />}
        onClick={handleSave}
        disabled={saving || !hasChanges}
        size="large"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Paper>
  );
}
