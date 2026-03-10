'use client';

import { useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Grid,
  Switch, FormControlLabel,
} from '@mui/material';
import { Save, Gift, Instagram, Facebook, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import type { Organization } from '@/lib/types/database';

interface ReviewExperienceFormProps {
  org: Organization;
  isOwner: boolean;
}

export function ReviewExperienceForm({ org, isOwner }: ReviewExperienceFormProps) {
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

  return (
    <Box sx={{ maxWidth: 700 }}>
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
          Show social media buttons on the thank-you page so customers can follow you.
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
