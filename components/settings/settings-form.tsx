'use client';

import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Grid,
  IconButton, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel,
} from '@mui/material';
import { Save, Plus, Trash2, Send, Mail, Link2, ExternalLink, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import { LogoUpload } from '@/components/shared/logo-upload';
import type { Organization, ReviewPlatform, OrganizationIntegration } from '@/lib/types/database';
import { PLATFORM_CONFIG } from '@/lib/types/database';

interface SettingsFormProps {
  org: Organization;
  platforms: ReviewPlatform[];
  integrations: OrganizationIntegration[];
  isOwner: boolean;
}

export function SettingsForm({ org, platforms: initialPlatforms, integrations, isOwner }: SettingsFormProps) {
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
        <Typography variant="h6" gutterBottom>
          Review Platforms
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Connected integrations automatically appear as redirect options when customers leave positive reviews.
        </Typography>

        {/* Connected Integrations */}
        {integrations.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
              Connected Platforms
            </Typography>
            {integrations.map((integration) => {
              const config = PLATFORM_CONFIG[integration.platform] ?? PLATFORM_CONFIG.other;
              return (
                <Box
                  key={integration.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: config.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckCircle size={18} color="#fff" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {config.label}
                      {integration.platform_account_name ? ` — ${integration.platform_account_name}` : ''}
                    </Typography>
                    {integration.platform_url && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {integration.platform_url}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    {integration.show_on_review_form ? (
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>
                        Shown on form
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        Hidden
                      </Typography>
                    )}
                    {integration.platform_url && (
                      <IconButton
                        size="small"
                        component="a"
                        href={integration.platform_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={14} />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box
            sx={{
              p: 3,
              mb: 2,
              borderRadius: 1,
              border: '1px dashed',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <Link2 size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              No platforms connected yet. Connect Google, Facebook, or Yelp to automatically sync reviews and show redirect options.
            </Typography>
            {isOwner && (
              <Button
                component="a"
                href="/dashboard/integrations"
                variant="contained"
                size="small"
                sx={{ mt: 1.5 }}
                startIcon={<Link2 size={14} />}
              >
                Connect Platforms
              </Button>
            )}
          </Box>
        )}

        {/* Link to integrations page when integrations exist */}
        {isOwner && integrations.length > 0 && (
          <Button
            component="a"
            href="/dashboard/integrations"
            variant="outlined"
            size="small"
            startIcon={<Link2 size={14} />}
            sx={{ mb: 2 }}
          >
            Connect more platforms
          </Button>
        )}

        {/* Manual Platforms */}
        {platforms.length > 0 && (
          <Box sx={{ mt: integrations.length > 0 ? 2 : 0 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
              Manual Platforms
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
          </Box>
        )}
        {isOwner && (
          <Button startIcon={<Plus size={16} />} onClick={addPlatform} size="small" variant="text">
            Add Manual Platform
          </Button>
        )}
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
