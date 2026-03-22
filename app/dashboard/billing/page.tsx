import { Box, Paper, Typography, Chip, Divider, LinearProgress, Alert } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { createStripeClient } from '@/lib/stripe/server';
import { redirect } from 'next/navigation';
import { CreditCard, Check, Calendar, Receipt, Shield, Clock, AlertTriangle } from 'lucide-react';
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

function getTrialBarColor(daysLeft: number): string {
  if (daysLeft > 7) return 'linear-gradient(90deg, #16a34a, #22c55e)';
  if (daysLeft > 3) return 'linear-gradient(90deg, #f59e0b, #f97316)';
  return 'linear-gradient(90deg, #dc2626, #ef4444)';
}

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

  // All billing data comes from Stripe — DB is synced as self-healing mechanism
  let stripeTrialEnd: Date | null = null;
  let stripeNextBillingDate: Date | null = null;
  let cardBrand: string | null = null;
  let cardLast4: string | null = null;

  if (org.stripe_customer_id) {
    try {
      const stripe = createStripeClient();

      // Verify customer still exists (not deleted) before querying subscriptions
      const customer = await stripe.customers.retrieve(org.stripe_customer_id);
      if (customer.deleted) {
        // Clear stale customer — will fall through to show cancelled/resubscribe state
        await supabase
          .from('organizations')
          .update({ stripe_customer_id: null, stripe_subscription_id: null, billing_plan: 'cancelled' })
          .eq('id', org.id);
        org.stripe_customer_id = null;
        org.stripe_subscription_id = null;
        org.billing_plan = 'cancelled';
      }

      const subscriptions = org.stripe_customer_id
        ? await stripe.subscriptions.list({
            customer: org.stripe_customer_id,
            limit: 1,
          })
        : { data: [] };

      const stripeSub = subscriptions.data[0];

      if (stripeSub) {
        // Extract Stripe data for display
        if (stripeSub.trial_end) {
          stripeTrialEnd = new Date(stripeSub.trial_end * 1000);
        }

        // Next billing date: trial_end for trialing, or from subscription items for active
        if (stripeSub.status === 'trialing' && stripeSub.trial_end) {
          stripeNextBillingDate = new Date(stripeSub.trial_end * 1000);
        } else if (stripeSub.status === 'active' && !stripeSub.cancel_at_period_end) {
          const firstItem = stripeSub.items?.data?.[0];
          if (firstItem?.current_period_end) {
            stripeNextBillingDate = new Date(firstItem.current_period_end * 1000);
          }
        }

        // Sync DB state from Stripe
        let correctPlan = org.billing_plan;
        let correctSubEnd: string | null = org.subscription_ends_at;
        let correctTrialEnd: string | null = org.trial_ends_at;

        if (stripeSub.status === 'active' && !stripeSub.cancel_at_period_end) {
          correctPlan = 'active';
          correctSubEnd = null;
          correctTrialEnd = null;
        } else if (stripeSub.status === 'active' && stripeSub.cancel_at_period_end) {
          correctPlan = 'cancelling';
          correctSubEnd = stripeSub.cancel_at
            ? new Date(stripeSub.cancel_at * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        } else if (stripeSub.status === 'trialing') {
          correctPlan = stripeSub.cancel_at_period_end ? 'cancelling' : 'trial';
          correctTrialEnd = stripeSub.trial_end
            ? new Date(stripeSub.trial_end * 1000).toISOString()
            : org.trial_ends_at;
        } else if (stripeSub.status === 'past_due') {
          correctPlan = 'past_due';
        } else if (stripeSub.status === 'canceled') {
          correctPlan = 'cancelled';
        }

        // Update DB if out of sync
        if (correctPlan !== org.billing_plan || correctSubEnd !== org.subscription_ends_at || correctTrialEnd !== org.trial_ends_at) {
          await supabase
            .from('organizations')
            .update({
              billing_plan: correctPlan,
              subscription_ends_at: correctSubEnd,
              trial_ends_at: correctTrialEnd,
              stripe_subscription_id: stripeSub.id,
            })
            .eq('id', org.id);

          org.billing_plan = correctPlan;
          org.subscription_ends_at = correctSubEnd;
          org.stripe_subscription_id = stripeSub.id;
          org.trial_ends_at = correctTrialEnd;
        }
      } else {
        // No Stripe subscription found
        if (org.billing_plan === 'active') {
          await supabase
            .from('organizations')
            .update({ billing_plan: 'cancelled', stripe_subscription_id: null })
            .eq('id', org.id);
          org.billing_plan = 'cancelled';
        }
      }

      // Fetch payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: org.stripe_customer_id,
        type: 'card',
        limit: 1,
      });
      const pm = paymentMethods.data[0];
      if (pm?.card) {
        cardBrand = pm.card.brand;
        cardLast4 = pm.card.last4;
      }
    } catch (e) {
      console.error('Stripe sync error on billing page:', e);
    }
  }

  const isTrialing = org.billing_plan === 'trial';
  const isActive = org.billing_plan === 'active';
  const isPastDue = org.billing_plan === 'past_due';
  const isCancelled = org.billing_plan === 'cancelled';
  const isCancelling = org.billing_plan === 'cancelling';
  const isPending = org.billing_plan === 'pending';
  const isCancellingTrial = isCancelling && !org.subscription_ends_at && !!org.trial_ends_at;
  const isCancellingPaid = isCancelling && !!org.subscription_ends_at;

  const trialEndDate = stripeTrialEnd || (org.trial_ends_at ? new Date(org.trial_ends_at) : null);
  const trialDaysLeft = trialEndDate
    ? Math.max(0, Math.floor((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const trialTotalDays = 14;
  const trialProgress = (isTrialing || isCancellingTrial) ? ((trialTotalDays - trialDaysLeft) / trialTotalDays) * 100 : 0;

  const subDaysLeft = org.subscription_ends_at
    ? Math.max(0, Math.ceil((new Date(org.subscription_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const statusConfig = isActive
    ? { label: 'Active', gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }
    : isCancellingTrial
      ? { label: 'Trial Cancelled', gradient: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)' }
      : isCancellingPaid
        ? { label: 'Cancelling', gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)' }
        : isTrialing
          ? { label: '14-Day Free Trial', gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }
          : isPastDue
            ? { label: 'Past Due', gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' }
            : isPending
              ? { label: 'Setup Incomplete', gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }
              : isCancelled
                ? { label: 'Cancelled', gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' }
                : { label: 'Inactive', gradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)' };

  const formatCardBrand = (brand: string) => {
    const brands: Record<string, string> = {
      visa: 'Visa',
      mastercard: 'Mastercard',
      amex: 'Amex',
      discover: 'Discover',
      diners: 'Diners',
      jcb: 'JCB',
      unionpay: 'UnionPay',
    };
    return brands[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

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
              {isTrialing || isCancellingTrial ? <Clock size={24} color="white" /> : <CreditCard size={24} color="white" />}
            </Box>

            {(isTrialing || isCancellingTrial) ? (
              <>
                <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5, fontSize: '0.7rem' }}>
                  {org.name}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                  {isCancellingTrial ? 'Trial Cancelled' : 'You\'re on a 14-Day Free Trial'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                  {isCancellingTrial
                    ? `You still have access until your trial ends. Subscribe to keep your data.`
                    : stripeNextBillingDate
                      ? `Your card will be charged $79/mo on ${stripeNextBillingDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                      : 'Full access to every feature. No charge until the trial ends.'}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1.5, fontSize: '0.7rem' }}>
                  {org.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                  <Typography variant="h3" fontWeight={800}>$79</Typography>
                  <Typography variant="h6" sx={{ opacity: 0.8 }}>/mo</Typography>
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ px: 4, py: 3 }}>
            {/* Trial countdown */}
            {(isTrialing || isCancellingTrial) && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Calendar size={14} />
                    <Typography variant="body2" fontWeight={600}>
                      {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {trialDaysLeft} of {trialTotalDays}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={trialProgress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: getTrialBarColor(trialDaysLeft),
                    },
                  }}
                />
                {trialEndDate && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Trial ends {trialEndDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </Typography>
                )}

                {trialDaysLeft <= 3 && trialDaysLeft > 0 && (
                  <Alert severity="warning" icon={<AlertTriangle size={18} />} sx={{ mt: 2 }}>
                    Your trial ends soon. Subscribe now to keep access to all features and your data.
                  </Alert>
                )}

                {trialDaysLeft === 0 && (
                  <Alert severity="error" icon={<AlertTriangle size={18} />} sx={{ mt: 2 }}>
                    Your trial has expired. Subscribe to continue using InsightReviews.
                  </Alert>
                )}

                <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: 'action.hover', textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    After trial: <strong>$79/mo</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cancel anytime — no lock-in, no questions asked
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Subscription status */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Status
              </Typography>
              <Chip
                label={statusConfig.label}
                size="small"
                sx={{
                  fontWeight: 600,
                  background: statusConfig.gradient,
                  color: 'white',
                }}
              />
            </Box>

            {isCancelling && org.subscription_ends_at && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Your subscription has been cancelled. You have access until {new Date(org.subscription_ends_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}.
                </Alert>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, 100 - (subDaysLeft / 30) * 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #dc2626, #f97316)',
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {subDaysLeft} days remaining
                </Typography>
              </Box>
            )}

            {isPastDue && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Your last payment failed. Please update your payment method to avoid losing access.
              </Alert>
            )}

            {isCancelled && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Your subscription has been cancelled. Subscribe again to regain access to your data.
              </Alert>
            )}

            {isPending && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Complete your setup by adding a payment method. Your 14-day free trial starts once you add a card.
              </Alert>
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
              <Typography variant="body2" fontWeight={600}>
                {isTrialing || isCancellingTrial ? '14-Day Free Trial' : 'InsightReviews — $79/mo'}
              </Typography>
            </Box>
            {(isTrialing || isCancellingTrial) && trialEndDate && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Trial ends</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={14} />
                  <Typography variant="body2" fontWeight={600}>
                    {trialEndDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
            )}
            {isActive && stripeNextBillingDate && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Next payment</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={14} />
                  <Typography variant="body2" fontWeight={600}>
                    $79 on {stripeNextBillingDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Payment method</Typography>
              <Typography variant="body2" fontWeight={600}>
                {cardBrand && cardLast4
                  ? `${formatCardBrand(cardBrand)} •••• ${cardLast4}`
                  : org.stripe_customer_id ? 'None' : 'Not set up'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
