'use client';

import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Grid,
  IconButton, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel,
} from '@mui/material';
import { Save, Plus, Trash2, Send, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import { LogoUpload } from '@/components/shared/logo-upload';
import type { Organization, ReviewPlatform } from '@/lib/types/database';

interface SettingsFormProps {
  org: Organization;
  platforms: ReviewPlatform[];
  isOwner: boolean;
}

export function SettingsForm({ org, platforms: initialPlatforms, isOwner }: SettingsFormProps) {
  const [name, setName] = useState(org.name);
  const [logoUrl, setLogoUrl] = useState(org.logo_url);
  const [phone, setPhone] = useState(org.phone ?? '');
  const [email, setEmail] = useState(org.email ?? '');
  const [address, setAddress] = useState(org.address ?? '');
  const [smsTemplate, setSmsTemplate] = useState(org.sms_template);
  const [threshold, setThreshold] = useState(org.positive_threshold);
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [webhookUrl, setWebhookUrl] = useState(org.webhook_url ?? '');
  const [webhookEnabled, setWebhookEnabled] = useState(org.webhook_enabled);
  const [notifyOnNegative, setNotifyOnNegative] = useState(org.notify_on_negative);
  const [digestEnabled, setDigestEnabled] = useState(org.digest_enabled);
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
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
        webhook_url: webhookUrl || null,
        webhook_enabled: webhookEnabled,
        notify_on_negative: notifyOnNegative,
        digest_enabled: digestEnabled,
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
        {isOwner && (
          <Box sx={{ mb: 3 }}>
            <LogoUpload
              orgId={org.id}
              orgName={name}
              currentLogoUrl={logoUrl}
              onLogoChange={setLogoUrl}
            />
          </Box>
        )}
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

      {/* Notifications */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure webhook notifications and email alerts for new reviews.
        </Typography>
        <TextField
          fullWidth
          label="Webhook URL"
          placeholder="https://example.com/webhook"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          disabled={!isOwner}
          sx={{ mb: 2 }}
          helperText="We will POST a JSON payload to this URL when a new review is submitted."
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={webhookEnabled}
                onChange={(e) => setWebhookEnabled(e.target.checked)}
                disabled={!isOwner}
              />
            }
            label="Enable webhook notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notifyOnNegative}
                onChange={(e) => setNotifyOnNegative(e.target.checked)}
                disabled={!isOwner}
              />
            }
            label="Email notification on negative reviews"
          />
          <FormControlLabel
            control={
              <Switch
                checked={digestEnabled}
                onChange={(e) => setDigestEnabled(e.target.checked)}
                disabled={!isOwner}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Mail size={16} />
                Weekly Email Digest
              </Box>
            }
          />
          {digestEnabled && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
              Receive a weekly summary of new reviews, average ratings, and highlights every Monday.
            </Typography>
          )}
        </Box>
        {isOwner && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Send size={14} />}
            disabled={!webhookUrl || testingWebhook}
            onClick={async () => {
              setTestingWebhook(true);
              try {
                const res = await fetch('/api/webhooks/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ webhookUrl }),
                });
                if (res.ok) {
                  showSnackbar('Test webhook sent successfully!');
                } else {
                  const data = await res.json();
                  showSnackbar(data.error || 'Webhook test failed', 'error');
                }
              } catch {
                showSnackbar('Failed to send test webhook', 'error');
              }
              setTestingWebhook(false);
            }}
          >
            {testingWebhook ? 'Sending...' : 'Test Webhook'}
          </Button>
        )}
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
