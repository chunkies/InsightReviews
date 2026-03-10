'use client';

import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Grid,
  Switch, FormControlLabel, Alert, Chip, Link as MuiLink,
} from '@mui/material';
import { Save, Gift, Instagram, Facebook, Clock, Globe, Star, ExternalLink } from 'lucide-react';
import NextLink from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import type { Organization, OrganizationIntegration } from '@/lib/types/database';

interface ReviewExperienceFormProps {
  org: Organization;
  isOwner: boolean;
  integrations: OrganizationIntegration[];
}

export function ReviewExperienceForm({ org, isOwner, integrations }: ReviewExperienceFormProps) {
  const [integrationStates, setIntegrationStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(integrations.map(i => [i.id, i.show_on_review_form]))
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tyPositiveTitle, setTyPositiveTitle] = useState(org.thankyou_positive_title ?? 'Thank You!');
  const [tyPositiveMessage, setTyPositiveMessage] = useState(org.thankyou_positive_message ?? 'We really appreciate your feedback. Would you mind sharing your experience on one of these platforms?');
  const [tyNegativeTitle, setTyNegativeTitle] = useState(org.thankyou_negative_title ?? 'Thank You for Your Feedback');
  const [tyNegativeMessage, setTyNegativeMessage] = useState(org.thankyou_negative_message ?? 'We appreciate you letting us know. Your feedback helps us improve. We\'ll follow up with you soon.');
  const [tyCouponCode, setTyCouponCode] = useState(org.thankyou_coupon_code ?? '');
  const [tyCouponText, setTyCouponText] = useState(org.thankyou_coupon_text ?? 'Here\'s a little thank you from us:');
  const [tySocialInstagram, setTySocialInstagram] = useState((org.thankyou_social_links as Record<string, string>)?.instagram ?? '');
  const [tySocialFacebook, setTySocialFacebook] = useState((org.thankyou_social_links as Record<string, string>)?.facebook ?? '');
  const [autoFollowupEnabled, setAutoFollowupEnabled] = useState(org.auto_followup_enabled);
  const [autoFollowupDelayHours, setAutoFollowupDelayHours] = useState(org.auto_followup_delay_hours);
  const [autoFollowupMessage, setAutoFollowupMessage] = useState(org.auto_followup_message);
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useSnackbar();

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    const socialLinks: Record<string, string> = {};
    if (tySocialInstagram) socialLinks.instagram = tySocialInstagram;
    if (tySocialFacebook) socialLinks.facebook = tySocialFacebook;

    const { error } = await supabase
      .from('organizations')
      .update({
        thankyou_positive_title: tyPositiveTitle,
        thankyou_positive_message: tyPositiveMessage,
        thankyou_negative_title: tyNegativeTitle,
        thankyou_negative_message: tyNegativeMessage,
        thankyou_coupon_code: tyCouponCode || null,
        thankyou_coupon_text: tyCouponText,
        thankyou_social_links: socialLinks,
        auto_followup_enabled: autoFollowupEnabled,
        auto_followup_delay_hours: autoFollowupDelayHours,
        auto_followup_message: autoFollowupMessage,
      })
      .eq('id', org.id);

    if (error) {
      showSnackbar('Failed to save', 'error');
    } else {
      showSnackbar('Review experience settings saved!');
    }
    setSaving(false);
  }

  async function handleToggleIntegration(integrationId: string, showOnReviewForm: boolean) {
    setTogglingId(integrationId);
    try {
      const res = await fetch('/api/integrations/toggle-review-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId, showOnReviewForm }),
      });
      if (!res.ok) {
        showSnackbar('Failed to update platform visibility', 'error');
      } else {
        setIntegrationStates(prev => ({ ...prev, [integrationId]: showOnReviewForm }));
        showSnackbar(showOnReviewForm ? 'Platform will show on review form' : 'Platform hidden from review form');
      }
    } catch {
      showSnackbar('Failed to update platform visibility', 'error');
    }
    setTogglingId(null);
  }

  function getPlatformIcon(platform: string) {
    switch (platform) {
      case 'google': return <Globe size={20} style={{ color: '#4285F4' }} />;
      case 'facebook': return <Facebook size={20} style={{ color: '#1877F2' }} />;
      case 'yelp': return <Star size={20} style={{ color: '#D32323' }} />;
      default: return <Globe size={20} />;
    }
  }

  function getPlatformLabel(platform: string) {
    switch (platform) {
      case 'google': return 'Google';
      case 'facebook': return 'Facebook';
      case 'yelp': return 'Yelp';
      default: return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  }

  return (
    <Box sx={{ maxWidth: 700 }}>
      {/* Review Redirect Platforms */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ExternalLink size={20} />
          <Typography variant="h6">
            Review Redirect Platforms
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose which connected platforms appear as redirect options after a positive review.
        </Typography>

        {integrations.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            Connect platforms in the{' '}
            <MuiLink component={NextLink} href="/dashboard/integrations" sx={{ fontWeight: 600 }}>
              Integrations page
            </MuiLink>{' '}
            to show them as review redirect options.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {integrations.map((integration) => (
              <Paper
                key={integration.id}
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: integrationStates[integration.id] ? 'action.selected' : 'transparent',
                  transition: 'background-color 0.2s',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  {getPlatformIcon(integration.platform)}
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {getPlatformLabel(integration.platform)}
                      </Typography>
                      <Chip label="Connected" size="small" color="success" variant="outlined" />
                    </Box>
                    {integration.platform_url && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 350,
                        }}
                      >
                        {integration.platform_url}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={integrationStates[integration.id] ?? false}
                      onChange={(e) => handleToggleIntegration(integration.id, e.target.checked)}
                      disabled={!isOwner || togglingId === integration.id}
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.secondary">
                      {integrationStates[integration.id] ? 'Shown' : 'Hidden'}
                    </Typography>
                  }
                  labelPlacement="start"
                  sx={{ ml: 1, mr: 0 }}
                />
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Auto Follow-up */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Clock size={20} />
          <Typography variant="h6">
            Auto Follow-up
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Automatically send a follow-up message to customers who leave negative reviews.
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={autoFollowupEnabled}
              onChange={(e) => setAutoFollowupEnabled(e.target.checked)}
              disabled={!isOwner}
            />
          }
          label="Enable auto follow-up for negative reviews"
          sx={{ mb: 2, display: 'block' }}
        />
        {autoFollowupEnabled && (
          <>
            <TextField
              fullWidth
              type="number"
              label="Delay (hours)"
              value={autoFollowupDelayHours}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 48) {
                  setAutoFollowupDelayHours(val);
                }
              }}
              disabled={!isOwner}
              helperText="How long to wait before sending the follow-up (1-48 hours)"
              slotProps={{ htmlInput: { min: 1, max: 48 } }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Follow-up Message Template"
              value={autoFollowupMessage}
              onChange={(e) => setAutoFollowupMessage(e.target.value)}
              disabled={!isOwner}
              helperText="Use {customer_name} and {business_name} as placeholders"
              sx={{ mb: 2 }}
            />
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Preview
              </Typography>
              <Typography variant="body2">
                {autoFollowupMessage
                  .replace(/\{customer_name\}/g, 'Jane')
                  .replace(/\{business_name\}/g, org.name || 'Your Business')}
              </Typography>
            </Paper>
          </>
        )}
      </Paper>

      {/* Thank You Page */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Gift size={20} />
          <Typography variant="h6">
            Thank You Page
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Customize the message customers see after submitting a review.
        </Typography>

        {/* Positive Review Messages */}
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'success.main', fontWeight: 700 }}>
          Positive Review (4-5 stars)
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Title"
              value={tyPositiveTitle}
              onChange={(e) => setTyPositiveTitle(e.target.value)}
              disabled={!isOwner}
              placeholder="Thank You!"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Message"
              value={tyPositiveMessage}
              onChange={(e) => setTyPositiveMessage(e.target.value)}
              disabled={!isOwner}
              placeholder="We really appreciate your feedback..."
            />
          </Grid>
        </Grid>

        {/* Negative Review Messages */}
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'warning.main', fontWeight: 700 }}>
          Negative Review (1-3 stars)
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Title"
              value={tyNegativeTitle}
              onChange={(e) => setTyNegativeTitle(e.target.value)}
              disabled={!isOwner}
              placeholder="Thank You for Your Feedback"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Message"
              value={tyNegativeMessage}
              onChange={(e) => setTyNegativeMessage(e.target.value)}
              disabled={!isOwner}
              placeholder="We appreciate you letting us know..."
            />
          </Grid>
        </Grid>

        {/* Coupon Code */}
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
          Coupon / Discount (Optional)
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Coupon Code"
              value={tyCouponCode}
              onChange={(e) => setTyCouponCode(e.target.value)}
              disabled={!isOwner}
              placeholder="e.g. THANKYOU10"
              helperText="Leave empty to hide the coupon section"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Coupon Text"
              value={tyCouponText}
              onChange={(e) => setTyCouponText(e.target.value)}
              disabled={!isOwner}
              placeholder="Here's a little thank you from us:"
            />
          </Grid>
        </Grid>

        {/* Social Links */}
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
          Social Media Links (Optional)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Show &ldquo;Follow us&rdquo; buttons on the thank-you page after a review.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Instagram URL"
              value={tySocialInstagram}
              onChange={(e) => setTySocialInstagram(e.target.value)}
              disabled={!isOwner}
              placeholder="https://instagram.com/yourbusiness"
              slotProps={{
                input: {
                  startAdornment: <Instagram size={18} style={{ marginRight: 8, color: '#E4405F' }} />,
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Facebook URL"
              value={tySocialFacebook}
              onChange={(e) => setTySocialFacebook(e.target.value)}
              disabled={!isOwner}
              placeholder="https://facebook.com/yourbusiness"
              slotProps={{
                input: {
                  startAdornment: <Facebook size={18} style={{ marginRight: 8, color: '#1877F2' }} />,
                },
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {isOwner && (
        <Button
          variant="contained"
          startIcon={<Save size={18} />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Review Experience'}
        </Button>
      )}
    </Box>
  );
}
