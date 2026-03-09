'use client';

import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Grid,
  IconButton, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Save, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import type { Organization, ReviewPlatform } from '@/lib/types/database';

interface SettingsFormProps {
  org: Organization;
  platforms: ReviewPlatform[];
  isOwner: boolean;
}

export function SettingsForm({ org, platforms: initialPlatforms, isOwner }: SettingsFormProps) {
  const [name, setName] = useState(org.name);
  const [phone, setPhone] = useState(org.phone ?? '');
  const [email, setEmail] = useState(org.email ?? '');
  const [address, setAddress] = useState(org.address ?? '');
  const [smsTemplate, setSmsTemplate] = useState(org.sms_template);
  const [threshold, setThreshold] = useState(org.positive_threshold);
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useSnackbar();

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('organizations')
      .update({
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        sms_template: smsTemplate,
        positive_threshold: threshold,
      })
      .eq('id', org.id);

    if (error) {
      showSnackbar('Failed to save settings', 'error');
    } else {
      showSnackbar('Settings saved!');
    }
    setSaving(false);
  }

  async function addPlatform() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('review_platforms')
      .insert({
        organization_id: org.id,
        platform: 'google',
        url: '',
        display_order: platforms.length,
      })
      .select()
      .single();

    if (data && !error) {
      setPlatforms([...platforms, data]);
    }
  }

  async function updatePlatform(id: string, field: string, value: string) {
    const supabase = createClient();
    await supabase
      .from('review_platforms')
      .update({ [field]: value })
      .eq('id', id);

    setPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  async function removePlatform(id: string) {
    const supabase = createClient();
    await supabase.from('review_platforms').delete().eq('id', id);
    setPlatforms((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <Box sx={{ maxWidth: 700 }}>
      {/* Business Profile */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Business Profile
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Business Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isOwner}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isOwner}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isOwner}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* SMS Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          SMS Settings
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="SMS Template"
          value={smsTemplate}
          onChange={(e) => setSmsTemplate(e.target.value)}
          helperText="Use {business_name} and {link} as placeholders"
          disabled={!isOwner}
          sx={{ mb: 2 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Positive Threshold</InputLabel>
          <Select
            value={threshold}
            label="Positive Threshold"
            onChange={(e) => setThreshold(e.target.value as number)}
            disabled={!isOwner}
          >
            <MenuItem value={3}>3+ stars (Good & above)</MenuItem>
            <MenuItem value={4}>4+ stars (Good & Excellent)</MenuItem>
            <MenuItem value={5}>5 stars only (Excellent)</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Review Platforms */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Review Platforms
          </Typography>
          {isOwner && (
            <Button startIcon={<Plus size={16} />} onClick={addPlatform} size="small">
              Add Platform
            </Button>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add your business review page URLs. Customers with positive reviews will be directed here.
        </Typography>
        {platforms.map((p) => (
          <Box key={p.id} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={p.platform}
                onChange={(e) => updatePlatform(p.id, 'platform', e.target.value)}
                disabled={!isOwner}
              >
                <MenuItem value="google">Google</MenuItem>
                <MenuItem value="yelp">Yelp</MenuItem>
                <MenuItem value="facebook">Facebook</MenuItem>
                <MenuItem value="tripadvisor">TripAdvisor</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              placeholder="https://..."
              value={p.url}
              onChange={(e) => updatePlatform(p.id, 'url', e.target.value)}
              disabled={!isOwner}
            />
            {isOwner && (
              <IconButton size="small" color="error" onClick={() => removePlatform(p.id)}>
                <Trash2 size={16} />
              </IconButton>
            )}
          </Box>
        ))}
      </Paper>

      {isOwner && (
        <Button
          variant="contained"
          startIcon={<Save size={18} />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      )}
    </Box>
  );
}
