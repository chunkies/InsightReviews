import { Box, Paper, Typography, Chip, Divider, LinearProgress } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreditCard, Check, Calendar, Receipt, Shield } from 'lucide-react';
import { BillingActions } from '@/components/settings/billing-actions';

const planFeatures = [
  'Unlimited reviews',
  'Smart review routing to Google, Yelp & more',
  'QR code + SMS review collection',
  'Real-time dashboard & analytics',
  'Auto-sync with review platforms',
  'Public testimonial wall',
  'Private negative feedback capture',
  'Staff accounts & team management',
  'Email & SMS notifications',
  'Custom branding',
];

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'owner') redirect('/dashboard');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, billing_plan, trial_ends_at, stripe_customer_id, stripe_subscription_id, subscription_ends_at')
    .eq('id', member.organization_id)
    .single();

  if (!org) redirect('/onboarding');

  const isTrialing = org.billing_plan === 'trial';
  const isActive = org.billing_plan === 'active';
  const isPastDue = org.billing_plan === 'past_due';
  const isCancelled = org.billing_plan === 'cancelled';
  const isCancelling = org.billing_plan === 'cancelling';

  const trialDaysLeft = org.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const trialTotalDays = 14;
  const trialProgress = isTrialing ? ((trialTotalDays - trialDaysLeft) / trialTotalDays) * 100 : 0;

  const subDaysLeft = org.subscription_ends_at
    ? Math.max(0, Math.ceil((new Date(org.subscription_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const statusConfig = isActive
    ? { label: 'Active', color: 'success' as const, gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }
    : isCancelling
      ? { label: `Cancelling · ${subDaysLeft} days left`, color: 'warning' as const, gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)' }
      : isTrialing
        ? { label: `Trial · ${trialDaysLeft} days left`, color: 'warning' as const, gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }
        : isPastDue
          ? { label: 'Past Due', color: 'error' as const, gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }
          : isCancelled
            ? { label: 'Cancelled', color: 'error' as const, gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' }
            : { label: 'Inactive', color: 'error' as const, gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 560 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Billing</Typography>
          <Typography variant="body2" color="text.secondary">Manage your subscription and payment</Typography>
        </Box>

        {/* Status card */}
        <Paper
          sx={{
            p: 0,
            mb: 3,
            overflow: 'hidden',
            border: isPastDue ? '2px solid' : 'none',
            borderColor: isPastDue ? 'error.main' : undefined,
          }}
        >
          <Box
            sx={{
              background: statusConfig.gradient,
              px: 4,
              py: 3,
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
              }}
            >
              <CreditCard size={24} color="white" />
            </Box>
            <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5, fontSize: '0.7rem' }}>
              {org.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
              <Typography variant="h3" fontWeight={800}>$79</Typography>
              <Typography variant="h6" sx={{ opacity: 0.8 }}>/mo</Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              per location
            </Typography>
          </Box>

          <Box sx={{ px: 4, py: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Subscription Status
              </Typography>
              <Chip label={statusConfig.label} color={statusConfig.color} size="small" />
            </Box>

            {isTrialing && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Trial progress</Typography>
                  <Typography variant="caption" color="text.secondary">{trialDaysLeft} of {trialTotalDays} days remaining</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={trialProgress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                    },
                  }}
                />
                {trialDaysLeft <= 3 && trialDaysLeft > 0 && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                    Your trial ends soon. Subscribe to keep access to all features.
                  </Typography>
                )}
              </Box>
            )}

            {isCancelling && org.subscription_ends_at && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                  Your subscription has been cancelled. You have access until {new Date(org.subscription_ends_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}.
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, 100 - (subDaysLeft / 30) * 100)}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #dc2626, #f97316)',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {subDaysLeft} days remaining · Subscribe again to keep your account
                </Typography>
              </Box>
            )}

            {isPastDue && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                Your last payment failed. Please update your payment method to avoid service interruption.
              </Typography>
            )}

            {isCancelled && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your subscription has been cancelled. Subscribe again to regain access.
              </Typography>
            )}

            <BillingActions
              orgId={org.id}
              hasSubscription={!!org.stripe_customer_id}
              hasActiveSubscription={!!org.stripe_subscription_id}
              billingPlan={org.billing_plan ?? 'pending'}
            />
          </Box>
        </Paper>

        {/* What's included */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Shield size={18} />
            <Typography variant="subtitle2" fontWeight={700}>
              What&apos;s Included
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
            }}
          >
            {planFeatures.map((feature) => (
              <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Check size={14} color="#16a34a" />
                <Typography variant="body2" color="text.secondary">{feature}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Billing info */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Receipt size={18} />
            <Typography variant="subtitle2" fontWeight={700}>
              Billing Info
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Plan</Typography>
              <Typography variant="body2" fontWeight={600}>InsightReviews Pro</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Price</Typography>
              <Typography variant="body2" fontWeight={600}>$79/month per location</Typography>
            </Box>
            {isTrialing && org.trial_ends_at && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Trial ends</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={14} />
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(org.trial_ends_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Payment method</Typography>
              <Typography variant="body2" fontWeight={600}>
                {org.stripe_customer_id ? 'Card on file' : 'None'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
